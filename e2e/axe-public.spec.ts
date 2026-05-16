import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PATHS = [
  "/",
  "/BrowseFleet",
  "/CarParts",
  "/Services",
  "/contact",
  "/FAQ",
  "/privacy",
  "/terms",
  "/login",
  "/register",
];

for (const path of PATHS) {
  test(`axe ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const r = await new AxeBuilder({ page }).analyze();
    // Don't fail the run — collect and report only.
    expect.soft(r.violations).toEqual([]);
    // eslint-disable-next-line no-console
    console.log(
      path,
      "violations=",
      r.violations.length,
      r.violations.map((v) => v.id).join(",")
    );
  });
}
