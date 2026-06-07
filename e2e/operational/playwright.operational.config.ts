import { defineConfig } from "@playwright/test";

/**
 * OPERATIONAL E2E config — exercises the integration code that talks to
 * external services (S3, KV rate limiting, SMTP, cron auth, Turnstile) against
 * local fakes / Cloudflare test keys provisioned by ./run.mjs.
 *
 * Deliberately NOT part of the default `test:e2e` run (that suite stays
 * hermetic + fast). Run via `npm run test:e2e:operational`. Serial: several
 * specs are stateful (rate-limit counters, cron claim/idempotency).
 */
export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  outputDir: "./_artifacts",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
