import { test, expect } from "@playwright/test";
import { seedCar, cleanupE2EData, closeDb } from "../fixtures/db";

/**
 * The most-trafficked public path:
 *   home → Browse Fleet → click a card → land on car detail page.
 *
 * Asserts that:
 *   - the home page loads with a working nav link to BrowseFleet
 *   - the browse fleet page renders at least one car card
 *   - clicking the card lands on /BrowseFleet/{id}
 *   - the detail page emits the schema.org Vehicle JsonLd we wired in Day 3
 */
test.describe("public: home → fleet → detail", () => {
  let carId: string;

  test.beforeAll(async () => {
    carId = await seedCar({ make: "BMW", model: "M3 (E2E)" });
  });

  test.afterAll(async () => {
    await cleanupE2EData();
    await closeDb();
  });

  test("home page links to Browse Fleet", async ({ page }) => {
    await page.goto("/");
    // Multiple "Browse" links may exist (hero CTA + nav). First match is fine.
    await expect(
      page.getByRole("link", { name: /browse/i }).first()
    ).toBeVisible();
  });

  test("can navigate from home to a car detail page", async ({ page }) => {
    await page.goto("/BrowseFleet");

    // Wait for at least one car link to render (data is fetched client-side).
    const carLink = page.locator(`a[href="/BrowseFleet/${carId}"]`).first();
    await expect(carLink).toBeVisible({ timeout: 10_000 });
    await carLink.click();

    await expect(page).toHaveURL(new RegExp(`/BrowseFleet/${carId}`));
  });

  test("car detail page renders schema.org Vehicle JsonLd", async ({
    page,
  }) => {
    await page.goto(`/BrowseFleet/${carId}`);

    // The JsonLd component renders a <script type="application/ld+json">
    // with the car payload. Day 3 wiring.
    const jsonLd = page.locator('script[type="application/ld+json"]').first();
    await expect(jsonLd).toHaveCount(1);

    const text = await jsonLd.textContent();
    expect(text).toBeTruthy();
    const parsed = JSON.parse(text!);
    expect(parsed["@type"]).toBe("Vehicle");
    expect(parsed.brand?.name || parsed.manufacturer?.name).toContain("BMW");
  });
});
