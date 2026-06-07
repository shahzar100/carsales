import { test, expect } from "@playwright/test";
import { smoke, hasCron } from "./_env";

/**
 * Cron endpoint auth on the live deploy.
 *  - unauthenticated → 401 (proves CRON_SECRET is configured; an unset secret
 *    would surface as 500). Read-only, prod-safe.
 *  - with the secret → 200. This triggers real review-invite sends, so it's
 *    staging-only (runs only when SMOKE_CRON_SECRET is provided).
 */
test("cron rejects unauthenticated calls (401)", { tag: "@prod-safe" }, async ({ request }) => {
  const res = await request.get("/api/cron/review-invites");
  expect(
    res.status(),
    "expected 401 (CRON_SECRET configured); 500 means it's missing on the target"
  ).toBe(401);
});

test("cron accepts the configured secret (200)", async ({ request }) => {
  test.skip(!hasCron, "SMOKE_CRON_SECRET not set — staging only");
  const res = await request.get("/api/cron/review-invites", {
    headers: { authorization: `Bearer ${smoke.cronSecret}` },
  });
  expect(res.status()).toBe(200);
});
