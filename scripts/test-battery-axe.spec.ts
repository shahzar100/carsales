import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  "/",
  "/BrowseFleet",
  "/CarParts",
  "/Services",
  "/Services/Tints",
  "/Services/Detailing",
  "/Services/Repairs",
  "/AboutUs",
  "/contact",
  "/FAQ",
  "/Recoveries",
  "/AccidentClaims",
  "/Book",
  "/Booking/lookup",
  "/privacy",
  "/terms",
];

for (const path of PAGES) {
  test(`axe a11y: ${path}`, async ({ page }) => {
    const resp = await page.goto(path, { waitUntil: "networkidle" });
    expect(resp?.status() ?? 0).toBeLessThan(400);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .analyze();
    if (results.violations.length) {
      console.log(`\n[axe ${path}] ${results.violations.length} violation(s):`);
      for (const v of results.violations) {
        console.log(
          `  - [${v.impact}] ${v.id}: ${v.help} (nodes=${v.nodes.length})`
        );
      }
    }
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
  });
}
