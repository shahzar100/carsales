import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../fixtures/auth";

/**
 * Auth lifecycle: after logging out, hitting a protected route bounces
 * back to /admin/login. Guards against the kind of session-clearing
 * regression where the cookie persists or middleware fails open.
 */
test.describe("admin: logout redirect", () => {
  test("logout clears session; protected routes redirect to login", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // The logout button lives in the admin nav.
    await page.getByRole("button", { name: /logout|sign out/i }).click();

    // Post-logout we expect a redirect to /admin/login.
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });

    // Now try to hit a protected page — should bounce back to login.
    await page.goto("/admin/dashboard/cars");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });
  });
});
