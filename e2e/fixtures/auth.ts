import type { Page } from "@playwright/test";
import { adminCredentials } from "./test-data";

/**
 * Log into /admin/login and wait for the redirect to /admin/dashboard.
 *
 * The admin auth uses iron-session in an HTTP-only cookie, so once this
 * function returns, the page's storage state is authenticated and any
 * follow-up admin navigation will work.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(adminCredentials.username);
  await page.getByLabel("Password").fill(adminCredentials.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  // The dashboard is server-rendered and gated by isAuthenticated();
  // after login, AuthContext pushes us there.
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10_000 });
}
