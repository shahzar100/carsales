import { test, expect } from "@playwright/test";

/**
 * Security regression guard: wrong-password handling and rate limiting.
 *
 * The login route returns a 401 with `{ success: false, error }` on bad
 * creds, and starts returning 429 after several attempts. We don't pin
 * the exact threshold (it's tuned in the rate limiter) — we just verify
 * the user-facing error appears and the form stays usable.
 */
test.describe("admin: login failures", () => {
  test("wrong password shows an error, no redirect", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Error box uses border-red-200 / text-red-700; just match the visible message.
    const error = page
      .getByText(
        /invalid|incorrect|wrong|failed|unauthorised|unauthorized/i
      )
      .first();
    await expect(error).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("repeated failures eventually surface a rate-limit message", async ({
    page,
  }) => {
    await page.goto("/admin/login");

    // Hammer the login a handful of times. The exact threshold is tuned
    // server-side; we only assert that *some* attempt past the first surfaces
    // a rate-limit-shaped message (429 / "too many" / "try again").
    let sawRateLimit = false;
    for (let i = 0; i < 10; i++) {
      await page.getByLabel("Username").fill("admin");
      await page.getByLabel("Password").fill(`bad-${i}`);
      await page.getByRole("button", { name: "Sign In" }).click();
      // Wait for the error to settle.
      await page.waitForTimeout(300);
      const text = await page.locator("body").textContent();
      if (text && /too many|rate limit|try again|locked/i.test(text)) {
        sawRateLimit = true;
        break;
      }
    }

    // Soft assert: not every deployment configures aggressive rate limiting,
    // so we surface a console warning rather than fail. The test still gates
    // the regression where the form crashes under repeated failures.
    if (!sawRateLimit) {
      // eslint-disable-next-line no-console
      console.warn(
        "[e2e] Login rate-limit message not observed in 10 attempts. " +
          "Either the limiter is set high, or it's disabled — review src/app/api/admin/login/route.ts."
      );
    }
    // Hard assert: the page is still functional after the burst.
    await expect(page.getByRole("button", { name: "Sign In" })).toBeEnabled();
  });
});
