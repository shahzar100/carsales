import { test, expect } from "@playwright/test";
import { cleanupE2EData, closeDb } from "../fixtures/db";
import { customer } from "../fixtures/test-data";

/**
 * Lead capture: quote request via /api/bookings/quote.
 *
 * Same form as the service booking flow, but the user picks "Get Quote"
 * instead of "Book Service" so a different endpoint is hit.
 */
test.describe("public: quote request", () => {
  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  test("happy path: submit a quote request for tints", async ({ page }) => {
    await page.goto("/Services/Tints");

    const quoteToggle = page.getByRole("button", { name: /get quote|quote/i });
    if (await quoteToggle.isVisible().catch(() => false)) {
      await quoteToggle.click();
    }

    await page.getByLabel(/make/i).first().fill("BMW");
    await page.getByLabel(/model/i).first().fill("3 Series");
    await page.getByLabel(/year/i).first().fill("2021");
    await page.getByLabel(/registration/i).first().fill("XY21 ZAB");

    await page.getByLabel("Full Name").fill(customer.name);
    await page.getByLabel("Email").fill("e2e-customer+quote@example.com");
    await page.getByLabel("Phone").fill(customer.phone);

    // Walk through any remaining steps to the submit.
    for (let i = 0; i < 5; i++) {
      const next = page.getByRole("button", { name: /next|continue/i });
      if (await next.isVisible().catch(() => false)) {
        await next.click();
      } else break;
    }

    await page
      .getByRole("button", { name: /submit quote|submit|request quote/i })
      .first()
      .click();

    const success = page
      .getByText(/BK-[A-Z0-9]{4,}|quote (request )?(submitted|received)/i)
      .or(
        page
          .getByRole("alert")
          .filter({ hasText: /submitted|success|received/i })
      );
    await expect(success.first()).toBeVisible({ timeout: 15_000 });
  });
});
