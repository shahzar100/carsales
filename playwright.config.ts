import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Morley Motor Company E2E tests.
 *
 * Coverage scope: 10 critical-path tests across public booking flows
 * and admin-only management. Not aiming for exhaustive coverage —
 * E2E is the slowest, flakiest layer of the testing pyramid, so we
 * keep it focused on revenue-critical and security-critical journeys.
 *
 * Run locally:   npm run test:e2e
 * Run with UI:   npm run test:e2e:ui
 * Run headed:    npm run test:e2e:headed
 */
export default defineConfig({
  testDir: "./e2e",
  // Seed an admin user before the suite runs so admin-flow specs can
  // authenticate against an otherwise-empty mongo:7.
  globalSetup: "./e2e/global-setup.ts",
  // Each test file is independent; let Playwright parallelise across them.
  fullyParallel: true,
  // No `.only` allowed in CI — fail the suite if someone forgot to remove it.
  forbidOnly: !!process.env.CI,
  // Single retry on CI smooths out the inevitable flake from network/animation.
  retries: process.env.CI ? 1 : 0,
  // Single worker on CI keeps DB writes deterministic; local dev gets the
  // default (one per CPU core) for speed.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["list"]]
    : [["html"], ["list"]],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // In CI, the workflow brings the server up itself (separate `npm start`
  // step, after `npm run build`). Locally, this autostart keeps `npm run
  // test:e2e` a single command.
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
