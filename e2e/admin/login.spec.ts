import { test, expect } from "@playwright/test";
import { adminCredentials } from "../fixtures/test-data";

/**
 * Auth gate: admin login happy path.
 *
 * Hitting any /admin/* page when logged-out redirects to /admin/login,
 * and submitting valid credentials lands on /admin/dashboard.
 */
test.describe("admin: login", () => {
  test("redirects unauthenticated requests to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("happy path: valid credentials reach the dashboard", async ({
    page,
  }) => {
    await page.goto("/admin/login");

    await page.getByLabel("Username").fill(adminCredentials.username);
    await page.getByLabel("Password").fill(adminCredentials.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 });
  });
});
