import "server-only";
import {
  getCarsCollection,
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  getAdminUsersCollection,
  serializeDocument,
} from "@/lib/models";
import type {
  ActivityItem,
  DashboardData,
  DayBookingData,
  MonthlyBookingData,
  PieSlice,
  PopularCarData,
  PriceRangeData,
} from "./types";

// ── Helpers ──────────────────────────────────────────────────
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Map MongoDB's $dayOfWeek (1 = Sunday … 7 = Saturday) to the
// Mon-first labels the chart expects.
const MONGO_DAY_TO_LABEL: Record<number, string> = {
  1: "Sun",
  2: "Mon",
  3: "Tue",
  4: "Wed",
  5: "Thu",
  6: "Fri",
  7: "Sat",
};

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

/** Parse the search-param based range into a { from, to } Date pair */
export function parseDateRange(
  range?: string | null,
  from?: string | null,
  to?: string | null
): { from: Date | null; to: Date | null } {
  const now = new Date();

  if (!range || range === "all") return { from: null, to: null };

  const dayMatch = range.match(/^(\d+)d$/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: now };
  }

  if (range.startsWith("month-")) {
    const idx = parseInt(range.split("-")[1]);
    if (!isNaN(idx) && idx >= 0 && idx < 12) {
      const year = now.getFullYear();
      const start = new Date(year, idx, 1);
      const end = new Date(year, idx + 1, 0, 23, 59, 59, 999);
      return { from: start, to: end };
    }
  }

  if (range === "custom" && from && to) {
    return {
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T23:59:59.999`),
    };
  }

  return { from: null, to: null };
}

/**
 * Resolve the "Upcoming Appointments" look-ahead window from the `upcoming`
 * search param. This is deliberately INDEPENDENT of `parseDateRange` (which
 * drives the past-facing KPI/chart filter at the top of the page): the
 * upcoming card has its own future-facing selector.
 *
 *   "Nd"          → today … today+N days
 *   "all"         → today … unbounded
 *   "YYYY-MM-DD"  → today … that date (clamped to ≥ today)
 *   <unset>       → today … today+30 days (default)
 *
 * Returns "YYYY-MM-DD" strings so they compare directly against the string
 * `appointmentDate` field. `toStr` is null when there is no upper bound.
 */
export function parseUpcomingWindow(
  upcoming: string | null | undefined,
  todayStr: string
): { fromStr: string; toStr: string | null } {
  const addDays = (n: number): string => {
    const d = new Date(`${todayStr}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().split("T")[0];
  };

  if (upcoming === "all") return { fromStr: todayStr, toStr: null };

  const dayMatch = upcoming?.match(/^(\d+)d$/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    if (!isNaN(days) && days > 0) {
      return { fromStr: todayStr, toStr: addDays(days) };
    }
  }

  if (upcoming && /^\d{4}-\d{2}-\d{2}$/.test(upcoming)) {
    // Explicit future date — never look backwards from today.
    return {
      fromStr: todayStr,
      toStr: upcoming < todayStr ? todayStr : upcoming,
    };
  }

  return { fromStr: todayStr, toStr: addDays(30) };
}

// ═════════════════════════════════════════════════════════════
// getDashboardData — Mongo-side aggregation for the admin dashboard.
//
// Everything that used to be `find({}).toArray()` followed by JS counting
// now runs as `$facet` pipelines server-side. The output shape is unchanged;
// only the data path is. See Day 11.1 / Finding #47.
// ═════════════════════════════════════════════════════════════

interface DateFilter {
  range?: string | null;
  from?: string | null;
  to?: string | null;
  /** Future look-ahead window for the Upcoming Appointments card. */
  upcoming?: string | null;
}

const PRICE_BUCKET_RANGES: PriceRangeData[] = [
  { range: "< £5k", count: 0 },
  { range: "£5k–£10k", count: 0 },
  { range: "£10k–£20k", count: 0 },
  { range: "£20k–£30k", count: 0 },
  { range: "£30k–£50k", count: 0 },
  { range: "£50k+", count: 0 },
];

const PRICE_BUCKET_BOUNDARIES = [0, 5000, 10000, 20000, 30000, 50000, 1e12];

type CountRow<K = string> = { _id: K; count: number };
type TotalRow = { _id: null; total: number };

interface CarsFacet {
  statusCounts: CountRow<string>[];
  inventoryValue: TotalRow[];
  soldValue: TotalRow[];
  fuelCounts: CountRow<string>[];
  priceBuckets: CountRow<number>[]; // _id is the lower bound of the bucket
  total: { value: number }[];
}

interface BookingsFacet {
  statusCounts: CountRow<string>[];
  monthly: CountRow<string>[]; // _id = "%b %y"
  dayOfWeek: CountRow<number>[]; // _id = $dayOfWeek result (1–7)
  total: { value: number }[];
}

interface ServiceFacet extends BookingsFacet {
  serviceTypeCounts: CountRow<string>[];
}

interface ViewingFacet extends BookingsFacet {
  popularCars: CountRow<string>[];
}

function statusCount(rows: CountRow<string>[], status: string): number {
  return rows.find((r) => r._id === status)?.count ?? 0;
}

function totalFromRow(rows: TotalRow[]): number {
  return rows[0]?.total ?? 0;
}

function totalFromCountStage(rows: { value: number }[]): number {
  return rows[0]?.value ?? 0;
}

// Fill in zero-counts for every month between chartStart and chartEnd so the
// chart x-axis is dense even if Mongo only returned non-empty months.
function ymKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthlySeries(
  service: CountRow<string>[],
  viewing: CountRow<string>[],
  chartStart: Date,
  chartEnd: Date
): MonthlyBookingData[] {
  // The Mongo facet emits rows keyed by "YYYY-MM"; we walk the chart range and
  // convert each month to its display label so the x-axis stays dense even
  // when a month has zero bookings.
  const serviceByKey = new Map(service.map((r) => [r._id, r.count]));
  const viewingByKey = new Map(viewing.map((r) => [r._id, r.count]));

  const series: MonthlyBookingData[] = [];
  const seen = new Set<string>();
  const cursor = new Date(chartStart.getFullYear(), chartStart.getMonth(), 1);
  while (cursor <= chartEnd) {
    const key = ymKey(cursor);
    if (!seen.has(key)) {
      seen.add(key);
      series.push({
        month: getMonthLabel(cursor),
        services: serviceByKey.get(key) ?? 0,
        viewings: viewingByKey.get(key) ?? 0,
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return series;
}

function buildDayOfWeekSeries(
  service: CountRow<number>[],
  viewing: CountRow<number>[]
): DayBookingData[] {
  const tally: Record<string, number> = Object.fromEntries(
    DAY_LABELS.map((d) => [d, 0])
  );
  for (const row of [...service, ...viewing]) {
    const label = MONGO_DAY_TO_LABEL[row._id];
    if (label && label in tally) tally[label] += row.count;
  }
  return DAY_LABELS.map((day) => ({ day, count: tally[day] }));
}

function buildPriceDistribution(buckets: CountRow<number>[]): PriceRangeData[] {
  return PRICE_BUCKET_RANGES.map((row, i) => {
    const lo = PRICE_BUCKET_BOUNDARIES[i];
    const match = buckets.find((b) => b._id === lo);
    return { range: row.range, count: match?.count ?? 0 };
  });
}

function buildFuelSlices(rows: CountRow<string>[]): PieSlice[] {
  return rows.map((r) => ({ name: r._id, value: r.count }));
}

function buildServiceTypeSlices(rows: CountRow<string>[]): PieSlice[] {
  return rows
    .map((r) => ({ name: r._id, value: r.count }))
    .sort((a, b) => b.value - a.value);
}

function buildPopularCars(rows: CountRow<string>[]): PopularCarData[] {
  return rows
    .map((r) => ({ label: r._id, count: r.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// Loosely-typed view of a serialized booking doc tagged with its source.
// Both ServiceAppointment and CarViewingBooking are structurally assignable.
interface ActivitySource {
  _type: "service" | "viewing";
  bookingReference: string;
  customerInfo?: { name?: string };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  serviceType?: string;
  carDetails?: { year?: number | string; make?: string; model?: string };
  createdAt?: string | Date;
}

// Single source of truth for the row shape shared by the recent / upcoming /
// needs-attention lists, so the three call sites stay identical.
function toActivityItem(b: ActivitySource): ActivityItem {
  return {
    type: b._type,
    reference: b.bookingReference,
    customer: b.customerInfo?.name || "Unknown",
    date: b.appointmentDate,
    time: b.appointmentTime,
    status: b.status,
    detail:
      b._type === "viewing" && b.carDetails
        ? `${b.carDetails.year ?? ""} ${b.carDetails.make ?? ""} ${b.carDetails.model ?? ""}`.trim()
        : b.serviceType || "",
    createdAt:
      b.createdAt instanceof Date
        ? b.createdAt.toISOString()
        : b.createdAt
          ? String(b.createdAt)
          : undefined,
  };
}

export async function getDashboardData(
  dateFilter?: DateFilter
): Promise<DashboardData> {
  const { from: rangeFrom, to: rangeTo } = parseDateRange(
    dateFilter?.range,
    dateFilter?.from,
    dateFilter?.to
  );

  const bookingDateMatch =
    rangeFrom && rangeTo
      ? { $match: { createdAt: { $gte: rangeFrom, $lte: rangeTo } } }
      : null;

  const [carsCol, serviceCol, viewingCol, usersCol] = await Promise.all([
    getCarsCollection(),
    getServiceAppointmentsCollection(),
    getCarViewingBookingsCollection(),
    getAdminUsersCollection(),
  ]);

  // ── Cars aggregate (inventory is point-in-time, never date-filtered) ──
  const carsPipeline = [
    {
      $facet: {
        statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        inventoryValue: [
          { $match: { status: { $in: ["available", "reserved"] } } },
          {
            $group: {
              _id: null,
              total: { $sum: { $ifNull: ["$price", 0] } },
            },
          },
        ],
        soldValue: [
          { $match: { status: "sold" } },
          {
            $group: {
              _id: null,
              total: { $sum: { $ifNull: ["$price", 0] } },
            },
          },
        ],
        fuelCounts: [
          {
            $group: {
              _id: { $ifNull: ["$fuel", "Unknown"] },
              count: { $sum: 1 },
            },
          },
        ],
        priceBuckets: [
          {
            $bucket: {
              groupBy: { $ifNull: ["$price", 0] },
              boundaries: PRICE_BUCKET_BOUNDARIES,
              default: "missing",
              output: { count: { $sum: 1 } },
            },
          },
        ],
        total: [{ $count: "value" }],
      },
    },
  ];

  // ── Service bookings facet ──
  const servicePipeline = [
    ...(bookingDateMatch ? [bookingDateMatch] : []),
    {
      $facet: {
        statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        monthly: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
        ],
        dayOfWeek: [
          {
            $match: {
              appointmentDate: { $exists: true, $ne: null, $type: "string" },
            },
          },
          {
            $group: {
              _id: {
                $dayOfWeek: {
                  $dateFromString: { dateString: "$appointmentDate" },
                },
              },
              count: { $sum: 1 },
            },
          },
        ],
        serviceTypeCounts: [
          {
            $project: {
              key: {
                $let: {
                  vars: { type: { $ifNull: ["$serviceType", "Other"] } },
                  in: {
                    $cond: [
                      { $gt: [{ $indexOfBytes: ["$$type", "—"] }, -1] },
                      {
                        $trim: {
                          input: {
                            $arrayElemAt: [{ $split: ["$$type", "—"] }, 0],
                          },
                        },
                      },
                      "$$type",
                    ],
                  },
                },
              },
            },
          },
          { $group: { _id: "$key", count: { $sum: 1 } } },
        ],
        total: [{ $count: "value" }],
      },
    },
  ];

  // ── Viewing bookings facet ──
  const viewingPipeline = [
    ...(bookingDateMatch ? [bookingDateMatch] : []),
    {
      $facet: {
        statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        monthly: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
        ],
        dayOfWeek: [
          {
            $match: {
              appointmentDate: { $exists: true, $ne: null, $type: "string" },
            },
          },
          {
            $group: {
              _id: {
                $dayOfWeek: {
                  $dateFromString: { dateString: "$appointmentDate" },
                },
              },
              count: { $sum: 1 },
            },
          },
        ],
        popularCars: [
          { $match: { carDetails: { $type: "object" } } },
          {
            $group: {
              _id: {
                $concat: [
                  { $toString: { $ifNull: ["$carDetails.year", ""] } },
                  " ",
                  { $ifNull: ["$carDetails.make", ""] },
                  " ",
                  { $ifNull: ["$carDetails.model", ""] },
                ],
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ],
        total: [{ $count: "value" }],
      },
    },
  ];

  const now = new Date();
  // "Today" must be the dealership's local calendar date, not UTC — booking
  // `appointmentDate` strings are local-calendar dates (see format.ts), and a
  // raw toISOString() boundary is a day off in the late evening during BST.
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // ── Recent activity: PAST appointments only (already happened). ──
  // Independent of the top-of-page createdAt range — this card answers
  // "what recently took place", not "what was recently booked".
  const recentPastFilter = {
    appointmentDate: { $gte: "1900-01-01", $lt: todayStr },
  };
  const recentService = serviceCol
    .find(recentPastFilter)
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(10)
    .toArray();
  const recentViewing = viewingCol
    .find(recentPastFilter)
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(10)
    .toArray();

  // ── Upcoming appointments: future window that STILL NEEDS ACTIONING. ──
  // Window end is driven by the card's own future-date selector (the
  // `upcoming` param), kept separate from the top-of-page date filter.
  // Only pending/confirmed are surfaced — completed/cancelled need no action.
  const { fromStr: upcomingFromStr, toStr: upcomingToStr } =
    parseUpcomingWindow(dateFilter?.upcoming, todayStr);
  const upcomingMongoFilter = {
    appointmentDate: upcomingToStr
      ? { $gte: upcomingFromStr, $lte: upcomingToStr }
      : { $gte: upcomingFromStr },
    status: { $in: ["pending", "confirmed"] as const },
  };
  const upcomingService = serviceCol
    .find(upcomingMongoFilter)
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(8)
    .toArray();
  const upcomingViewing = viewingCol
    .find(upcomingMongoFilter)
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(8)
    .toArray();

  // ── Needs attention: PAST-dated appointments still stuck on `pending`. ──
  // A customer booked, the date came and went, and no admin ever confirmed
  // or closed it out. Surfaced in its own escalation strip; `total` is an
  // accurate count even when the displayed slice is capped.
  const needsAttentionFilter = {
    appointmentDate: { $gte: "1900-01-01", $lt: todayStr },
    status: "pending" as const,
  };
  const needsAttentionService = serviceCol
    .find(needsAttentionFilter)
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(12)
    .toArray();
  const needsAttentionViewing = viewingCol
    .find(needsAttentionFilter)
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .limit(12)
    .toArray();
  const needsAttentionServiceCount =
    serviceCol.countDocuments(needsAttentionFilter);
  const needsAttentionViewingCount =
    viewingCol.countDocuments(needsAttentionFilter);

  const [
    carsAgg,
    serviceAgg,
    viewingAgg,
    recentServiceDocs,
    recentViewingDocs,
    upcomingServiceDocs,
    upcomingViewingDocs,
    needsAttentionServiceDocs,
    needsAttentionViewingDocs,
    needsAttentionServiceTotal,
    needsAttentionViewingTotal,
    totalUsers,
  ] = await Promise.all([
    carsCol.aggregate<CarsFacet>(carsPipeline).next(),
    serviceCol.aggregate<ServiceFacet>(servicePipeline).next(),
    viewingCol.aggregate<ViewingFacet>(viewingPipeline).next(),
    recentService,
    recentViewing,
    upcomingService,
    upcomingViewing,
    needsAttentionService,
    needsAttentionViewing,
    needsAttentionServiceCount,
    needsAttentionViewingCount,
    usersCol.estimatedDocumentCount(),
  ]);

  // $facet always returns one row; coerce to typed defaults for empty collections.
  const carsResult: CarsFacet = carsAgg ?? {
    statusCounts: [],
    inventoryValue: [],
    soldValue: [],
    fuelCounts: [],
    priceBuckets: [],
    total: [],
  };
  const serviceResult: ServiceFacet = serviceAgg ?? {
    statusCounts: [],
    monthly: [],
    dayOfWeek: [],
    serviceTypeCounts: [],
    total: [],
  };
  const viewingResult: ViewingFacet = viewingAgg ?? {
    statusCounts: [],
    monthly: [],
    dayOfWeek: [],
    popularCars: [],
    total: [],
  };

  // ── KPI rollups ──
  const totalCars = totalFromCountStage(carsResult.total);
  const availableCars = statusCount(carsResult.statusCounts, "available");
  const soldCars = statusCount(carsResult.statusCounts, "sold");
  const reservedCars = statusCount(carsResult.statusCounts, "reserved");

  const totalServiceBookings = totalFromCountStage(serviceResult.total);
  const totalViewingBookings = totalFromCountStage(viewingResult.total);

  // ── Month-span (defaults to last 6 months when no filter) ──
  const chartStart =
    rangeFrom ??
    (() => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 5);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    })();
  const chartEnd = rangeTo ?? now;

  // ── Recent activity merge (PAST appointments, most recent first) ──
  const allRecent: ActivitySource[] = [
    ...recentServiceDocs.map((b) => ({
      ...serializeDocument(b),
      _type: "service" as const,
    })),
    ...recentViewingDocs.map((b) => ({
      ...serializeDocument(b),
      _type: "viewing" as const,
    })),
  ];
  // Most recent past appointment first; tie-break on when it was created.
  allRecent.sort((a, b) => {
    if (a.appointmentDate !== b.appointmentDate) {
      return a.appointmentDate < b.appointmentDate ? 1 : -1;
    }
    return (
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
    );
  });
  const recentActivity = allRecent.slice(0, 10).map(toActivityItem);

  // ── Upcoming merge (Mongo already filtered + sorted, just slice 8) ──
  const allUpcoming: ActivitySource[] = [
    ...upcomingServiceDocs.map((b) => ({
      ...serializeDocument(b),
      _type: "service" as const,
    })),
    ...upcomingViewingDocs.map((b) => ({
      ...serializeDocument(b),
      _type: "viewing" as const,
    })),
  ];
  // Soonest first; tie-break on time so same-day slots read in order.
  allUpcoming.sort((a, b) =>
    a.appointmentDate !== b.appointmentDate
      ? a.appointmentDate.localeCompare(b.appointmentDate)
      : (a.appointmentTime || "").localeCompare(b.appointmentTime || "")
  );
  const upcomingAppointments = allUpcoming.slice(0, 8).map(toActivityItem);

  // ── Needs-attention merge (overdue + unactioned; most recent lapse first) ──
  const allNeedsAttention: ActivitySource[] = [
    ...needsAttentionServiceDocs.map((b) => ({
      ...serializeDocument(b),
      _type: "service" as const,
    })),
    ...needsAttentionViewingDocs.map((b) => ({
      ...serializeDocument(b),
      _type: "viewing" as const,
    })),
  ];
  allNeedsAttention.sort((a, b) =>
    a.appointmentDate !== b.appointmentDate
      ? b.appointmentDate.localeCompare(a.appointmentDate)
      : (b.appointmentTime || "").localeCompare(a.appointmentTime || "")
  );
  const needsAttention = {
    items: allNeedsAttention.slice(0, 8).map(toActivityItem),
    total: needsAttentionServiceTotal + needsAttentionViewingTotal,
  };

  return {
    kpis: {
      totalCars,
      availableCars,
      soldCars,
      reservedCars,
      totalServiceBookings,
      pendingServiceBookings: statusCount(
        serviceResult.statusCounts,
        "pending"
      ),
      confirmedServiceBookings: statusCount(
        serviceResult.statusCounts,
        "confirmed"
      ),
      completedServiceBookings: statusCount(
        serviceResult.statusCounts,
        "completed"
      ),
      cancelledServiceBookings: statusCount(
        serviceResult.statusCounts,
        "cancelled"
      ),
      totalViewingBookings,
      pendingViewingBookings: statusCount(
        viewingResult.statusCounts,
        "pending"
      ),
      confirmedViewingBookings: statusCount(
        viewingResult.statusCounts,
        "confirmed"
      ),
      completedViewingBookings: statusCount(
        viewingResult.statusCounts,
        "completed"
      ),
      cancelledViewingBookings: statusCount(
        viewingResult.statusCounts,
        "cancelled"
      ),
      totalInventoryValue: totalFromRow(carsResult.inventoryValue),
      totalSoldValue: totalFromRow(carsResult.soldValue),
      totalUsers,
    },
    charts: {
      bookingsByMonth: buildMonthlySeries(
        serviceResult.monthly,
        viewingResult.monthly,
        chartStart,
        chartEnd
      ),
      bookingsByDay: buildDayOfWeekSeries(
        serviceResult.dayOfWeek,
        viewingResult.dayOfWeek
      ),
      inventoryByFuel: buildFuelSlices(carsResult.fuelCounts),
      inventoryByStatus: [
        { name: "Available", value: availableCars, colour: "#22c55e" },
        { name: "Sold", value: soldCars, colour: "#dc2626" },
        { name: "Reserved", value: reservedCars, colour: "#f59e0b" },
      ],
      serviceTypeBreakdown: buildServiceTypeSlices(
        serviceResult.serviceTypeCounts
      ),
      priceDistribution: buildPriceDistribution(carsResult.priceBuckets),
      popularCars: buildPopularCars(viewingResult.popularCars),
    },
    recentActivity,
    upcomingAppointments,
    needsAttention,
  };
}
