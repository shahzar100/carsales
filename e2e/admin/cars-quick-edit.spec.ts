import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../fixtures/auth";
import { seedCar, cleanupE2EData, closeDb } from "../fixtures/db";

/**
 * Day 3 wired the Edit button on the cars list to navigate to a quick-edit
 * page. This test guards that wiring — clicking Edit on a row should land
 * on /admin/dashboard/cars/edit/{id}.
 */
test.describe("admin: cars list → quick edit", () => {
  let carId: string;

  test.beforeAll(async () => {
    carId = await seedCar({ make: "Mercedes", model: "C-Class (E2E)" });
  });

  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  test("Edit button on a car row opens the quick-edit page", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/dashboard/cars");

    // The Cars.tsx component renders rows with View / Edit / Delete buttons.
    // We don't know the row order at runtime, so look up the row by visible
    // text (the seeded model name is unique).
    const row = page
      .getByRole("row")
      .filter({ hasText: /C-Class \(E2E\)/ })
      .first();
    // Fallback for non-table layouts (cards): match any visible card with the model.
    const target = (await row.isVisible().catch(() => false))
      ? row
      : page.locator("text=/C-Class \\(E2E\\)/").first();

    await target.getByRole("button", { name: /edit/i }).first().click();

    await expect(page).toHaveURL(
      new RegExp(`/admin/dashboard/cars/edit/${carId}`),
      { timeout: 10_000 }
    );
  });
});
