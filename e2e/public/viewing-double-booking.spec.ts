import { test, expect, type Page } from "@playwright/test";
import { seedCar, seedCustomer, cleanupE2EData, closeDb, getDb } from "../fixtures/db";
import { loginAsCustomer } from "../fixtures/auth";

/**
 * Security/integrity-critical: the viewing-slot concurrency guard.
 *
 * A car/date/time can hold only ONE active viewing booking. The guard is the
 * `uniq_active_viewing_slot` partial-unique index (src/lib/models/index.ts);
 * the route translates its E11000 into a 409 (src/app/api/bookings/viewing).
 *
 * We assert it both sequentially and under a true concurrent race. Booking
 * creation requires an authenticated customer, so we seed + sign one in.
 *
 * Isolation: each test sets a unique `x-forwarded-for` so its login + booking
 * calls land in their own in-memory rate-limiter buckets (the limiter keys on
 * ipAddress(req) || "unknown"; see src/lib/utils/rateLimit.ts).
 */
test.describe.configure({ timeout: 90_000 });

const CUSTOMER = {
  email: "e2e-customer+double-booking@example.com",
  password: "TestPass123!",
  name: "Race Tester",
};

const appointmentDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
})();

let carId: string;

test.describe.serial("public: viewing double-booking guard", () => {
  test.beforeAll(async () => {
    await seedCustomer(CUSTOMER);
    carId = await seedCar({ make: "Audi", model: "A4 (E2E)" });
  });

  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  function payload(time: string) {
    return {
      carId,
      carDetails: { make: "Audi", model: "A4 (E2E)", year: 2023, price: 35000, image: "" },
      customerInfo: { name: CUSTOMER.name, email: CUSTOMER.email, phone: "07700900123" },
      appointmentDate,
      appointmentTime: time,
    };
  }

  async function book(page: Page, time: string) {
    return page.evaluate(async (body) => {
      const res = await fetch("/api/bookings/viewing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let json: unknown = {};
      try {
        json = await res.json();
      } catch {
        /* non-JSON body */
      }
      return { status: res.status, body: JSON.stringify(json) };
    }, payload(time));
  }

  test("sequential: re-booking the same slot is rejected with 409", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "203.0.113.22" });
    await loginAsCustomer(page, CUSTOMER.email, CUSTOMER.password);

    const first = await book(page, "10:00");
    expect(first.status, `first booking failed: ${first.body}`).toBe(200);
    expect(first.body).toContain("BK-");

    const second = await book(page, "10:00");
    expect(second.status, `second booking should conflict: ${second.body}`).toBe(409);
  });

  test("concurrent: two simultaneous bookings → exactly one wins", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "203.0.113.23" });
    await loginAsCustomer(page, CUSTOMER.email, CUSTOMER.password);

    const statuses = await page.evaluate(async (body) => {
      const fire = () =>
        fetch("/api/bookings/viewing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then((r) => r.status);
      return Promise.all([fire(), fire()]);
    }, payload("11:00"));

    expect(statuses.slice().sort(), `got ${JSON.stringify(statuses)}`).toEqual([200, 409]);

    const active = await (await getDb())
      .collection("carViewingBookings")
      .countDocuments({
        carId,
        appointmentDate,
        appointmentTime: "11:00",
        status: { $in: ["pending", "confirmed"] },
      });
    expect(active, "exactly one active booking must exist for the slot").toBe(1);
  });
});
