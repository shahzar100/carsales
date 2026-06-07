import { test, expect } from "@playwright/test";
import { smoke, hasCustomer } from "./_env";
import { loginAsCustomer } from "../fixtures/auth";

/**
 * The signed-in session actually resolves on the deploy: after login, /account
 * renders (not bounced to /login, not stuck behind the auth gate) and there's
 * no authjs `ClientFetchError`. This is the live confirmation of the AUTH_URL /
 * useSession fix — the one residual that can only be verified against the real
 * origin. Staging-only (needs a test customer).
 */
test("signed-in customer reaches /account without a session fetch error", async ({ page }) => {
  test.skip(!hasCustomer, "SMOKE_CUSTOMER_* not set — staging only");

  const consoleErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });

  await loginAsCustomer(page, smoke.customer.email, smoke.customer.password);
  await page.goto("/account");

  await expect(page).toHaveURL(/\/account/);
  // The BookingAuthGate sign-in prompt must NOT be showing.
  await expect(page.getByText(/sign in to/i)).toHaveCount(0);

  const fetchErr = consoleErrors.find((e) => /ClientFetchError|Failed to fetch/i.test(e));
  expect(fetchErr, `authjs session fetch error on /account: ${fetchErr ?? ""}`).toBeFalsy();
});
