import { expect, type Page } from "@playwright/test";
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

/**
 * Sign a customer in via the NextAuth credentials provider on `/login`.
 *
 * Polls `/api/auth/session` rather than asserting a redirect, because the
 * post-login destination varies. Returns once the JWT session is live, so
 * any follow-up booking call carries an authenticated cookie.
 */
export async function loginAsCustomer(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");

  // Warm the NextAuth catch-all route so the FIRST credentials POST isn't
  // racing a cold dev compile — which the client surfaces as a generic
  // "Something went wrong" (prod routes are prebuilt, so this is dev-only).
  await page.evaluate(async () => {
    try {
      await fetch("/api/auth/session");
    } catch {
      /* ignore */
    }
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    try {
      await expect
        .poll(
          async () =>
            page.evaluate(async () => {
              const r = await fetch("/api/auth/session");
              const j = await r.json().catch(() => ({}));
              return j?.user?.email ?? null;
            }),
          { timeout: 45_000, intervals: [500, 1000, 2000] }
        )
        .toBe(email.toLowerCase());
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await page.goto("/login"); // retry once; the route is warm now
    }
  }
}
