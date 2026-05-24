# Handover Summary

Cycle close date: 2026-05-24.

## 1. Overview

This cycle (PRs #58–#87) is the handover-prep pass for the MMC Leeds car-sales site. The cycle ran 2026-05-24 and covers thirty pull requests against `main`. The headline outcomes:

- Removed two features that were out of scope for the live site (Finance calculator, Accident Claims).
- Fixed the one real keyboard-handler bug in the site and corrected the inflated "170 sites" audit figure in the handover notes.
- Split the three largest components (`Header`, `BookingFlow`, `BusinessInfoForm`) into focused sibling files without behaviour changes.
- Wired Sentry behind a DSN gate so the SDK is a true no-op until a DSN is provisioned. Added a `beforeSend` PII filter that strips bearer-credential-equivalent query params before any event leaves the process.
- Added Lighthouse-driven LCP wins for the homepage hero, BrowseFleet first card, car-detail page, and the CarParts grid.
- Repaired six pre-existing broken test suites and unblocked a further nineteen via a global `@sentry/nextjs` jsdom mock; jsdom test coverage moved from 74.82% to 78.46% statements.
- Shipped two product gaps from PR #74's audit: the admin shop save now revalidates marketing pages, and pending→confirmed booking transitions now email the customer.
- Added a uptime-monitoring `/api/health` endpoint, admin CSV export for bookings and cars, husky pre-commit hooks, a CI bundle-size budget, MongoDB indexes for hot queries (notably password-reset tokens which were doing full collection scans), and tightened seven security headers.
- Produced six standing reference documents at the repo root: `CLAUDE.md`, `HANDOVER_NOTES.md`, `DEPLOYMENT.md`, `ADMIN_GUIDE.md`, `INDEX_AUDIT.md`, `CSP_REVIEW.md`.

Every PR listed below has been merged into `main` as of the cycle close date.

## 2. At a glance

| PR  | Title                                                          | Theme         | What changed                                                                                       |
| --- | -------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| #58 | Handover cleanup (Finance + AccidentClaims removed)            | refactor      | Deleted out-of-scope features, polished booking confirmation, added `HANDOVER_NOTES.md`. Net -813 lines. |
| #59 | CarShareModal keyboard-activatable                             | a11y          | Replaced a `<span onClick>` trigger with a real `<button>`; added regression test.                 |
| #60 | Corrected 170-site audit claim                                 | docs          | Rewrote `HANDOVER_NOTES.md` Accessibility section after a real audit found one genuine bug, not 170. |
| #61 | BusinessInfoForm refactor                                      | refactor      | Split a 1,143-line admin form into a 143-line orchestrator plus 9 section components.              |
| #62 | Hero LCP `sizes` + broken image refs                           | perf          | Added `sizes` to the hero `<Image>`, fixed legacy `/images/cars/...` image references.             |
| #63 | Sentry wired (gated on DSN)                                    | observability | Installed `@sentry/nextjs`, wired captures via the existing shim; no-op without `SENTRY_DSN`.      |
| #64 | gitignore .claude/                                             | dx            | Ignored the worktree-mount directory used by sub-agent isolation.                                  |
| #65 | CLAUDE.md                                                      | docs          | Added a focused onboarding reference covering stack, scripts, layout, patterns, gotchas.           |
| #66 | Header + BookingFlow refactor                                  | refactor      | Split the 1,002-line `Header.tsx` and 1,158-line `BookingFlow.tsx` into orchestrators + siblings.  |
| #67 | A11y long-tail                                                 | a11y          | Fixed `main`/`region` landmarks, heading order on 5 pages, `RangeInput` labels.                    |
| #68 | Test coverage uplift                                           | tests         | Added 19 new test files (102 assertions); statements coverage 74.82% → 78.46%.                     |
| #69 | DEPLOYMENT.md + ADMIN_GUIDE.md                                 | docs          | Added day-1 operational runbook + non-technical admin guide at repo root.                          |
| #70 | 6 broken test suites fixed                                     | tests         | Repaired Toast, WhyChooseHome, two admin booking suites, confirmation page, CarDetailView tests.   |
| #71 | Perf wins (priority, lazy-load, sizes audit, CSS trim)         | perf          | LCP card `priority`, dynamic-imported reserve/PX/share forms, missing `sizes`, dead CSS removed.   |
| #72 | husky pre-commit hook (lint-staged + type-check)               | dx            | New pre-commit gate runs eslint on staged files and the full type-check before every commit.       |
| #73 | HANDOVER_SUMMARY.md (this file)                                | docs          | Day-1 client reference covering the prep cycle, grouped by audience and theme.                     |
| #74 | Runbook TODOs resolved + sync HANDOVER_NOTES                   | docs          | Replaced five "TODO: confirm with developer" notes in #69 with verified findings; resynced notes.   |
| #75 | Delete 3 unused components + tests                             | refactor      | Removed `Shared/SearchBar`, `Main/Form/ServiceBookingForm`, `Helpful/Buttons/ShopButton`. -1,331 lines. |
| #76 | Pre-handover verification report                               | docs          | `VERIFICATION_REPORT.md` — ran every quality gate end-to-end, honestly flagged sandbox blockers.    |
| #77 | Security review of the prep cycle                              | docs          | `SECURITY_REVIEW.md` — 11 findings (2 High upstream-blocked, 3 Medium with fix PRs queued).         |
| #78 | `/api/health` + admin CSV export                               | feature       | Public health probe (DB+KV, 60/min rate-limited) + manager-gated CSV downloads for bookings & cars. |
| #79 | Global `@sentry/nextjs` jsdom mock                             | tests         | Single setup-file mock unblocked 19 test suites; replaced per-test mocks added by #70.              |
| #80 | Sentry `beforeSend` PII filter                                 | observability | Strips `ref`, `email`, `token`, `turnstileToken`, etc. from event URLs/breadcrumbs (PR #77 Medium #2). |
| #81 | URL-encode KV rate-limit keys                                  | security      | `encodeURIComponent` + length-bound hash on rate-limit identifiers; closes the `/`-in-email bypass (PR #77 Medium #3). |
| #82 | CarPartsGrid `fill` + `sizes`                                  | perf          | Switched the parts-grid `<Image>` from fixed-size to `fill`+`sizes` without aspect-ratio regression. |
| #83 | Bundle-size budget CI                                          | dx            | `size-limit` CI job with current+10% budgets on home, BrowseFleet, car-detail, and aggregate chunks. |
| #84 | Booking-confirm customer email                                 | feature       | New `BookingConfirmedEmail` template fires on admin pending→confirmed; idempotent, mail failure non-fatal. |
| #85 | Admin shop save → `revalidatePath`                             | feature       | `PUT /api/admin/shop` now revalidates all 14 public marketing pages that consume `getBusinessInfo()`. |
| #86 | CSP / security headers tightened                               | security      | `frame-ancestors: 'none'`, `object-src 'none'`, `upgrade-insecure-requests`, `X-Frame-Options: DENY`, stricter Referrer-Policy, 18-feature Permissions-Policy. |
| #87 | MongoDB index audit + 10 indexes added                         | perf / db     | `INDEX_AUDIT.md` + sparse indexes on `resetToken`/`verifyToken` (were full-scan), compound indexes on `cars`/`bookings` sort paths. |

## 3. What's new for you (the client)

### If you're a customer

- Faster homepage — the featured-car image now ships with `priority` plus a `sizes` hint, so the browser fetches the right resolution and stops downloading the full-size source on phones. Lighthouse measured LCP at 3.27s before the `sizes` fix (#62, #71).
- The hero image no longer 404s when the seeded DB points at a missing `/images/cars/...` path — `HeroSection` now falls back to the bundled placeholder, and the noisy "isn't a valid image" line stops appearing in the server log (#62).
- Faster BrowseFleet — the first car card on page 1 is now eagerly loaded so the above-the-fold thumbnail is not blocked behind a lazy-load; subsequent rows remain lazy (#71).
- Car-detail page first paint is leaner — the Reserve form, Part-Exchange form, and Share modal are dynamically imported with `next/dynamic` instead of being in the initial JS chunk. The two forms only render after the auth gate; the modal only renders on click (#71).
- Booking-flow confirmation images now ship correct `sizes` so the browser stops fetching the full-resolution source on every viewport (#71).
- Share-on-keyboard works — tab to the Share button on a car detail page, press Enter, and the modal opens (previously mouse-only — the trigger was a `<span onClick>` wrapping a non-interactive icon) (#59).
- No more "Invalid Link" dead-end on `/Booking/confirmation` without a reference — there's now a "Look up a booking" CTA alongside the browse-fleet fallback (#58).
- Cleaner FAQ, Terms, and Privacy — every reference to the removed Finance Calculator and Accident Claims pages has been pulled, and Terms sections renumber cleanly 1–11 with no gap (#58).
- More legible landing pages — heading order on `/`, `/CarParts`, `/contact`, `/register`, `/login` no longer skips levels, which helps screen readers and SEO. Footer column titles dropped a level so the Login/Register pages no longer break `heading-order` axe rules (#67).
- The `WhatsAppButton` floating CTA now sits inside an `<aside>` landmark so axe-core reports a clean `region` audit on text-light pages (#67).
- The `RangeInput` min/max number pair (used in BrowseFleet filters) now has explicit `aria-label`s so screen readers announce "minimum" / "maximum" correctly (#67).

### If you're an admin

- The Business Info form in `/admin/dashboard/shop` is now nine focused sections under `src/components/Admin/Tabs/BusinessInfo/` (core info, hours, social media, hero stats, detailing packages, tint options, service overviews, recovery, with a shared `Section.tsx` collapsible card and shared `styles.ts` for input/label classes) instead of one 1,143-line file. Same UI, same fields, same save behaviour, same call sites — the test suite (15 tests) is untouched (#61).
- **Shop saves now propagate to the public site within seconds** instead of waiting for the per-page `revalidate` window — `PUT /api/admin/shop` calls `revalidatePath` for all 14 marketing pages that consume `getBusinessInfo()` (#85).
- **Customers now get a confirmation email when you mark their booking confirmed** (previously only cancellation emailed). New `BookingConfirmedEmail` template covers both service and viewing bookings; idempotent on confirmed→confirmed; the Mongo write still succeeds even if the email transport hiccups (#84).
- **CSV download for bookings and cars.** New "Export CSV" links on the admin Bookings and Cars list pages — manager+ role only, rate-limited, RFC-4180-quoted output with today's date in the filename (`bookings-2026-05-24.csv`). Use this to extract data into Excel without DB access (#78).
- **`/api/health` endpoint** for uptime monitoring (UptimeRobot, Pingdom, Better Uptime). Returns 200 + a JSON `{ status, version, checks: { db, kv } }`; returns 503 if any check fails so the monitor can alert on either non-200 OR `checks.<x> !== "ok"`. Public, no auth, 60-requests-per-minute-per-IP rate limit (#78).
- A non-technical "how to do everything in admin" guide ships as `ADMIN_GUIDE.md` at the repo root — covers login + 2FA enrolment, adding a car step-by-step (including the S3 image upload, the 10 MB / JPEG/PNG/WebP/AVIF limits, and what each `status` value does on the public site), editing every section of the Business Info form and how changes propagate, handling bookings (confirm / mark complete / cancel) and which emails fire automatically, the customer-accounts / reservations / part-exchange / quotes / reports tabs, plus a short "what to do when X breaks" triage list. Five claims were initially flagged `TODO: confirm with developer`; all five have since been replaced with verified findings (#69, #74).
- The Header's mobile menu, account dropdown, and search sheet are now separate components under `src/components/Header/` — same behaviour but each piece is small enough to edit safely (#66).

### If you're a developer

- `CLAUDE.md` at repo root is the day-one onboarding reference — stack verified against `package.json`, every `npm` script, an annotated two-level `src/` tree with both route groups, the dual-auth model (iron-session for admin, NextAuth v5 for customer), the canonical server-component + client-island pattern using the viewing dashboard as the reference, the `getBusinessInfo()` per-request cache + Mongo seeding flow, the observability shim, `createRateLimiter` Vercel KV behaviour, repo conventions, and a numbered gotchas list (including the `next.config.ts` Sentry-wrap warning and the dual-auth-no-shared-middleware constraint) (#65).
- `DEPLOYMENT.md` at repo root is the operational runbook — Vercel + Node 22 hosting assumptions, the `proxy.ts` / CSP nonce setup, every env var grouped by concern (auth, DB, email, S3, payments-N/A, Sentry, KV, cron) cross-checked against `.env.example` and a `process.env.*` grep, MongoDB Atlas / S3 / KV / SMTP setup with the exact indexes the app expects to create, the single Vercel cron and what `CRON_SECRET` protects, a sequenced first-deploy checklist, and a triage section for the most common failure modes (500s, missing bookings, email not sending, image uploads, login/2FA, rate-limit fail-closed) (#69).
- Sentry is wired and ready to activate — set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` and runtime capture starts; no code change required. The shim's public API (`logError`, `logEvent`) is unchanged, so the 175 call sites across the app stayed put. Without a DSN, the SDK is a true no-op at three layers: each `sentry.{client,server,edge}.config.ts` skips `Sentry.init`, the shim computes `sentryEnabled` at module load and skips capture calls, and `next.config.ts` only wraps with `withSentryConfig` when a DSN is detected. To also upload source maps for readable stack traces, set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` and redeploy (#63).
- Three large components are no longer monoliths: `Header` (1,002 → orchestrator 230 + 7 siblings under `src/components/Header/` — `TopBar`, `AccountMenu`, `DesktopMenu`, `MobileMenu`, `SearchBar`, `DropdownPanel`, `constants.ts`), `BookingFlow` (1,158 → orchestrator 305 + 5 step views `Step1_Service` through `Step5_Confirm` + `bookingFlowTypes.ts` + `bookingFlowSubmit.ts` under `src/components/Booking/Flow/`), `BusinessInfoForm` (1,143 → orchestrator 143 + 9 sections). Each split is mechanical — same public API, no new state managers, no new deps; all `aria-*` / `role` / `tabIndex` attributes preserved verbatim (#61, #66).
- jsdom test coverage went from 74.82% statements / 70.68% branches / 67.97% functions / 76.66% lines to 78.46% / 73.71% / 73.37% / 80.52%. 19 new test files target the previously-untested `BusinessInfo` sub-components, five public marketing pages (FAQ, privacy + terms, contact, Services, AboutUs) as `await Page()` server-component renders with stubbed children, and five shared UI/utility components (#68).
- Six pre-existing broken test suites are now green: `Toast` (drop the manual 300ms timer wait — `AnimatePresence` mock fires `onExitComplete` synchronously now), `WhyChooseHome` (stub `CountUp` so spring-from-zero doesn't trap the assertion), `ViewingBookingsClient` and `ServiceBookingsClient` (mock `@sentry/nextjs` to avoid `pagesRouterRoutingInstrumentation` crashing under jsdom, plus update the cancel endpoint to `/api/admin/bookings/cancel`), `Booking/confirmation.page` (reworded copy), `CarDetailView` (drop the removed `finance-calc` testid) (#70).
- The `observability.ts` shim's PII redactor (which replaces `email`, `phone`, `password`, `token`, etc. with `"[redacted]"`) is still in place — Sentry sees redacted context, not raw values.
- `.claude/` is gitignored so sub-agent worktrees mounted under `.claude/worktrees/` don't show up in `git status` and don't trip the local stop-hook check (#64).
- The eight unused CSS utility classes (`input-lg`, `select-lg`, `card-elevated`, `card-interactive`, `badge-gray`, `tag`, `tag-neutral`, `divider-strong`) are gone from `src/app/globals.css` — grep audit confirmed zero call sites in `src/` (#71).
- **Pre-commit hook** runs `lint-staged` (eslint on staged files) + the full `tsc --noEmit` before every commit. Bypass with `--no-verify` only when absolutely necessary. Husky 9.1.7 + lint-staged 17.0.5 (#72).
- **Bundle-size budget CI.** New `.github/workflows/size-limit.yml` runs `size-limit` against every PR. Budgets are at current size + 10% (gzipped); regressions fail the check. Tracks home (2.91 kB), BrowseFleet listing (2.73 kB), car-detail (2.75 kB), and aggregate client chunks (681 kB) (#83).
- **Sentry events no longer carry PII in URLs.** `beforeSendRedact` strips `ref`, `email`, `token`, `turnstileToken`, `password`, `secret`, `apiKey`, `sessionId`, `auth`, `code` from event URLs, breadcrumbs, and `query_string` (all three shapes Sentry accepts). Case-insensitive, snake_case + camelCase variants both covered (#80).
- **KV rate-limit keys are URL-encoded** so an RFC-5321 email address containing `/` can't split the Upstash REST path and bypass the per-recipient cap. Keys longer than 200 chars are SHA-256-prefixed instead of being passed verbatim, capping KV memory pressure from pathological inputs (#81).
- **Three dead source files removed** (`Shared/SearchBar.tsx`, `Main/Form/ServiceBookingForm.tsx`, `Helpful/Buttons/ShopButton.tsx`) along with their tests. -1,331 lines net. The agent verified zero production importers via grep before deleting (#75).
- **CarPartsGrid moved to `fill` + `sizes`** with a fixed aspect-ratio wrapper, so `next/image` now serves a viewport-appropriate variant per card per breakpoint instead of the largest configured source. Aspect ratio preserved exactly via the `h-48` wrapper (#82).
- **Global `@sentry/nextjs` jest mock.** The SDK's `pagesRouterRoutingInstrumentation` throws at module load under jsdom because the project is App Router only. A single mock in `jest.setup.component.js` covers `captureException` / `captureMessage` / `addBreadcrumb` / `setUser` / `setTag` / `setContext` / `withScope` / `init`, unblocking 19 test suites. Test count moved from 183/202 suites green to **202/202**, 1776/1776 tests (#79).
- **MongoDB indexes** for hot queries — most importantly **sparse single-field indexes on `resetToken` and `verifyToken`** in `users` and `adminUsers`. Every password-reset / verification-email link click was doing a full collection scan before this; now O(log n). Also compound indexes on `cars` ({status, mileage}, {status, year:-1}, {status, fuel}) for BrowseFleet sort options, and email+createdAt indexes on the three booking collections (#87).
- **Security headers tightened**: `frame-ancestors: 'none'` (site is never iframed), `object-src 'none'`, `upgrade-insecure-requests`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, 18-feature `Permissions-Policy` block (camera/mic/geolocation/payment/usb/interest-cohort/browsing-topics/etc.). `style-src 'unsafe-inline'` deferred because Motion and `next/font` still rely on it — the report-only CSP mirror continues to collect telemetry (#86).
- **CSP / security review document** at `CSP_REVIEW.md` records what flipped, what stayed in report-only, and why. Anything irreversible (HSTS preload — already applied earlier) flagged in caps (#86).
- **MongoDB index audit document** at `INDEX_AUDIT.md` lists every query in the codebase, which fields it filters/sorts on, the required index, and current status (exists / added in #87 / not needed and why) (#87).
- **Pre-handover verification report** at `VERIFICATION_REPORT.md` ran every quality gate (type-check, lint, jest, build, playwright + axe + cookies specs) end-to-end and distinguished honestly between "passed", "failed", "blocked by sandbox limitation". Real findings are surfaced; the prerender / Chrome-binary blockers are explicitly out of scope (#76).
- **Security review of the prep cycle** at `SECURITY_REVIEW.md`: 11 findings — 2 High (Next.js 16.2.6 upstream advisories awaiting patches), 3 Medium (all three fixed in PRs #79, #80, #81 — the jsdom jest crash, Sentry PII leak, KV path-split bypass), 2 Low, 4 Info (#77).

## 4. What's still TODO

### Vulnerable dependencies awaiting upstream patches

Per `HANDOVER_NOTES.md` §4. `npm audit fix --force` would downgrade Next.js to 9.x — do not run it. All of these need upstream patch releases:

- **Next.js 16.2.6** — 13 advisories.
  - DoS via Server Components.
  - XSS in CSP nonces.
  - XSS in beforeInteractive scripts.
  - Image Optimization DoS.
  - SSRF via WebSocket upgrades.
  - Segment-prefetch + dynamic-route-param middleware bypass.
  - Cache poisoning of RSC responses.
  - Action: watch the Next.js release notes and bump as patched versions land.
- **`nodemailer@7.0.13`** — SMTP command injection via unquoted `envelope.size` and CRLF in transport name. No fix currently available; review again next release cycle.
- **`postcss <8.5.10`** (transitive via `@react-email/preview-server`, dev-only) — XSS via unescaped `</style>` in CSS stringify. Will be fixed by upgrading `@react-email/preview-server` once that releases.
- **`ws@8.0.0-8.20.0`** — uninitialised memory disclosure. Transitive.

### Selection-card `role="radio"` follow-up

Deferred from #67. The booking-flow `ServiceCard` / `PackageCard` components still expose `aria-pressed` instead of `role="radio"`. Promoting them properly needs the wrapping grid in `BookingFlow.tsx` to become `role="radiogroup"` with `aria-label` at the same time, and the corresponding `getByRole("button")` assertions in `__tests__/components/Booking/Flow/{Service,Package}Card.test.tsx` updated. One-shot job once those files are next on the table.

### Performance follow-ups flagged by #71

- **`next/font` is not in use anywhere.** UI falls back to the system stack. Introducing `next/font/google` was deliberately left out of #71 — it adds a network dep and needs design sign-off on family selection.
- ~~**`CarPartsGrid.tsx:122-128`** uses fixed `width={300}/height={192}` inside a responsive grid.~~ **Resolved in #82** — moved to `fill` + `sizes` with the existing `h-48` wrapper preserving the aspect ratio exactly.
- ~~**Three dead source files retained because they have tests:** `src/components/Shared/SearchBar.tsx`, `src/components/Main/Form/ServiceBookingForm.tsx`, `src/components/Helpful/Buttons/ShopButton.tsx`.~~ **Resolved in #75** — all three deleted along with their tests; -1,331 lines net.

### Remaining gaps

- **Customer-record admin UI does not exist.** PR #74 confirmed via walking every page under `src/app/(admin)/admin/dashboard/`: there is no UI surfacing the NextAuth `users` collection. The `/api/admin/users/*` routes manage the `adminUsers` collection (staff accounts) only. A `/admin/dashboard/customers` page would be a real day-2 win.
- **`type-check` is still in the husky pre-commit hook** instead of CI-only. A separate PR tried to move it to CI but was blocked by the harness's write-permission policy on `.husky/` and `.github/workflows/`. The existing `ci.yml` already runs lint + type-check + test in CI, so this is purely a "speed up local commits" follow-up — not a correctness gap.
- **`next/font` not adopted** (see above).

### Other items flagged in `HANDOVER_NOTES.md`

- **Rate limiting must use Vercel KV in production.** `createRateLimiter` falls back to per-instance in-memory storage when KV env vars are absent — under autoscaling that is effectively no rate limit. Set `KV_REST_API_URL` and `KV_REST_API_TOKEN` before going live.
- **`SESSION_SECRET` regenerates on dev restart if unset.** Set a stable value in `.env.local` if you want sessions to survive `next dev` restarts.
- **`MONGODB_URI` is required at build time.** `next build` does page-data collection against the DB; Vercel build IPs reach Atlas in prod, but local builds need a reachable URI in `.env.local`.
- **Test coverage headroom is now the API config.** The jsdom config sits at 78.46% statements after #68; the long tail is in API routes, which are exercised by the separate `jest.config.api.js` suite.

## 5. Where to find what

| File                  | Purpose                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`           | Developer onboarding — stack, scripts, layout, auth, patterns, gotchas. Day-one reference for engineers.      |
| `DEPLOYMENT.md`       | Operations runbook — env vars, MongoDB/S3/KV/SMTP setup, cron, first-deploy checklist, failure-mode triage. Landed in #69. |
| `ADMIN_GUIDE.md`      | Non-technical admin staff guide — login + 2FA, adding a car, editing business info, handling bookings. Landed in #69. |
| `HANDOVER_NOTES.md`   | Narrative history — what was removed during handover, status of older audit findings, known issues for next dev. |
| `HANDOVER_SUMMARY.md` | This file — what shipped this cycle (PRs #58–#87), grouped by audience and theme.                             |
| `INDEX_AUDIT.md`      | MongoDB index audit — every query, the required index, current status. Landed in #87.                         |
| `CSP_REVIEW.md`       | CSP / security headers review — current vs proposed, applied vs deferred (with reasons). Landed in #86.        |
| `VERIFICATION_REPORT.md` | Pre-handover verification — every quality gate run end-to-end, sandbox blockers vs real failures. Landed in #76. |
| `SECURITY_REVIEW.md`  | Security review of the prep cycle — 11 findings with severity, file:line, and recommended fix. Landed in #77.  |
| `CONTRIBUTING.md`     | Pre-commit hooks, bundle-size budget rules, how to bypass. Landed in #72 / #83.                                |
| `SETUP.md`            | Env vars, Sentry wiring detail, staging, backups, secret rotation.                                            |
| `RUNBOOK.md`          | On-call ops procedures.                                                                                       |
| `OPERATIONS.md`       | Non-technical day-to-day staff guide (older — `ADMIN_GUIDE.md` supersedes for admin tasks).                   |
| `README.md`           | Design-system / UI standards (colours, typography, semantic utility classes).                                 |
| `.env.example`        | Authoritative env-var template, cross-checked against `process.env.*` usage in source.                        |

## 6. Sign-off checklist — day 1

Follow these in order. Most steps reference one of the docs above.

1. **Set every env var listed in `.env.example`.**
   - Required at minimum: `MONGODB_URI`, `SESSION_SECRET` (32+ chars), `AUTH_SECRET`, `EMAIL_FROM`, `CRON_SECRET`.
   - Recommended for production: `KV_REST_API_URL` / `KV_REST_API_TOKEN` (distributed rate limiting), `TURNSTILE_*` (bot protection on forms).
   - S3: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`. Add the bucket host (and any CloudFront fronting host) to `next.config.ts:remotePatterns` or `<Image>` will refuse the URL.
   - Full grouped table with which-var-does-what lives in `DEPLOYMENT.md`. The env schema is validated at boot by `src/lib/env.ts` via `src/instrumentation.ts`.
2. **Configure Sentry (#63).**
   - Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to the same DSN string in the runtime environment.
   - For readable stack traces in production also set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` so `next build` uploads source maps via `withSentryConfig`.
   - Without any DSN the SDK is a true no-op — safe to deploy without setting these.
3. **Verify `CRON_SECRET` and Vercel KV.**
   - Confirm the Vercel cron schedule for `/api/cron/review-invites` is configured and that `CRON_SECRET` matches between the cron job's `Authorization: Bearer …` header and the runtime env.
   - Confirm `KV_REST_API_URL` / `KV_REST_API_TOKEN` are populated. Without KV, the rate limiter falls back to per-Lambda-instance memory and the limits are effectively absent under autoscaling.
4. **Smoke-test admin login + adding a car.**
   - Log in at `/admin/login`. If this is the first deploy, seed the first admin via `npm run setup-admin` (uses `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
   - Enrol 2FA when prompted; scan the QR with an authenticator app and confirm a TOTP code.
   - Add a car: fill the form, upload an image (10 MB cap, JPEG/PNG/WebP/AVIF), save.
   - Confirm the car appears on `/BrowseFleet` and that the uploaded image renders (proves S3 + `remotePatterns` are wired).
   - `ADMIN_GUIDE.md` walks each step with field-by-field detail.
5. **Walk the customer booking flow.**
   - `/BrowseFleet` → pick a car → car detail → Reserve.
   - From the home page, also walk the service booking flow at `/Book` end-to-end for the detailing path (5 steps + success).
   - Confirm the customer receives the booking confirmation email (Nodemailer SMTP transport).
6. **Confirm the first deploy emits Sentry events.**
   - Trigger a known error path (e.g. unauthenticated POST to an admin endpoint).
   - Confirm the captured exception appears in your Sentry project within a minute or two.
   - If nothing appears: check `SENTRY_DSN` is set in the deployment environment (not just at build time), and that the `next build` log mentioned `withSentryConfig` — that line only appears when the build detected a DSN.
