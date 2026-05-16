import { test, expect } from "@playwright/test";

test("cookies before consent are first-party / non-tracking", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });

  const cookies = await ctx.cookies();
  // eslint-disable-next-line no-console
  console.log("Cookies set on / before consent:", JSON.stringify(cookies, null, 2));

  // Assert: no third-party tracking domains
  const trackers = cookies.filter((c) =>
    /google|doubleclick|facebook|hotjar|segment|mixpanel|amplitude|_ga|_gid|_fbp/i.test(
      `${c.domain} ${c.name}`
    )
  );
  expect.soft(trackers, "no third-party trackers before consent").toEqual([]);
  await ctx.close();
});
