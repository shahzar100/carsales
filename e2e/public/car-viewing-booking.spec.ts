import { test, expect } from "@playwright/test";
import { seedCar, seedCustomer, cleanupE2EData, closeDb } from "../fixtures/db";
import { loginAsCustomer } from "../fixtures/auth";

/**
 * Revenue-critical: booking a car viewing through the real multi-step form.
 *
 * Booking creation now requires an authenticated customer
 * (getCustomerIdentity → 401 otherwise), so we seed + sign a customer in
 * before walking the 3-step CarViewingForm:
 *   step 1: date + time slot
 *   step 2: contact (name + phone; email is auto-filled from the account
 *           and locked — the API forces it to the account email anyway)
 *   step 3: review + confirm
 *
 * Asserts the confirmation card with a BK- reference renders.
 *
 * Own `x-forwarded-for` so its single login/booking sits in a private
 * rate-limiter bucket. The exact slot-conflict behaviour lives in
 * viewing-double-booking.spec.ts; this is the plain happy path.
 */
test.describe.configure({ timeout: 90_000 });
test.use({ extraHTTPHeaders: { "x-forwarded-for": "203.0.113.24" } });

const CUSTOMER = {
  email: "e2e-customer+viewing@example.com",
  password: "TestPass123!",
  name: "Viewing Customer",
};

const bookingDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7); // within the form's today..+30 range
  return d.toISOString().slice(0, 10);
})();

test.describe("public: car viewing booking", () => {
  let carId: string;

  test.beforeAll(async () => {
    await seedCustomer(CUSTOMER);
    carId = await seedCar({ make: "Audi", model: "A4 (E2E)" });
  });

  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  test("authenticated customer books a viewing via the multi-step form", async ({
    page,
  }) => {
    await loginAsCustomer(page, CUSTOMER.email, CUSTOMER.password);

    // Open the booking page. The form sits behind BookingAuthGate, which keys
    // off useSession() — whose client fetch can flake under dev load (authjs
    // ClientFetchError), leaving the gate closed. A reload re-triggers it, so
    // wait for the form's date field and reload-retry if it doesn't appear.
    for (let attempt = 1; attempt <= 3; attempt++) {
      await page.goto(`/Booking/${carId}`);
      try {
        await page
          .getByLabel("Preferred Date")
          .waitFor({ state: "visible", timeout: 25_000 });
        break;
      } catch (err) {
        if (attempt === 3) throw err;
      }
    }

    // Step 1 — Date & Time. The time picker is a custom listbox: click the
    // trigger, then pick the one-hour window option.
    await page.getByLabel("Preferred Date").fill(bookingDate);
    await page.getByRole("button", { name: /select a time slot/i }).click();
    await page.getByRole("option", { name: /10:00.*11:00/ }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 2 — Contact. Email is prefilled from the session and disabled;
    // wait for that prefill, then complete the editable fields.
    await expect(page.getByLabel("Email Address")).not.toHaveValue("");
    await page.getByLabel("Full Name").fill(CUSTOMER.name);
    await page.getByLabel("Phone Number").fill("07700900123");
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Step 3 — Review & confirm.
    await page.getByRole("button", { name: "Confirm Booking" }).click();

    await expect(page.getByText(/Booking Confirmed/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/BK-[A-Z0-9]+/)).toBeVisible();
  });
});
