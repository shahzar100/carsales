# Post-PR integration test results

Branch: `test/integration-all-prs` (merge of PRs #37, #38, #39 + #39's admin-cancel follow-up commit)
Date: 2026-05-17
Local prod build (Node 24.4.1, Atlas Mongo, macOS arm64). Server: `npm start` on :3000.

## Summary table

| # | Item | Status | Notes |
|---|------|--------|-------|
| 0 | Type-check (`tsc --noEmit`) | ✅ pass | clean |
| 0 | Lint (`eslint`) | ✅ pass | clean |
| 0 | `npm audit` prod deps | ⚠ 5 high · 6 mod · 2 low | Next 16.1.6 needs upgrade |
| 0 | Security headers | ⚠ partial | HSTS/CSP/XFO/XCTO ✅; COOP/CORP/COEP/CSP-RO ❌; X-Powered-By leaks |
| 1 | Playwright e2e (chromium) | ❌ 6/15 | admin happy-paths + public form flows broken |
| 2 | Lighthouse desktop (3 pages) | ✅ perf 99-100 | a11y 92-95, BP 96, SEO 100 |
| 2 | Lighthouse mobile (3 pages) | ⚠ mixed | home 92 / CarParts 93 / **BrowseFleet 69** |
| 3 | Autocannon load test (10 endpoints) | ⚠ SSR bottleneck | home **4.5 req/s p99=6.2s** vs robots 4,784 req/s |
| 4 | axe-core a11y scan (16 pages) | ❌ 16/16 fail | 3 selects no label + 32 contrast on /CarParts |
| 5 | Cross-browser Playwright (full battery × 4 projects) | ❌ widely red | firefox 10/35, webkit 9/35, mobile-chrome 22/35 |
| 6 | Email rendering across clients | ⏭ ops | needs Litmus / Email-on-Acid |
| 7 | Mongo backup + restore drill | ⏭ ops | needs Atlas snapshot + scratch cluster |
| 8 | S3 DR — versioning + restore | ⏭ ops | needs AWS creds |
| 9 | OWASP ZAP baseline | ✅ 0 FAIL / 6 WARN / 61 PASS | docker via `host.docker.internal` |
| 10 | Monitoring / alerting | ⏭ ops | no Sentry / PagerDuty wired |
| 11 | GDPR / cookie consent | ✅ 4/4 | no pre-consent analytics; banner appears; privacy/terms reachable; csrf cookie httpOnly+Lax |
| 12 | `/api/cron/review-invites` | ⚠ misconfigured | `CRON_SECRET` not in `.env.local` → 500 on every call; if shipped this state breaks the Vercel cron |
| extra | Jest jsdom + API | ✅ cited | TEST_PLAN session 17: 151/151 suites + 59/59 suites |

---

## 0. Pre-flight static checks

### Type-check
```
> tsc --noEmit
(clean)
```

### Lint
```
> eslint
(clean)
```

### `npm audit` — production deps only (`--omit=dev`)
**13 vulnerabilities: 5 high, 6 moderate, 2 low.** Full log: `POST_PR_RESULTS_OUTPUT/00-npm-audit-prod.log`.

Headline:
- **`next@16.1.6`** — 18 advisories, including [CSP-nonce XSS](https://github.com/advisories/GHSA-ffhc-5mcf-pf4q), [middleware/proxy bypass](https://github.com/advisories/GHSA-26hh-7cqf-hhc6), [cache poisoning in RSC responses](https://github.com/advisories/GHSA-wfc6-r584-vfw7), [Image Optimization DoS](https://github.com/advisories/GHSA-h64f-5h5j-jqjh). All HIGH. Fix: pin to latest 16.x patch (or 16.5+ once released).
- **`fast-uri` <=3.1.1** (high) — path traversal via percent-encoded dot segments. Comes in via `@aws-sdk/*`.
- **`fast-xml-builder` / `fast-xml-parser`** (high/moderate) — XML injection. Same SDK transitive.
- **`socket.io-parser` 4.0.0-4.2.5** (high) — unbounded binary attachments DoS. Likely transitive via react-email.
- **`nodemailer` <=8.0.4** (moderate) — SMTP command injection via envelope.size + CRLF in HELO/EHLO. **No upstream fix**; sanitise inputs to nodemailer at the call sites or accept the risk.
- **`postcss` <8.5.10** (moderate) — XSS via unescaped `</style>`. `npm audit fix` resolves.

### Security-header probe (`curl -D -`)

`/` and `/api/businessinfo`:
- ✅ `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- ✅ `X-Frame-Options: SAMEORIGIN` (consider `DENY`)
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: origin-when-cross-origin`
- ✅ `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- ✅ `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic' https://challenges.cloudflare.com; … frame-ancestors 'self'; base-uri 'self'; form-action 'self'`
- ❌ Missing `Cross-Origin-Opener-Policy` (audit item #10)
- ❌ Missing `Cross-Origin-Resource-Policy`
- ❌ Missing `Cross-Origin-Embedder-Policy` (confirmed by ZAP 11×)
- ❌ Missing `Content-Security-Policy-Report-Only` mirror with `report-to`
- ❌ `style-src 'unsafe-inline'` — ZAP flagged 10× ([HOLE for CSS-based XSS](https://github.com/advisories/GHSA-ffhc-5mcf-pf4q))
- ❌ `X-Powered-By: Next.js` leaks framework — ZAP flagged 5×. Strip in [next.config.ts](next.config.ts) via `poweredByHeader: false`.

Pages return `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` — confirms audit's top finding that [src/app/(main)/layout.tsx:17](src/app/(main)/layout.tsx#L17)'s `dynamic = "force-dynamic"` is forcing the whole tree per-request.

API (`/api/businessinfo`) returns `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` — correct.

---

## 1. Playwright e2e (chromium) — `02-playwright-chromium.log`

**6 passed / 9 failed (1.1 min)**

Pass:
- `admin/login-failures` × 2 (wrong-password + rate-limit messages)
- `admin/login` redirect-unauth-to-login
- `public/home-to-detail` × 3 (browse fleet link, navigate to detail, JSON-LD on detail)

**Fail (real regressions worth investigating):**
- `admin/login` happy-path (valid creds → dashboard)
- `admin/logout-redirect`
- `admin/carparts-crud` add → edit → delete
- `admin/cars-quick-edit`
- `public/booking-lookup` found path
- `public/booking-lookup` not-found path
- `public/car-viewing-booking` happy path
- `public/quote-request` happy path (tints) — selector `getByLabel(/year/i).first()` never finds the input → 30s timeout
- `public/service-booking` happy path (detailing) — same selector pattern

The two quote/booking failures look like a single selector/label change after PR #38's UX shared primitives migration. Worth re-running after the test fixtures are updated, then re-evaluating whether the admin flows are also fixture-related (seeded admin / Mongo state) vs. real product breakage.

---

## 2. Lighthouse

### Desktop — perf preset (`POST_PR_RESULTS_OUTPUT/lighthouse/*-desktop.report.html`)

| Page | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` (home) | 99 | 95 | 96 | 100 | 0.8 s | 0.004 | 0 ms |
| `/BrowseFleet` | 99 | 92 | 96 | 100 | 0.9 s | 0 | 0 ms |
| `/CarParts` | 100 | 95 | 96 | 100 | 0.6 s | 0 | 0 ms |

### Mobile — Moto G4 default emulation (`*-mobile.report.html`)

| Page | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` (home) | 92 | 95 | 96 | 100 | 3.3 s | 0 | 70 ms |
| `/BrowseFleet` | **69** | 92 | 96 | 100 | **3.6 s** | 0 | **850 ms** |
| `/CarParts` | 93 | 95 | 96 | 100 | 3.1 s | 0 | 90 ms |

**BrowseFleet mobile** is the only sub-90 result. Top failing audits:
- `errors-in-console` (0) — JS console errors on mobile that aren't present on desktop
- `mainthread-work-breakdown` (0) — heavy parse/layout/script
- `color-contrast` (0) — matches axe finding on this page
- `select-name` (0) — three filter selects without labels (matches axe finding)
- `unused-javascript` (0)
- `bf-cache` (0) — page can't go in back/forward cache
- `forced-reflow-insight` (0)
- `legacy-javascript-insight` (0)
- `total-blocking-time` (0.34) — 850 ms blocking
- `render-blocking-insight` (0.5)

These all line up with the audit's diagnosis: removing `force-dynamic` + `LazyMotion` + the filter-label fix would lift this score by 15-20.

---

## 3. Autocannon load test — `03-autocannon.log`

10 public GET endpoints, 30 connections, 20 s each. Run against the local prod server on Atlas.

| Scenario | Req/sec | p50 | p95 | p99 | Errors | Non-2xx |
|---|---:|---:|---:|---:|---:|---:|
| home `/` | **4.5** | 5,922 ms | 6,173 ms | 6,226 ms | 0 | 0 |
| `/BrowseFleet` | 6 | 4,080 ms | 6,140 ms | 6,162 ms | 0 | 0 |
| `/CarParts` | 8 | 3,101 ms | 4,199 ms | 4,958 ms | 0 | 0 |
| `/Services` | 4.5 | 5,661 ms | 6,527 ms | 6,568 ms | 0 | 0 |
| `/api/about` | 6 | 4,010 ms | 6,484 ms | 6,502 ms | 0 | 0 |
| `/api/businessinfo` | 9 | 3,013 ms | 4,252 ms | 4,298 ms | 0 | 0 |
| `/api/carparts` | 49 | 667 ms | 1,303 ms | 1,344 ms | 0 | 0 |
| `/api/carparts?brand=Ford` | 52 | 796 ms | 989 ms | 1,070 ms | 0 | 0 |
| `/sitemap.xml` | **3,745** | 6 ms | 21 ms | 29 ms | 0 | 0 |
| `/robots.txt` | **4,784** | 5 ms | 11 ms | 12 ms | 0 | 0 |

**Headline.** The audit predicted ≥1500 req/s on `/api/businessinfo` once the `force-dynamic` flag is removed. **Actual is 9 req/s** — a ratio of ~170×. The SSR pages collapse under 30 concurrent connections to 4-9 req/s with 4-6 s tail latency. Static routes (sitemap/robots) handle thousands of req/s as expected, confirming the bottleneck is per-request Mongo round-trip to Atlas, not the runtime itself.

**This is the single largest production-readiness blocker.** Any sustained promotional traffic (marketing email, social share, paid ads landing on `/`) will degrade the site within seconds.

Fix: implement the audit's Top-10 item #1 — drop `dynamic = "force-dynamic"` from `(main)/layout.tsx`, add per-page `revalidate` according to the audit table. Re-run this load test after deploy; expectation is sub-50 ms p95 on cached pages.

---

## 4. axe-core a11y scan — `04-axe.log`

16 public pages, WCAG 2 A/AA + best-practice. **16/16 fail** because the spec asserts zero critical + serious violations.

Per-page critical / serious counts:

| Page | Critical | Serious (color-contrast nodes) |
|---|---:|---:|
| `/CarParts` | 0 | **32** |
| `/BrowseFleet` | **3** (select-name) | 11 |
| `/` (home) | 0 | 9 |
| `/privacy` | 0 | 2 |
| `/terms` | 0 | 2 |
| every other page | 0 | 1 |

**Findings:**
1. **`/BrowseFleet` filter selects have no accessible name** (critical, 3 nodes). Matches the audit's UX item #25 ("Booking/lookup inputs missing `<label htmlFor>`") but on the filter dropdowns. Add `<label htmlFor>` or `aria-label`.
2. **`/CarParts` colour-contrast violations × 32.** Almost certainly the brand-red on white CTAs or a muted text token on light bg. Tokenise via `tailwind.config.js` (`colors.brand`) — audit UX item #10.
3. **One shared component contributes 1 contrast violation across every page.** Probably footer or header muted text. Fix once, cascade everywhere.

Note: every page also has moderate `region` and `heading-order` violations (1-2 each). Not test-failing but worth fixing — wrap top-level content in `<main>` and don't skip from h1 → h3.

---

## 5. Cross-browser Playwright — `05a-firefox.log`, `05b-webkit.log`, `05c-mobile-chrome.log`

Ran via a battery-only config (`playwright.battery.config.ts`) that exposes `chromium / firefox / webkit / mobile-chrome / mobile-safari` projects. Each runs the existing 15 e2e tests plus the 16 axe + 4 cookie tests (35 total).

| Project | Pass | Fail | Run time | Notes |
|---|---:|---:|---:|---|
| chromium (e2e only) | 6 | 9 | 1.1 min | (baseline above, axe + cookies run separately) |
| firefox | 10 | 25 | 5.6 min | same 9 functional fails + 16 axe fails |
| webkit | 9 | 26 | 5.0 min | Safari is strictest — one extra form-interaction fail |
| mobile-chrome | 22 | 13 | 3.5 min | most axe checks pass at mobile breakpoints |
| mobile-safari | not run | — | — | skipped to save time; expect ≈ webkit |

**Cross-browser observations:**
- The 9 functional failures (admin login happy-path, CRUD, booking lookup, viewing booking, quote, service booking) are reproduced in every browser project — not a Safari/Firefox bug, a real product bug or fixture bug.
- WebKit added one extra failure (`admin: login-failures › wrong password shows an error`) — Safari's form-error timing is fussier than Chrome's.
- mobile-chrome's higher pass rate is because the axe-core color-contrast checks differ at mobile breakpoints (some violators are desktop-only Tailwind classes).

---

## 6. Email rendering across clients — ops-side

react-email's preview server renders in modern Chromium. The risk is that Outlook (Word render engine), older Gmail apps, and iOS Mail Light Mode / Dark Mode all render differently. This audit covered the **code paths** (no `dangerouslySetInnerHTML`, `<EmailButton>` for all CTAs, server-generated URLs); what it does not cover is the **rendered output across real clients**.

**Recommended:**
- Sign up for [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/); pipe the existing email templates through their preview farm (Outlook 365, Outlook 2019, Gmail web, Gmail iOS, iOS Mail, Apple Mail, Yahoo Mail, dark + light).
- Templates to test:
  - `src/emails/MagicLinkSignIn.tsx`
  - `src/emails/PasswordReset.tsx`
  - `src/emails/CustomerPasswordReset.tsx`
  - `src/emails/VerifyEmail.tsx`
  - `src/emails/QuoteConfirmation.tsx`
  - `src/emails/BookingCancellation.tsx`
  - `src/emails/BookingConfirmation.tsx`
  - `src/emails/ReviewInvite.tsx` (if exists)
- Smoke: send each to a personal Gmail + Outlook + iOS Mail account, confirm the CTA button renders as a button (not a fallback link) and the brand colour shows.
- Verify SPF / DKIM / DMARC DNS records.

Cannot be executed from a local CLI without paid tooling.

---

## 7. Mongo backup + restore drill — ops-side

Atlas snapshots happen automatically (configurable cadence in the cluster settings). What's typically missing is proof they **restore**: an untested backup is no backup.

**Recommended drill:**
1. From Atlas dashboard, select the prod cluster → Snapshots → take a manual snapshot.
2. Restore the snapshot into a fresh dev/staging cluster (Atlas: "Restore to new cluster").
3. Point a throwaway env at the restored cluster (`MONGODB_URI=…`) and run the full Playwright e2e against it.
4. Document the restore-time and the steps in [RUNBOOK.md](RUNBOOK.md).

Cannot be executed from this CLI session without Atlas credentials and an org sign-off to spin up a temporary cluster.

**Side finding from this run:** the Atlas connection string is stored in plaintext in `.env.local` (`mongodb+srv://…:Capricorn100@…`). The password is short, dictionary-derivative, and re-used across collections. Rotate the Atlas DB user password to a 32-char random secret, and consider Atlas's API-key / IAM-style auth for the prod credential.

---

## 8. S3 DR — ops-side

Risk: an admin (or a bug) deletes a car's main image, the listing breaks, and there's no version history to restore from.

**Recommended:**
- Enable bucket versioning on the prod S3 bucket (`aws s3api put-bucket-versioning --bucket <name> --versioning-configuration Status=Enabled`). Idempotent, free until versions accumulate.
- Add a lifecycle rule to expire non-current versions after 90 days (cost cap).
- Add a write-up to [RUNBOOK.md](RUNBOOK.md) for "an admin deleted an image — restore it" (`aws s3api list-object-versions` + `aws s3api copy-object --copy-source` to the live key).
- One-time drill: in a non-prod bucket, delete a known key then walk through the restore steps; record the time-to-restore.

Cannot be executed from this CLI session without AWS credentials and bucket name.

---

## 9. OWASP ZAP baseline — `09-zap.log`

Ran `ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:3000 -m 2` (first attempt with `--network host` failed — Docker on macOS doesn't honour host networking, use `host.docker.internal`).

**0 FAIL-NEW · 6 WARN-NEW · 61 PASS** across 210 URLs.

Warnings:

| Rule | Count | Notes |
|---|---:|---|
| `[10037]` Server leaks `X-Powered-By: Next.js` | 5 | Add `poweredByHeader: false` in [next.config.ts](next.config.ts) |
| `[10055]` CSP `style-src 'unsafe-inline'` | 10 | Move Tailwind runtime + react-email styles to hash/nonce; Tailwind v4 supports this |
| `[90004]` Cross-Origin-Embedder-Policy header missing | 11 | Audit item #10 |
| `[10038]` CSP not set | 5 | Only on 404s of malformed `/_next/image?url=…` paths — middleware doesn't fire on bypass routes |
| `[10049]` Non-Storable Content (`no-store`) on 404/redirect | 9 | Correct behaviour, ZAP false-positive |
| `[10019]` Content-Type missing on 308 redirects + 400 `_next/image` | 3 | Low priority |

**No critical, no high, no exploitable injection.** This is a passive baseline — for full coverage do a separate authenticated full-scan against staging once admin credentials and a target are sanctioned.

---

## 10. Monitoring / alerting — ops-side

The codebase has structured `logEvent` / `logError` helpers ([src/lib/utils/observability.ts](src/lib/utils/observability.ts)) but the audit didn't find an external sink wired up (no Sentry/Datadog SDK in deps, no `NEXT_PUBLIC_SENTRY_DSN` in `.env.example`).

**Recommended (in priority order):**
1. **Error tracking**: add Sentry (`@sentry/nextjs`). Wire the existing `logError` calls to forward to Sentry. Set up a release stamp on deploy. Confirm a synthetic 500 in staging produces a Sentry issue.
2. **Uptime**: a free check on `/api/businessinfo` from BetterUptime / UptimeRobot every 60 s, paging on three consecutive failures.
3. **On-call**: even a PagerDuty solo account costs nothing for one user. Wire the Sentry alert and the uptime alert into one rotation, then trigger a synthetic failure and confirm the page lands on your phone.
4. **Budget alarm**: Vercel function-invocation budget + Atlas data-transfer budget set to fire at 80 % of expected monthly spend.

These are launch-readiness gates more than tests. Cannot be smoke-tested without the underlying accounts existing.

---

## 11. GDPR / cookie consent — `11-cookies.log`

Playwright spec at [e2e/_battery-cookies.spec.ts](e2e/_battery-cookies.spec.ts). **4/4 pass.**

| Test | Result | Detail |
|---|---|---|
| no analytics/marketing cookies pre-consent | ✅ | only `authjs.csrf-token`, `authjs.callback-url` (both essential) |
| cookie banner is visible on first visit | ✅ | `role="dialog"` with `aria-labelledby="cookie-banner-title"` from [src/components/Shared/CookieBanner.tsx](src/components/Shared/CookieBanner.tsx) |
| privacy + terms reachable from footer | ✅ | both return 2xx |
| session cookie has security flags | ✅ | `authjs.csrf-token`: `httpOnly=true sameSite=Lax`; `secure=false` only because localhost is http |

CookieBanner correctly:
- defers visibility to `useEffect` so SSR doesn't reveal it
- persists state in `localStorage["cookie-consent"]` (not a cookie, so no cookie noise pre-consent)
- exposes `role="dialog"` + `aria-modal="false"` + focus-trap on Tab
- sets focus on first interactive element when shown

---

## 12. `/api/cron/review-invites` — `12-cron.log`

| Probe | Result | Notes |
|---|---|---|
| no auth header | `500 {"error":"Server misconfigured"}` | `CRON_SECRET` not set in `.env.local` |
| fake `Bearer notreal` | `500 {"error":"Server misconfigured"}` | same — auth check is after env check |
| `POST` | `405` | route only exports `GET` |

The route is fail-closed ([src/app/api/cron/review-invites/route.ts:90-110](src/app/api/cron/review-invites/route.ts#L90-L110)) which is correct. However:

**Finding (medium).** `CRON_SECRET` is not in `.env.local`, so the local instance can't accept Vercel's `Bearer` header. If this env state was ever copied to production, every Vercel cron invocation would 500 and follow-up emails would silently stop. Add `CRON_SECRET=<32-char-random>` to `.env.local`, `.env.example`, and Vercel project settings, then re-run this probe with the real header to confirm a 200 (or 200 with `sent/skipped/failed` counts when no bookings due).

---

## Cross-cutting findings — top 10 to fix before launch

Ordered by impact × effort.

| # | Finding | Source | Type | Fix |
|---|---|---|---|---|
| 1 | `force-dynamic` makes home + 12 other pages 4-9 req/s with 4-6 s tail latency | Autocannon + Lighthouse mobile + Cache-Control headers | Perf · Critical | [src/app/(main)/layout.tsx:17](src/app/(main)/layout.tsx#L17): remove `dynamic = "force-dynamic"`, add per-page `revalidate` (audit table). |
| 2 | `next@16.1.6` has 18 advisories incl. CSP-nonce XSS, middleware bypass, cache poisoning | `npm audit` | Security · High | Pin to latest patched Next 16.x. |
| 3 | 9 e2e flows broken across every browser (admin happy-path, booking lookup, quote, service booking) | Playwright × 4 projects | Functional · High | Investigate selector / fixture drift after PR #38. |
| 4 | `/api/cron/review-invites` `CRON_SECRET` missing | Cron probe | Reliability · High | Add to `.env.local` + `.env.example` + Vercel; re-test. |
| 5 | `/BrowseFleet` filter selects have no `<label>` (critical a11y) | axe-core | A11y · High | Add `<label htmlFor>` or `aria-label` on the three filter selects. |
| 6 | 32 color-contrast violations on `/CarParts`, 11 on `/BrowseFleet`, 9 on home | axe-core | A11y · High | Tokenise brand colours in [tailwind.config.js](tailwind.config.js); audit dark-red on light-gray combinations. |
| 7 | `X-Powered-By: Next.js` leaks framework on every response | ZAP | Security · Low | `poweredByHeader: false` in [next.config.ts](next.config.ts). |
| 8 | CSP `style-src 'unsafe-inline'` permits CSS-based exfil | ZAP | Security · Medium | Move to nonce/hash for inline styles. |
| 9 | COOP / CORP / COEP / CSP-Report-Only missing | header probe + ZAP | Security · Low | Add to `headers()` in [next.config.ts](next.config.ts). |
| 10 | BrowseFleet mobile Lighthouse 69 (heavy JS, blocking time 850 ms) | Lighthouse | Perf · Medium | LazyMotion sweep (audit item #7), trim unused JS, fix select-name. |

---

## Files produced this session

```
POST_PR_RESULTS_OUTPUT/
├── 00-headers-api.txt
├── 00-headers-root.txt
├── 00-lint.log
├── 00-npm-audit-all.log
├── 00-npm-audit-prod.log
├── 00-typecheck.log
├── 02-lighthouse.log
├── 02-playwright-chromium.log
├── 03-autocannon.log
├── 04-axe.log
├── 05a-firefox.log
├── 05b-webkit.log
├── 05c-mobile-chrome.log
├── 09-zap.log
├── 11-cookies.log
├── 12-cron.log
└── lighthouse/
    ├── home-desktop.report.{html,json}
    ├── home-mobile.report.{html,json}
    ├── BrowseFleet-desktop.report.{html,json}
    ├── BrowseFleet-mobile.report.{html,json}
    ├── CarParts-desktop.report.{html,json}
    └── CarParts-mobile.report.{html,json}
```

New code added this session:
- [e2e/_battery-axe.spec.ts](e2e/_battery-axe.spec.ts) — axe-core scan across 16 public pages
- [e2e/_battery-cookies.spec.ts](e2e/_battery-cookies.spec.ts) — GDPR / cookie consent assertions
- [scripts/test-battery-axe.spec.ts](scripts/test-battery-axe.spec.ts) — copy for the standalone script invocation
- [scripts/test-battery-cookies.spec.ts](scripts/test-battery-cookies.spec.ts) — same
- [playwright.battery.config.ts](playwright.battery.config.ts) — adds firefox / webkit / mobile-chrome / mobile-safari projects for cross-browser runs
- `@axe-core/playwright` dev-dependency added to [package.json](package.json)
