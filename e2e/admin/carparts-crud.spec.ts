import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../fixtures/auth";
import { cleanupE2EData, closeDb } from "../fixtures/db";

/**
 * Covers two pieces of recent work:
 *   - Day 3: the carparts edit modal wiring (PUT /api/admin/carparts).
 *   - Day 5: the ConfirmDialog primitive used for delete.
 *
 * Flow: Add → Edit → Delete → confirm the row is gone.
 */
test.describe("admin: carparts CRUD", () => {
  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  test("add → edit → delete a car part", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/dashboard/carparts");

    // ── Add ──────────────────────────────────────────────────
    await page.getByRole("button", { name: /add part/i }).click();

    const addModal = page.getByRole("dialog");
    await addModal.getByLabel(/name/i).fill("Brake Pad Set (E2E)");
    await addModal.getByLabel(/brand/i).fill("Brembo");
    await addModal.getByLabel(/category/i).fill("Brakes");
    await addModal.getByLabel(/price/i).fill("89.99");
    await addModal.getByLabel(/compatibility/i).fill("BMW 3 Series");
    await addModal
      .getByLabel(/description/i)
      .fill("Seeded by E2E test suite. Safe to delete.");

    await addModal.getByRole("button", { name: /add|save|submit/i }).click();

    // Toast confirms; row appears in the table.
    await expect(
      page.getByRole("alert").filter({ hasText: /added|success/i }).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("row").filter({ hasText: "Brake Pad Set (E2E)" })
    ).toBeVisible();

    // ── Edit ─────────────────────────────────────────────────
    await page
      .getByRole("row")
      .filter({ hasText: "Brake Pad Set (E2E)" })
      .getByRole("button", { name: /edit/i })
      .click();

    const editModal = page.getByRole("dialog");
    const priceField = editModal.getByLabel(/price/i);
    await priceField.fill("99.99");
    await editModal.getByRole("button", { name: /save|update|submit/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /updated|success/i }).first()
    ).toBeVisible({ timeout: 10_000 });

    // ── Delete (uses Day 5's ConfirmDialog) ──────────────────
    await page
      .getByRole("row")
      .filter({ hasText: "Brake Pad Set (E2E)" })
      .getByRole("button", { name: /delete/i })
      .click();

    const confirm = page.getByRole("dialog");
    await expect(confirm.getByText(/delete car part/i)).toBeVisible();
    await confirm.getByRole("button", { name: /delete part|delete/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /deleted|success/i }).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("row").filter({ hasText: "Brake Pad Set (E2E)" })
    ).toHaveCount(0);
  });
});
