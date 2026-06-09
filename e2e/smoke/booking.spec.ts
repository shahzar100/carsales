import { test, expect, type Page } from "@playwright/test";
import { smoke, hasCustomer } from "./_env";
import { loginAsCustomer } from "../fixtures/auth";

/**
 * End-to-end booking on the deploy: a signed-in customer books a viewing →
 * exercises customer auth, Turnstile verification, the DB write, and triggers
 * a confirmation email (send-only — we assert the request succeeds, not inbox
 * delivery). Staging-only: the dummy Turnstile token only passes when the
 * target uses Cloudflare's always-pass test secret. (Prod's real challenge
 * would 400 here — that's why this isn't @prod-safe.)
 */
test("signed-in customer can book a viewing", async ({ page }) => {
  test.skip(!hasCustomer, "SMOKE_CUSTOMER_* not set — staging only");
  await loginAsCustomer(page, smoke.customer.email, smoke.customer.password);

  const car = await pickAvailableCar(page);
  expect(car, "need at least one car on the target to book").toBeTruthy();
  if (!car) return; // expect() above already failed the test; this narrows `car` for the type checker

  let booked = false;
  let last = "";
  for (let i = 0; i < 4 && !booked; i++) {
    const res = await page.evaluate(async (c) => {
      const d = new Date();
      d.setDate(d.getDate() + 40 + Math.floor(Math.random() * 300));
      const slots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
      const time = slots[Math.floor(Math.random() * slots.length)];
      const body = {
        carId: c.id,
        carDetails: { make: c.make, model: c.model, year: c.year, price: c.price, image: "" },
        customerInfo: { name: "Smoke Test", email: "placeholder@example.com", phone: "07700900123" },
        appointmentDate: d.toISOString().slice(0, 10),
        appointmentTime: time,
        turnstileToken: "smoke-dummy-token",
      };
      const r = await fetch("/api/bookings/viewing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { status: r.status, body: JSON.stringify(await r.json().catch(() => ({}))) };
    }, car);
    last = `${res.status} ${res.body}`;
    if (res.status === 200) {
      booked = true;
      expect(res.body).toContain("BK-");
    } else if (res.status !== 409) {
      throw new Error(`booking failed: ${last}`);
    }
    // 409 = slot already taken on a prior smoke run → retry a different slot.
  }
  expect(booked, `no slot booked after retries; last: ${last}`).toBe(true);
});

async function pickAvailableCar(page: Page) {
  return page.evaluate(async () => {
    const r = await fetch("/api/cars");
    const j = await r.json().catch(() => null);
    const list = Array.isArray(j) ? j : (j?.data ?? j?.cars ?? []);
    const c = list.find((x: { status?: string }) => (x.status ?? "available") === "available") ?? list[0];
    return c
      ? { id: String(c._id ?? c.id), make: c.make, model: c.model, year: c.year, price: c.price }
      : null;
  });
}
