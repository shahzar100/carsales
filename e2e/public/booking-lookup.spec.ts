import { test, expect } from "@playwright/test";
import {
  seedCar,
  seedViewingBooking,
  cleanupE2EData,
  closeDb,
} from "../fixtures/db";

/**
 * Customer self-service: look up an existing booking by reference + email.
 *
 * Seeds a viewing booking, then drives the lookup form on /Booking/lookup.
 */
test.describe("public: booking lookup", () => {
  let reference: string;
  const email = "e2e-lookup@example.com";

  test.beforeAll(async () => {
    const carId = await seedCar({ model: "Q5 (E2E)" });
    reference = await seedViewingBooking({
      carId,
      email,
      reference: "BK-E2ELKP",
    });
  });

  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  test("found: shows booking details when ref + email match", async ({
    page,
  }) => {
    await page.goto("/Booking/lookup");
    await page
      .getByPlaceholder(/booking reference/i)
      .fill(reference);
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByRole("button", { name: /search/i }).click();

    await expect(page.getByText(reference)).toBeVisible({ timeout: 10_000 });
    // Status badge should render — pending is the default seed state.
    await expect(page.getByText(/pending/i).first()).toBeVisible();
  });

  test("not found: shows error when ref doesn't exist", async ({ page }) => {
    await page.goto("/Booking/lookup");
    await page.getByPlaceholder(/booking reference/i).fill("BK-DOESNOT");
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByRole("button", { name: /search/i }).click();

    // The page renders an inline red error box for not-found / mismatched.
    await expect(
      page.locator(".text-red-700").or(page.getByText(/not found|no booking/i))
    ).toBeVisible({ timeout: 10_000 });
  });
});
