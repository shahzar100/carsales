import { test, expect } from "@playwright/test";
import { cleanupE2EData, closeDb } from "../fixtures/db";
import { customer } from "../fixtures/test-data";

/**
 * Revenue-critical: booking a service.
 *
 * Service booking lives on a service page (e.g. /Services/Detailing) and
 * shares ServiceBookingForm with the quote flow — same fields, different
 * `purpose` toggle.
 */
test.describe("public: service booking", () => {
  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  test("happy path: book a detailing service", async ({ page }) => {
    await page.goto("/Services/Detailing");

    // Pick "Book Service" mode if a quote/book toggle is visible.
    const bookToggle = page.getByRole("button", { name: /book service/i });
    if (await bookToggle.isVisible().catch(() => false)) {
      await bookToggle.click();
    }

    // Vehicle details
    await page.getByLabel(/make/i).first().fill("Tesla");
    await page.getByLabel(/model/i).first().fill("Model S");
    await page.getByLabel(/year/i).first().fill("2022");
    await page.getByLabel(/registration/i).first().fill("AB23 CDE");

    // Contact
    await page.getByLabel("Full Name").fill(customer.name);
    await page
      .getByLabel("Email")
      .fill("e2e-customer+service@example.com");
    await page.getByLabel("Phone").fill(customer.phone);

    // Submit — handle either single-step or multi-step form.
    const submit = page.getByRole("button", {
      name: /book service|submit|confirm/i,
    });
    await submit.first().click();

    // Some forms are multi-step; click "Next" until we hit a confirm/success.
    for (let i = 0; i < 4; i++) {
      const next = page.getByRole("button", { name: /next|continue/i });
      if (await next.isVisible().catch(() => false)) {
        await next.click();
      } else break;
    }

    const success = page
      .getByText(/BK-[A-Z0-9]{4,}/)
      .or(
        page
          .getByRole("alert")
          .filter({ hasText: /booked|success|confirmed|submitted/i })
      );
    await expect(success.first()).toBeVisible({ timeout: 15_000 });
  });
});
