#!/usr/bin/env node
/**
 * Detailed axe-core dump for a single URL. Useful when iterating on
 * color-contrast / select-name fixes — surfaces the failing selector,
 * actual colour pair, and required ratio for each violation node.
 *
 * Usage:
 *   node scripts/axe-detail.mjs http://localhost:3000/CarParts
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const url = process.argv[2] || "http://localhost:3000/";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.setDefaultTimeout(90000);
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForLoadState("load", { timeout: 60000 }).catch(() => {});

const r = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  .analyze();

console.log(`\n=== ${url} — ${r.violations.length} violation(s) ===\n`);
for (const v of r.violations) {
  console.log(`[${v.impact}] ${v.id}: ${v.help}`);
  console.log(`  ${v.helpUrl}`);
  for (const n of v.nodes.slice(0, 6)) {
    console.log(`  • ${n.target.join(", ")}`);
    if (n.any?.[0]?.message) console.log(`      ${n.any[0].message.split("\n")[0]}`);
  }
  if (v.nodes.length > 6) console.log(`  • …+${v.nodes.length - 6} more`);
}

await browser.close();
