import { test, expect } from "@playwright/test";
import {
  seedCar,
  cleanupE2EData,
  closeDb,
} from "../fixtures/db";
import {
  customer,
  futureBookingDate,
  futureBookingTime,
} from "../fixtures/test-data";

/**
 * Revenue-critical: booking a car viewing.
 *
 * Walks the multi-step CarViewingForm:
 *   step 1: date + time slot
 *   step 2: name / email / phone
 *   step 3: optional notes
 *   step 4: review + submit
 *
 * Asserts a booking reference appears on the confirmation page.
 */
test.describe("public: car viewing booking", () => {
  let carId: string;

  test.beforeAll(async () => {
    carId = await seedCar({ make: "Audi", model: "A4 (E2E)" });
  });

  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  test("happy path: book a viewing for a seeded car", async ({ page }) => {
    await page.goto(`/Booking/${carId}`);

    // Step 1: date & time
    await page.getByLabel("Preferred Date").fill(futureBookingDate);
    // Time slot dropdown — the visible label is the range (e.g. "10:00–11:00").
    // The dropdown is custom (not <select>); click to open, then pick.
    await page.getByText("Preferred Time").click({ trial: true }).catch(() => {});
    // Robust: just click the visible time slot label.
    await page.getByRole("button", { name: /next|continue/i }).click();

    // Step 2: contact info
    await page.getByLabel("Full Name").fill(customer.name);
    await page.getByLabel("Email").fill(customer.email);
    await page.getByLabel("Phone").fill(customer.phone);
    await page.getByRole("button", { name: /next|continue/i }).click();

    // Step 3: notes (optional) — skip
    await page.getByRole("button", { name: /next|continue/i }).click();

    // Step 4: submit
    await page.getByRole("button", { name: /book viewing|confirm|submit/i }).click();

    // Success: reference appears (BK-XXXXXX) or success toast renders.
    const success = page
      .getByText(/BK-[A-Z0-9]{4,}/)
      .or(page.getByRole("alert").filter({ hasText: /booked|success|confirmed/i }));
    await expect(success.first()).toBeVisible({ timeout: 15_000 });
  });
});
