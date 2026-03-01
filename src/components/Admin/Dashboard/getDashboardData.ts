import "server-only";
import {
  getCarsCollection,
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  getAdminUsersCollection,
  serializeDocument,
} from "@/lib/models";
import type { DashboardData } from "./types";

// ── Helpers ──────────────────────────────────────────────────
function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function getDayLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "short" });
}

/** Parse the search-param based range into a { from, to } Date pair */
export function parseDateRange(
  range?: string | null,
  from?: string | null,
  to?: string | null
): { from: Date | null; to: Date | null } {
  const now = new Date();

  if (!range || range === "all") return { from: null, to: null };

  // Preset days  (7d / 14d / 21d / 30d)
  const dayMatch = range.match(/^(\d+)d$/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: now };
  }

  // Specific month  (month-0 … month-11)
  if (range.startsWith("month-")) {
    const idx = parseInt(range.split("-")[1]);
    if (!isNaN(idx) && idx >= 0 && idx < 12) {
      const year = now.getFullYear();
      const start = new Date(year, idx, 1);
      const end = new Date(year, idx + 1, 0, 23, 59, 59, 999);
      return { from: start, to: end };
    }
  }

  // Custom range
  if (range === "custom" && from && to) {
    return {
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T23:59:59.999`),
    };
  }

  return { from: null, to: null };
}

// ═════════════════════════════════════════════════════════════
// getDashboardData — fetches all analytics directly from MongoDB
// Called server-side only from the dashboard page component
// ═════════════════════════════════════════════════════════════

interface DateFilter {
  range?: string | null;
  from?: string | null;
  to?: string | null;
}

export async function getDashboardData(
  dateFilter?: DateFilter
): Promise<DashboardData> {
  // Fetch all collections in parallel
  const [carsCol, serviceCol, viewingCol, usersCol] = await Promise.all([
    getCarsCollection(),
    getServiceAppointmentsCollection(),
    getCarViewingBookingsCollection(),
    getAdminUsersCollection(),
  ]);

  const [allCars, allServiceBookings, allViewingBookings, users] =
    await Promise.all([
      carsCol.find({}).toArray(),
      serviceCol.find({}).sort({ createdAt: -1 }).toArray(),
      viewingCol.find({}).sort({ createdAt: -1 }).toArray(),
      usersCol.find({}).toArray(),
    ]);

  // ── Date-range filtering ─────────────────────────────
  const { from: rangeFrom, to: rangeTo } = parseDateRange(
    dateFilter?.range,
    dateFilter?.from,
    dateFilter?.to
  );

  const inRange = (dateVal: unknown): boolean => {
    if (!rangeFrom || !rangeTo) return true;
    const d = dateVal instanceof Date ? dateVal : new Date(String(dateVal));
    return d >= rangeFrom && d <= rangeTo;
  };

  // Cars are never filtered by date (inventory is point-in-time)
  const cars = allCars;
  // Bookings are filtered by createdAt
  const serviceBookings = allServiceBookings.filter((b) =>
    inRange(b.createdAt)
  );
  const viewingBookings = allViewingBookings.filter((b) =>
    inRange(b.createdAt)
  );

  // ── KPI Stats ──────────────────────────────────────────
  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.status === "available").length;
  const soldCars = cars.filter((c) => c.status === "sold").length;
  const reservedCars = cars.filter((c) => c.status === "reserved").length;

  const totalServiceBookings = serviceBookings.length;
  const pendingServiceBookings = serviceBookings.filter(
    (b) => b.status === "pending"
  ).length;
  const confirmedServiceBookings = serviceBookings.filter(
    (b) => b.status === "confirmed"
  ).length;
  const completedServiceBookings = serviceBookings.filter(
    (b) => b.status === "completed"
  ).length;
  const cancelledServiceBookings = serviceBookings.filter(
    (b) => b.status === "cancelled"
  ).length;

  const totalViewingBookings = viewingBookings.length;
  const pendingViewingBookings = viewingBookings.filter(
    (b) => b.status === "pending"
  ).length;
  const confirmedViewingBookings = viewingBookings.filter(
    (b) => b.status === "confirmed"
  ).length;
  const completedViewingBookings = viewingBookings.filter(
    (b) => b.status === "completed"
  ).length;
  const cancelledViewingBookings = viewingBookings.filter(
    (b) => b.status === "cancelled"
  ).length;

  // ── Revenue / Inventory Value ──────────────────────────
  const totalInventoryValue = cars
    .filter((c) => c.status === "available" || c.status === "reserved")
    .reduce((sum, c) => sum + (c.price || 0), 0);

  const totalSoldValue = cars
    .filter((c) => c.status === "sold")
    .reduce((sum, c) => sum + (c.price || 0), 0);

  // ── Bookings by Month ─────────────────────────────────
  const now = new Date();

  // Determine the month span from the date filter, default to last 6 months
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

  const monthlyData: Record<
    string,
    { month: string; services: number; viewings: number }
  > = {};

  // Initialize months spanning the range
  const cursor = new Date(chartStart.getFullYear(), chartStart.getMonth(), 1);
  while (cursor <= chartEnd) {
    const label = getMonthLabel(cursor);
    if (!monthlyData[label]) {
      monthlyData[label] = { month: label, services: 0, viewings: 0 };
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  serviceBookings.forEach((b) => {
    const created = new Date(b.createdAt);
    const label = getMonthLabel(created);
    if (monthlyData[label]) monthlyData[label].services++;
  });

  viewingBookings.forEach((b) => {
    const created = new Date(b.createdAt);
    const label = getMonthLabel(created);
    if (monthlyData[label]) monthlyData[label].viewings++;
  });

  const bookingsByMonth = Object.values(monthlyData);

  // ── Bookings by Day of Week ────────────────────────────
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const bookingsByDay = dayOrder.map((day) => ({ day, count: 0 }));

  [...serviceBookings, ...viewingBookings].forEach((b) => {
    if (b.appointmentDate) {
      const d = new Date(b.appointmentDate);
      const label = getDayLabel(d);
      const entry = bookingsByDay.find((e) => e.day === label);
      if (entry) entry.count++;
    }
  });

  // ── Car Inventory by Fuel Type ─────────────────────────
  const fuelCounts: Record<string, number> = {};
  cars.forEach((c) => {
    const fuel = c.fuel || "Unknown";
    fuelCounts[fuel] = (fuelCounts[fuel] || 0) + 1;
  });
  const inventoryByFuel = Object.entries(fuelCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // ── Car Inventory by Status ────────────────────────────
  const inventoryByStatus = [
    { name: "Available", value: availableCars, colour: "#22c55e" },
    { name: "Sold", value: soldCars, colour: "#dc2626" },
    { name: "Reserved", value: reservedCars, colour: "#f59e0b" },
  ];

  // ── Service Type Breakdown ─────────────────────────────
  const serviceTypeCounts: Record<string, number> = {};
  serviceBookings.forEach((b) => {
    const type = b.serviceType || "Other";
    const key = type.includes("—") ? type.split("—")[0].trim() : type;
    serviceTypeCounts[key] = (serviceTypeCounts[key] || 0) + 1;
  });
  const serviceTypeBreakdown = Object.entries(serviceTypeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // ── Price Distribution ─────────────────────────────────
  const priceRanges = [
    { range: "< £5k", min: 0, max: 5000 },
    { range: "£5k–£10k", min: 5000, max: 10000 },
    { range: "£10k–£20k", min: 10000, max: 20000 },
    { range: "£20k–£30k", min: 20000, max: 30000 },
    { range: "£30k–£50k", min: 30000, max: 50000 },
    { range: "£50k+", min: 50000, max: Infinity },
  ];
  const priceDistribution = priceRanges.map((r) => ({
    range: r.range,
    count: cars.filter((c) => c.price >= r.min && c.price < r.max).length,
  }));

  // ── Most Viewed Cars (top 5 by viewing bookings) ───────
  const carViewCounts: Record<string, { label: string; count: number }> = {};
  viewingBookings.forEach((b) => {
    if (b.carDetails) {
      const key = `${b.carDetails.year} ${b.carDetails.make} ${b.carDetails.model}`;
      if (!carViewCounts[key]) carViewCounts[key] = { label: key, count: 0 };
      carViewCounts[key].count++;
    }
  });
  const popularCars = Object.values(carViewCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Recent Activity (last 10 events) ───────────────────
  const allBookings = [
    ...serviceBookings.map((b) => ({
      ...serializeDocument(b),
      _type: "service" as const,
    })),
    ...viewingBookings.map((b) => ({
      ...serializeDocument(b),
      _type: "viewing" as const,
    })),
  ];
  allBookings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recentActivity = allBookings.slice(0, 10).map((b) => ({
    type: b._type,
    reference: b.bookingReference,
    customer: b.customerInfo?.name || "Unknown",
    date: b.appointmentDate,
    time: b.appointmentTime,
    status: b.status,
    detail:
      b._type === "viewing" && b.carDetails
        ? `${b.carDetails.year} ${b.carDetails.make} ${b.carDetails.model}`
        : b._type === "service"
          ? b.serviceType || ""
          : "",
    createdAt:
      b.createdAt instanceof Date
        ? b.createdAt.toISOString()
        : String(b.createdAt),
  }));

  // ── Upcoming Appointments (next 7 days — always unfiltered) ──
  // Use all bookings regardless of date filter since upcoming is forward-looking
  const allBookingsUnfiltered = [
    ...allServiceBookings.map((b) => ({
      ...serializeDocument(b),
      _type: "service" as const,
    })),
    ...allViewingBookings.map((b) => ({
      ...serializeDocument(b),
      _type: "viewing" as const,
    })),
  ];

  const todayStr = now.toISOString().split("T")[0];
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  const upcomingAppointments = allBookingsUnfiltered
    .filter(
      (b) =>
        b.appointmentDate >= todayStr &&
        b.appointmentDate <= nextWeekStr &&
        b.status !== "cancelled"
    )
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
    .slice(0, 8)
    .map((b) => ({
      type: b._type,
      reference: b.bookingReference,
      customer: b.customerInfo?.name || "Unknown",
      date: b.appointmentDate,
      time: b.appointmentTime,
      status: b.status,
      detail:
        b._type === "viewing" && b.carDetails
          ? `${b.carDetails.year} ${b.carDetails.make} ${b.carDetails.model}`
          : b._type === "service"
            ? b.serviceType || ""
            : "",
    }));

  return {
    kpis: {
      totalCars,
      availableCars,
      soldCars,
      reservedCars,
      totalServiceBookings,
      pendingServiceBookings,
      confirmedServiceBookings,
      completedServiceBookings,
      cancelledServiceBookings,
      totalViewingBookings,
      pendingViewingBookings,
      confirmedViewingBookings,
      completedViewingBookings,
      cancelledViewingBookings,
      totalInventoryValue,
      totalSoldValue,
      totalUsers: users.length,
    },
    charts: {
      bookingsByMonth,
      bookingsByDay,
      inventoryByFuel,
      inventoryByStatus,
      serviceTypeBreakdown,
      priceDistribution,
      popularCars,
    },
    recentActivity,
    upcomingAppointments,
  };
}
