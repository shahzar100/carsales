import { test, expect, type Page } from "@playwright/test";
import { closeDb, seedCustomer, seedCar } from "./_db";
import { loginAsCustomer } from "../fixtures/auth";

/**
 * Turnstile verification on the booking route, using Cloudflare's always-pass
 * test secret (1x...). The server calls the real siteverify API.
 *
 *  - PASS: a token + the always-pass secret → booking succeeds (200).
 *    [Needs outbound network to challenges.cloudflare.com / siteverify.]
 *  - FAIL: an empty token → the server rejects with 400 BEFORE calling
 *    Cloudflare (verifyTurnstileToken returns "missing-token"). [Hermetic.]
 */
const CUST = { email: "op-turnstile@example.com", password: "TestPass123!" };

const future = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  return d.toISOString().slice(0, 10);
})();

let carId: string;

function payload(token: string) {
  return {
    carId,
    carDetails: { make: "Audi", model: "A4 (OP)", year: 2023, price: 35000, image: "" },
    customerInfo: { name: "Op Customer", email: CUST.email, phone: "07700900123" },
    appointmentDate: future,
    appointmentTime: "15:00",
    turnstileToken: token,
  };
}

async function book(page: Page, token: string) {
  return page.evaluate(async (p) => {
    const res = await fetch("/api/bookings/viewing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    return { status: res.status, body: JSON.stringify(await res.json().catch(() => ({}))) };
  }, payload(token));
}

test.describe.serial("operational: Turnstile on booking", () => {
  test.beforeAll(async () => {
    await seedCustomer(CUST.email, CUST.password);
    carId = await seedCar();
  });
  test.afterAll(async () => {
    await closeDb();
  });

  test("FAIL: empty token is rejected with 400 (hermetic)", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "8.8.4.1" });
    await loginAsCustomer(page, CUST.email, CUST.password);
    const res = await book(page, "");
    expect(res.status, res.body).toBe(400);
    expect(res.body.toLowerCase()).toContain("captcha");
  });

  test("PASS: a token + always-pass secret → booking succeeds (needs network)", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": "8.8.4.2" });
    await loginAsCustomer(page, CUST.email, CUST.password);
    const res = await book(page, "dummy-token-the-1x-secret-accepts-anything");
    expect(res.status, res.body).toBe(200);
    expect(res.body).toContain("BK-");
  });
});
