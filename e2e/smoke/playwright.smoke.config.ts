import { defineConfig, devices } from "@playwright/test";

/**
 * SMOKE config — runs against a DEPLOYED build (no local webServer). The target
 * comes from SMOKE_BASE_URL (or BASE_URL). Tests tagged `@prod-safe` are
 * read-only and safe to run against production on a schedule; the rest mutate
 * data and should target staging (they auto-skip when their creds are absent).
 *
 *   SMOKE_BASE_URL=https://staging.example.com npm run test:smoke
 *   npm run test:smoke -- --grep @prod-safe        # read-only subset
 */
const baseURL = process.env.SMOKE_BASE_URL || process.env.BASE_URL;

export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  workers: 2,
  // One retry — these run over the network against a live deploy.
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
