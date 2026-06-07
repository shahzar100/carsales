import { test, expect } from "@playwright/test";

/**
 * Site is up: key public pages respond, render without uncaught JS errors, and
 * production sends a CSP header (proves the security middleware is live — the
 * exact thing that was silently dead before the audit fix).
 */
const ROUTES = ["/", "/BrowseFleet", "/Services", "/CarParts", "/contact", "/login", "/FAQ"];

for (const route of ROUTES) {
  test(`GET ${route} responds OK`, { tag: "@prod-safe" }, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `nav status for ${route}`).toBeLessThan(400);
    await page.waitForTimeout(500);
    expect(errors, `uncaught JS on ${route}`).toEqual([]);
  });
}

test("home carries a CSP header (middleware live)", { tag: "@prod-safe" }, async ({ page }) => {
  const res = await page.goto("/");
  const csp = res?.headers()["content-security-policy"];
  expect(csp, "production must send a Content-Security-Policy header").toBeTruthy();
  expect(csp).toContain("script-src");
});
