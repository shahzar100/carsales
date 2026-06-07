import { test, expect } from "@playwright/test";
import { smoke } from "./_env";

/**
 * Google sign-in is wired correctly: clicking "Continue with Google" redirects
 * to Google with the right client_id and a redirect_uri pointing back at this
 * deploy. We assert the redirect is well-formed WITHOUT driving Google's UI
 * (which is bot-hostile). Catches the #1 OAuth misconfig: wrong redirect_uri /
 * missing client id. Read-only.
 */
test("Google sign-in redirect is well-formed", { tag: "@prod-safe" }, async ({ page }) => {
  await page.goto("/login");
  const btn = page.getByRole("button", { name: /continue with google/i });
  await expect(btn, "expected a 'Continue with Google' button").toHaveCount(1);

  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().includes("accounts.google.com"), {
      timeout: 20_000,
    }),
    btn.click(),
  ]);

  const url = new URL(req.url());
  expect(url.searchParams.get("client_id"), "client_id must be present").toBeTruthy();
  const redirect = url.searchParams.get("redirect_uri") || "";
  expect(redirect).toContain("/api/auth/callback/google");
  if (smoke.baseURL) {
    expect(redirect, "redirect_uri host must match this deploy").toContain(
      new URL(smoke.baseURL).host
    );
  }
});
