/**
 * @jest-environment node
 *
 * Smoke test that the Mongo-side aggregation pipeline returns the same
 * counts the JS-side grouping used to produce. Seeds a tiny fixture and
 * asserts every KPI and chart value.
 */
import { ObjectId } from "mongodb";
import {
  getCarsCollection,
  getServiceAppointmentsCollection,
  getCarViewingBookingsCollection,
  getAdminUsersCollection,
} from "@/lib/models";
import { getDashboardData } from "@/components/Admin/Dashboard/getDashboardData";

function makeCar(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    year: 2020,
    make: "Toyota",
    model: "Corolla",
    price: 12000,
    fuel: "Petrol",
    status: "available",
    createdAt: new Date(),
    ...overrides,
  };
}

let refCounter = 0;
function nextSlot() {
  refCounter += 1;
  // Spread bookings across the same weekday (Thursday 2026-05-14) but
  // different times so the (date, time) unique index is satisfied.
  const hh = String(7 + refCounter).padStart(2, "0");
  return {
    bookingReference: `BK-${refCounter}`,
    appointmentTime: `${hh}:00`,
  };
}

function makeService(overrides: Record<string, unknown> = {}) {
  const slot = nextSlot();
  return {
    _id: new ObjectId(),
    bookingReference: slot.bookingReference,
    serviceType: "Detailing — Full",
    appointmentDate: "2026-05-14", // a Thursday
    appointmentTime: slot.appointmentTime,
    status: "pending",
    customerInfo: { name: "Test", email: "t@example.com", phone: "07000" },
    createdAt: new Date(),
    ...overrides,
  };
}

function makeViewing(overrides: Record<string, unknown> = {}) {
  const slot = nextSlot();
  return {
    _id: new ObjectId(),
    bookingReference: slot.bookingReference,
    appointmentDate: "2026-05-15", // a Friday
    appointmentTime: slot.appointmentTime,
    status: "confirmed",
    customerInfo: { name: "Test", email: "t@example.com", phone: "07000" },
    carDetails: {
      year: 2020,
      make: "Toyota",
      model: "Corolla",
      price: 12000,
    },
    createdAt: new Date(),
    ...overrides,
  };
}

describe("getDashboardData (Mongo aggregation)", () => {
  beforeEach(async () => {
    const cars = await getCarsCollection();
    const service = await getServiceAppointmentsCollection();
    const viewing = await getCarViewingBookingsCollection();
    const users = await getAdminUsersCollection();

    // Drop fixture data left behind by the previous `it()` — otherwise
    // the `bookingReference` unique index throws E11000 when this
    // beforeEach re-seeds BK-N references that already exist.
    await Promise.all([
      cars.deleteMany({}),
      service.deleteMany({}),
      viewing.deleteMany({}),
      users.deleteMany({}),
    ]);

    await cars.insertMany([
      makeCar({ status: "available", price: 4000, fuel: "Petrol" }),
      makeCar({ status: "available", price: 8000, fuel: "Diesel" }),
      makeCar({ status: "reserved", price: 15000, fuel: "Electric" }),
      makeCar({ status: "sold", price: 25000, fuel: "Hybrid" }),
      makeCar({ status: "sold", price: 60000, fuel: "Petrol" }),
    ] as never);

    await service.insertMany([
      makeService({ status: "pending", serviceType: "Detailing — Full" }),
      makeService({ status: "confirmed", serviceType: "Detailing — Mini" }),
      makeService({ status: "completed", serviceType: "Tints" }),
      makeService({ status: "cancelled", serviceType: "Tints" }),
    ] as never);

    await viewing.insertMany([
      makeViewing({ status: "pending" }),
      makeViewing({ status: "confirmed" }),
      makeViewing({
        status: "confirmed",
        carDetails: {
          year: 2019,
          make: "BMW",
          model: "320d",
          price: 18000,
        },
      }),
    ] as never);

    await users.insertOne({
      _id: new ObjectId(),
      username: "admin",
      passwordHash: "x",
      role: "owner",
    } as never);
  });

  it("aggregates KPIs from Mongo", async () => {
    const data = await getDashboardData();

    expect(data.kpis.totalCars).toBe(5);
    expect(data.kpis.availableCars).toBe(2);
    expect(data.kpis.reservedCars).toBe(1);
    expect(data.kpis.soldCars).toBe(2);

    // available + reserved
    expect(data.kpis.totalInventoryValue).toBe(4000 + 8000 + 15000);
    expect(data.kpis.totalSoldValue).toBe(25000 + 60000);

    expect(data.kpis.totalServiceBookings).toBe(4);
    expect(data.kpis.pendingServiceBookings).toBe(1);
    expect(data.kpis.confirmedServiceBookings).toBe(1);
    expect(data.kpis.completedServiceBookings).toBe(1);
    expect(data.kpis.cancelledServiceBookings).toBe(1);

    expect(data.kpis.totalViewingBookings).toBe(3);
    expect(data.kpis.pendingViewingBookings).toBe(1);
    expect(data.kpis.confirmedViewingBookings).toBe(2);

    expect(data.kpis.totalUsers).toBe(1);
  });

  it("builds chart data with the right shape and counts", async () => {
    const data = await getDashboardData();

    // ── Inventory by fuel: 4 distinct fuels ──
    const fuelMap = Object.fromEntries(
      data.charts.inventoryByFuel.map((s) => [s.name, s.value])
    );
    expect(fuelMap.Petrol).toBe(2);
    expect(fuelMap.Diesel).toBe(1);
    expect(fuelMap.Electric).toBe(1);
    expect(fuelMap.Hybrid).toBe(1);

    // ── Inventory by status (fixed shape) ──
    expect(data.charts.inventoryByStatus).toEqual([
      { name: "Available", value: 2, colour: "#22c55e" },
      { name: "Sold", value: 2, colour: "#dc2626" },
      { name: "Reserved", value: 1, colour: "#f59e0b" },
    ]);

    // ── Price distribution ──
    const priceMap = Object.fromEntries(
      data.charts.priceDistribution.map((p) => [p.range, p.count])
    );
    expect(priceMap["< £5k"]).toBe(1); // 4000
    expect(priceMap["£5k–£10k"]).toBe(1); // 8000
    expect(priceMap["£10k–£20k"]).toBe(1); // 15000
    expect(priceMap["£20k–£30k"]).toBe(1); // 25000
    expect(priceMap["£30k–£50k"]).toBe(0);
    expect(priceMap["£50k+"]).toBe(1); // 60000

    // ── Day-of-week always returns 7 days in Mon-first order ──
    expect(data.charts.bookingsByDay).toHaveLength(7);
    expect(data.charts.bookingsByDay.map((d) => d.day)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);

    // ── Popular cars: top-5 by viewing count ──
    expect(data.charts.popularCars[0]).toEqual({
      label: "2020 Toyota Corolla",
      count: 2,
    });

    // ── Service type breakdown: "Detailing" merged from em-dash split ──
    const typeMap = Object.fromEntries(
      data.charts.serviceTypeBreakdown.map((s) => [s.name, s.value])
    );
    expect(typeMap.Detailing).toBe(2);
    expect(typeMap.Tints).toBe(2);
  });

  it("returns recent activity and upcoming appointments", async () => {
    const data = await getDashboardData();

    expect(data.recentActivity.length).toBeGreaterThan(0);
    expect(data.recentActivity.length).toBeLessThanOrEqual(10);

    // Every entry is well-formed
    for (const item of data.recentActivity) {
      expect(item.type).toMatch(/^(service|viewing)$/);
      expect(typeof item.reference).toBe("string");
      expect(typeof item.customer).toBe("string");
    }

    // Upcoming only includes appointmentDate >= today
    const todayStr = new Date().toISOString().split("T")[0];
    for (const item of data.upcomingAppointments) {
      expect(item.date >= todayStr).toBe(true);
      expect(item.status).not.toBe("cancelled");
    }
  });
});
