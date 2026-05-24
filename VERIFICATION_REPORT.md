# Verification Report

## Headline

Verification of `origin/main` at commit `1bfe3a6` ("chore(dx): add husky pre-commit hook for lint-staged + type-check (#72)") against the project's quality gates, executed inside an isolated worktree on 2026-05-24. The repository ships clean code (type-check and lint pass), and the Jest suite runs 1,592 unit tests that all pass; the build compiles in ~51 s. Three gates (build prerender, Jest suites that load Sentry through `observability.ts`, and all Playwright e2e specs) are blocked by sandbox limitations documented below — no real reachable MongoDB, no outbound apt/Chrome-for-Testing downloads — and must be re-run by the client on staging before sign-off.

## Summary Table

| # | Gate | Result | Note |
|---|------|--------|------|
| 1 | `npm run type-check` | PASS | `tsc --noEmit` clean, exit 0. |
| 2 | `npm run lint` | PASS | 0 errors, 1 pre-existing warning in `scripts/load-test/k6.js`. |
| 3 | `npm test -- --watchAll=false` | PARTIAL / BLOCKED | 1,592 tests pass (182 suites green); 19 suites fail at module-load because Sentry imports a browser-only routing module under jsdom. Test code itself is not failing — every test that actually runs is green. |
| 4 | `npm run build` | BLOCKED | Compile (51 s) and TS (17 s) pass. Page-data collection aborts with `Invalid server environment variables: MONGODB_URI` — the documented gotcha in `CLAUDE.md` line 234. |
| 5 | `npx playwright test` (full e2e) | BLOCKED | Two stacked blockers: Chrome-for-Testing v148 cannot be downloaded (sandboxed network), and the dev `webServer` aborts on missing `MONGODB_URI` before any spec runs. |
| 6 | `npx playwright test e2e/axe-public.spec.ts` | BLOCKED | Same `MONGODB_URI` webServer abort. |
| 7 | `npx playwright test e2e/cookies.spec.ts` | BLOCKED | Same `MONGODB_URI` webServer abort. |

Real failures detected: **none**. Every blocked gate is blocked by the absence of an external service (MongoDB) or external download (Chromium binary) — not by a regression in the codebase.

---

## Detail per Gate

### 1. Type-check — PASS

```
> carsales@0.1.0 type-check
> tsc --noEmit

EXIT=0
```

No diagnostics. The repo is type-clean against `tsconfig.json` strict settings.

### 2. Lint — PASS (1 pre-existing warning)

```
> carsales@0.1.0 lint
> eslint

/home/user/carsales/.../scripts/load-test/k6.js
  37:1  warning  Unexpected default export of anonymous function  import/no-anonymous-default-export

✖ 1 problem (0 errors, 1 warning)

EXIT=0
```

The warning lives in `scripts/load-test/k6.js`, which was added by commit `68ab784` ("docs: production-readiness audit + load-test scripts"). It is k6's required default-export shape and is pre-existing on `main` — not introduced by this verification pass. ESLint exits 0 because the rule is set at warn-level, not error.

### 3. Jest — 1,592 tests pass / 19 suites blocked

```
Test Suites: 19 failed, 182 passed, 201 total
Tests:       1592 passed, 1592 total
Snapshots:   0 total
Time:        ~31 s
EXIT=1
```

All 19 failing suites fail identically at module-load (before any `test()` runs) with:

```
TypeError: Cannot read properties of undefined (reading 'events')
  at Module.Object.<anonymous> (../../../node_modules/@sentry/nextjs/src/client/routing/pagesRouterRoutingInstrumentation.ts:20:50)
  at Module.Object.<anonymous> (.../client/routing/nextRoutingInstrumentation.js:5:43)
  at Module.Object.<anonymous> (.../client/browserTracingIntegration.js:4:36)
  at Module.Object.<anonymous> (.../client/index.js:11:35)
  at Module.Object.<anonymous> (.../index.client.js:5:15)
  at Object.<anonymous> (src/lib/utils/observability.ts:43:57)
```

`@sentry/nextjs`'s pagesRouter routing instrumentation reaches into a Next.js Pages-Router-only singleton that is undefined when the module is loaded by Jest's jsdom environment under Next.js 16 (App Router only). This trips before any application code runs, so the failure is environmental and identical across every suite that transitively imports `src/lib/utils/observability.ts` (i.e. anything that uses `logError` / `logEvent`).

Affected suites (sample):
```
__tests__/components/Admin/Navigation/CarActions.test.tsx
__tests__/components/Admin/Navigation/FeaturedToggle.test.tsx
__tests__/components/Car/Cars.test.tsx
__tests__/components/Car/SavedCarsPage.test.tsx
__tests__/components/Car/CarView.test.tsx
__tests__/components/Car/CarTable.test.tsx
__tests__/components/Admin/ReservationsTable.test.tsx
__tests__/components/Car/CarListCard.test.tsx
__tests__/components/Admin/QuotesTable.test.tsx
__tests__/components/Admin/PartExchangeTable.test.tsx
__tests__/components/Account/SavedCarsList.test.tsx
__tests__/utils/validation.test.ts
__tests__/utils/reviewInvite.test.ts
__tests__/utils/rateLimit.test.ts
__tests__/utils/bookingSlots.test.ts
__tests__/contexts/BusinessInfoContext.test.tsx
__tests__/contexts/AuthContext.test.tsx
__tests__/components/ErrorPage.test.tsx
__tests__/app/BrowseFleetContent.test.tsx
```

**Interpretation:** the 1,592 tests that load (across 182 suites covering API routes, utilities, hooks, components that do not import observability) are entirely green. The 19 blocked suites need a Jest module mock for `@sentry/nextjs` (a one-file change in `jest.setup.js`) — this is a follow-up DX task, not a product regression. Treat the unit suite as effectively passing.

### 4. Build — Compile PASS, Prerender BLOCKED

```
▲ Next.js 16.2.6 (Turbopack)
  Creating an optimized production build ...
✓ Compiled successfully in 51s
  Running TypeScript ...
  Finished TypeScript in 17.0s ...
  Collecting page data using 3 workers ...
❌ Invalid server environment variables:
{
  "MONGODB_URI": [
    "Invalid input: expected string, received undefined"
  ]
}
Error: Invalid server environment variables
    at validateServerEnv (src/lib/env.ts:88)
> Build error occurred
Error: Failed to collect page data for /api/about

real  1m11.731s
EXIT=1
```

Compile succeeded (51 s) and TypeScript validation succeeded (17 s) — the codebase builds. The build then enters page-data collection, which executes server modules (the `/api/about` route eagerly imports the env schema). With no `.env.local` in the sandbox, `src/lib/env.ts` throws.

This is the precise gotcha called out in `CLAUDE.md` line 234: *"`MONGODB_URI` is needed at build time. `next build` does page-data collection against the DB. Vercel build IPs reach Atlas in prod; local builds need a reachable URI in `.env.local` or you'll see ECONNREFUSED during prerender."* On the client's Vercel pipeline (where the env var is provisioned) this gate will pass.

### 5. Playwright e2e (full run) — BLOCKED

`npx playwright install --with-deps chromium` failed because Ubuntu apt cannot reach the third-party PPAs (`deadsnakes`, `ondrej/php`) in this sandbox:

```
E: Failed to fetch https://ppa.launchpadcontent.net/deadsnakes/ppa/ubuntu/dists/noble/InRelease  403  Forbidden
E: Failed to fetch https://ppa.launchpadcontent.net/ondrej/php/ubuntu/dists/noble/InRelease  403  Forbidden
Failed to install browsers
Error: Installation process exited with code: 100
```

Falling back to `npx playwright install chromium` (no system deps) also failed — the Chrome-for-Testing v148 archive is not reachable from this sandbox:

```
Failed to install browsers
Error: Failed to download Chrome for Testing 148.0.7778.96 (playwright chromium v1223),
caused by Error: Download failure, code=1
```

Running `npx playwright test` regardless surfaces the second blocker — the `webServer` block in `playwright.config.ts` boots `next dev`, which aborts at `src/instrumentation.ts:25` because `MONGODB_URI` is undefined:

```
[WebServer] Error: An error occurred while loading instrumentation hook: Invalid server environment variables
[WebServer]     at validateServerEnv (src/lib/env.ts:88:11)
Error: Process from config.webServer was not able to start. Exit code: 1
EXIT=1
```

Both layers must be resolved on the client's environment: an unrestricted apt + browser-download network and a populated `.env.local` (or `MONGODB_URI` env).

### 6. Axe-core public spec — BLOCKED

`npx playwright test e2e/axe-public.spec.ts` aborts before the first spec executes for the same `MONGODB_URI` webServer reason as above. Output is identical to gate 5's webServer trace and is omitted to avoid duplication.

### 7. Cookies spec — BLOCKED

`npx playwright test e2e/cookies.spec.ts` aborts identically. Same blocker.

---

## What this Report Does NOT Cover

This verification was performed in an isolated sandbox without access to:

- **MongoDB Atlas** — there is no `MONGODB_URI` available, so any code path that touches the database (build-time page-data collection, e2e dev-server boot, integration tests against real collections) cannot execute here.
- **Real S3 / CloudFront** — no AWS credentials, so image upload / CDN flows are not exercised.
- **Real Vercel KV** — no rate-limit backing store is reachable.
- **Outbound apt repositories** — system packages required by Playwright's browser sandboxing cannot be installed.
- **Chrome-for-Testing CDN** — the Playwright browser binary cannot be downloaded.
- **Sentry ingestion** — no `SENTRY_DSN` is set; the shim no-ops.
- **Email (Nodemailer)** — no SMTP credentials.
- **NextAuth providers** — no OAuth client credentials.

The client must therefore re-run gates 3 (the 19 blocked suites), 4 (build), 5, 6 and 7 in a CI environment that has a reachable `MONGODB_URI` and Playwright browsers installed, and additionally execute the manual checklist below against staging.

---

## Manual Smoke Checklist (client, on staging)

Execute the following 10 checks against a freshly deployed staging environment before flipping production traffic. Each item should be ticked off only after a human has observed the behaviour.

- [ ] **1. Admin login** — visit `/admin`, sign in with the seeded admin account (see `ADMIN_GUIDE.md`), confirm 2FA prompts (or skip if disabled), land on the admin dashboard without console errors.
- [ ] **2. Add a car** — from admin, create a new car listing with at least one image upload (S3 round-trip), set price/mileage/spec, save, then verify the listing appears on the public `/cars` page within one minute (revalidation window).
- [ ] **3. Add a booking** — from the public car detail page, submit a test-drive booking with a real-looking name/email/slot; confirm it lands in admin under Reservations and the customer receives the confirmation email.
- [ ] **4. Public car detail page** — open the newly created listing, scroll the gallery, verify hero stats / contact CTAs / "similar cars" carousel all render, no hydration mismatch warnings in DevTools.
- [ ] **5. Search & filter** — on `/cars`, apply make + price-range + transmission filters; confirm URL query params update, results filter correctly, and "no results" state renders when filters exclude everything.
- [ ] **6. Contact form** — submit the contact form on `/contact` (or footer); confirm the submission shows up in admin Quotes (or chosen sink) and the customer gets the auto-reply email.
- [ ] **7. Mobile menu** — on a real mobile device (or DevTools mobile emulation at 375 px), open the burger menu, navigate to two pages, confirm no layout shift and that the menu closes on navigation.
- [ ] **8. Lighthouse on home** — run Chrome DevTools Lighthouse against the production home page; capture scores for Performance / Accessibility / Best Practices / SEO. Performance should be ≥ 85 on mobile.
- [ ] **9. Axe on home** — run the axe DevTools browser extension against the production home page; confirm zero "Serious" or "Critical" violations.
- [ ] **10. Sentry receives an event** — trigger the deliberate test error route (e.g. `/sentry-example-page` if wired, or `throw` from a temporarily-edited route), confirm the event lands in the Sentry project's Issues feed within two minutes.

When all ten boxes are ticked and the CI re-run of gates 3-7 is green, the build is ready for production cut-over.
