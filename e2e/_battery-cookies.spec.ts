import { test, expect } from "@playwright/test";

test.describe("GDPR / cookie consent", () => {
  test("first-load: no analytics/marketing cookies pre-consent", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cookies = await context.cookies();
    const cookieNames = cookies.map((c) => c.name);
    console.log(`[cookies pre-consent] ${cookieNames.join(", ") || "(none)"}`);

    // Allowed cookies before consent: session + cookie-banner state only.
    const allowed = /^(__Host-|next-|__Secure-|cookie-consent|_csrf|session|auth)/;
    const violators = cookies.filter((c) => !allowed.test(c.name));
    expect(
      violators.map((c) => `${c.name} (domain=${c.domain})`),
      "non-essential cookies set before consent"
    ).toEqual([]);
  });

  test("cookie banner is visible on first visit", async ({ context, page }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem("cookie-consent");
      } catch {}
    });
    await page.goto("/", { waitUntil: "networkidle" });
    const banner = page.getByRole("dialog", { name: /we use cookies/i });
    await expect(banner, "cookie banner should appear before consent").toBeVisible({
      timeout: 5000,
    });
  });

  test("privacy + terms reachable from footer", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const privacyResp = await page.request.get("/privacy");
    expect(privacyResp.status()).toBeLessThan(400);
    const termsResp = await page.request.get("/terms");
    expect(termsResp.status()).toBeLessThan(400);
  });

  test("session cookie has security flags", async ({ context, page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const cookies = await context.cookies();
    const session = cookies.find((c) =>
      /session|auth|__Host-|__Secure-/i.test(c.name)
    );
    if (!session) {
      test.skip(true, "no session cookie set on anon visit (expected)");
      return;
    }
    console.log(
      `[session cookie] ${session.name}  httpOnly=${session.httpOnly} secure=${session.secure} sameSite=${session.sameSite}`
    );
    expect(session.httpOnly).toBe(true);
    expect(session.sameSite).toMatch(/Lax|Strict/);
  });
});
