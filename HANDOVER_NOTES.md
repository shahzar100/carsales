# Handover Notes — Carsales

This document captures everything the next developer needs to pick this site up cleanly: how to build and run it, what was removed during handover prep, what's known-broken or unfinished, and the deep architecture decisions that aren't obvious from the file tree.

Audit docs in the repo (`WEBSITE_REVIEW.md`, `CODEBASE_ISSUES.md`, `DAY_PLAN.md`, `AUDIT_REPORT.md`, `TEST_AUDIT_SUMMARY.md`) describe the journey to this point. Many findings in those documents are already resolved in the current source — see "Status of older audit findings" below for the mapping.

---

## 1. Build & run

**Node:** 22.x (declared in `package.json` engines).

```bash
# install
npm ci

# dev server
npm run dev          # http://localhost:3000

# production build
npm run build && npm start

# CI checks
npm run lint
npm run type-check
npm test             # jest (jsdom + api in-memory mongo)
npm run test:e2e     # playwright (needs `npx playwright install` once)
```

**Required env vars** for any build that prerenders content from the DB:

| Var | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | `mongodb://…` or `mongodb+srv://…`, must include the `MMC` database in the path |
| `SESSION_SECRET` | prod | min 32 chars; iron-session (admin) signing key |
| `AUTH_SECRET` | prod | NextAuth/Auth.js (customer) JWT signing key |
| `EMAIL_FROM` | prod | must not be `noreply@yourdomain.com` |
| `CRON_SECRET` | prod | Vercel cron auth bearer |
| `AWS_*` + `S3_BUCKET_NAME` | for uploads | admin image upload to S3 |
| `AUTH_GOOGLE_ID/SECRET` | optional | enables the Google sign-in button |
| `KV_REST_API_URL/TOKEN` | recommended in prod | Vercel KV — without these, rate limiters fall back to per-instance memory |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | optional | Cloudflare Turnstile bot protection on forms |

Server-side validation lives in `src/lib/env.ts` (Zod). Production boot will throw with a clear error if any required value is missing. `.env.example` documents every variable.

**Admin bootstrap.** Run `npm run setup-admin` after a fresh deploy to seed the first admin from `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The script lives at `scripts/setup-admin.mjs`.

---

## 2. What was removed during handover prep

### Finance calculator + finance offering
**Why:** Out of scope. The site no longer markets or offers vehicle finance.

Removed:
- `src/components/Car/FinanceCalculator.tsx` (deleted)
- `__tests__/components/Car/FinanceCalculator.test.tsx` (deleted)
- `<FinanceCalculator />` render block in `src/components/Car/CarDetailView.tsx` (lines ~828–854 of the old file)
- "Do you offer finance?" Q&A in `src/app/(main)/FAQ/page.tsx`
- "while you arrange finance or…" copy in `src/components/Car/ReserveCarForm.tsx` (line 126)
- Stub mock in `__tests__/components/Car/CarDetailView.test.tsx`

**Kept on purpose:** `PartExchangeForm`'s `"Modifications, damage, outstanding finance, etc."` placeholder — that refers to whether the customer's *trade-in vehicle* has finance owed on it, not to us offering finance. Stays.

### Accident Claims landing page
**Why:** Out of scope. Insurance claims management was a marketing-only page with no transactional flow.

Removed:
- `src/app/(main)/AccidentClaims/` (entire folder, 17KB page deleted)
- "Accident Claims" nav entry in `src/components/Header.tsx`
- "Accident Claims" link block in `src/components/Footer.tsx`
- `/AccidentClaims` entry in `src/app/sitemap.ts`
- "Accident Claims" FAQ section in `src/app/(main)/FAQ/page.tsx` (and corresponding `Shield` import)
- Contact-page hero copy "discuss an accident claim" and the "Accident Claims" quick-link card in `src/app/(main)/contact/page.tsx`
- Section 5 "Accident Claims" in `src/app/(main)/terms/page.tsx` (sections 6→11 renumbered down by one)
- Privacy-policy references in `src/app/(main)/privacy/page.tsx` (vehicle information, data use, insurance-company sharing)

---

## 3. Status of older audit findings

The repo carries several audit documents (`WEBSITE_REVIEW.md`, `CODEBASE_ISSUES.md`, `DAY_PLAN.md`). Many of their findings have already been fixed in the current source. Spot-check before re-spending time on them:

| Audit claim | Actual current status |
|---|---|
| `npm run build` fails — missing `useSkeleton` hook | **Fixed** — `PackageGridWrapper.tsx` no longer exists; build compiles cleanly through TS. Page prerender still requires a reachable `MONGODB_URI`. |
| `/review?ref=…` page missing | **Fixed** — page exists at `src/app/(main)/review/page.tsx` |
| `/admin/reset-password?token=…` page missing | **Fixed** — page exists at `src/app/(admin)/admin/reset-password/page.tsx` |
| 8x `' 2.tsx'` duplicate files with content drift | **Fixed** — none present (`find src -name '* 2.tsx'` returns nothing) |
| `SearchContext` is dead code | **Fixed** — file no longer exists |
| Header nav `/BrowseFleet/Toyota` 404s | **Fixed** — nav uses `?make=Toyota` query params (`src/components/Header.tsx:61-64`) |
| Privilege escalation in admin password reset (`CODEBASE_ISSUES A1`) | **Fixed** — `src/app/api/admin/users/password/route.ts:54` checks `hasMinimumRole("admin")` |
| Plaintext passwords in HTTP responses | **Fixed** — reset flow uses a hashed token emailed to the user; the response body returns `{ success, emailSent }` only |
| NoSQL operator injection on admin login (`A5`) | **Fixed** — `src/app/api/admin/login/route.ts:62-72` type-guards `username`/`password` to strings before reaching Mongo |
| Rate limiter resets on successful login (`A6`) | **Fixed** — explicit comment at `src/app/api/admin/login/route.ts:136-138` documents the deliberate non-reset |
| Logout session destroy not awaited (`A4`) | **Fixed** — `src/app/api/admin/logout/route.ts:11` awaits `session.destroy()` |
| Hardcoded SESSION_SECRET fallback | **Fixed (Fix 12.3)** — fallback is a per-process `crypto.randomBytes` value now, not a source-readable literal |
| Skip-to-content link missing | **Fixed** — `src/app/(main)/layout.tsx:32-37` |
| Save/Share touch targets <44×44 | **Fixed** — buttons are `h-11 w-11` in `CarDetailView.tsx:260,274` |
| ESLint config broken (`@eslint/eslintrc` missing) | **Fixed** — `npm run lint` runs clean (one anonymous-default-export warning in `scripts/load-test/k6.js`) |
| `npm run type-check` 100+ errors | **Fixed** — type-check is clean once `npm ci` has been run |

Treat the older audit files as historical context, not a current to-do list. When in doubt, search the source.

---

## 4. Known issues left for the next developer

### Vulnerable dependencies (cannot fix from userland yet)

`npm audit` reports 7 advisories after `npm audit fix`. `--force` would downgrade Next.js to `9.3.3`, which is a non-starter. All remaining items need upstream patch releases:

- **Next.js 16.2.6** — 13 advisories (DoS via Server Components, XSS in CSP nonces, XSS in beforeInteractive scripts, Image-Optimization DoS, SSRF via WebSocket upgrades, segment-prefetch + dynamic-route-param middleware bypass, cache poisoning of RSC responses, etc.). Watch the Next.js release notes and bump as patched versions land.
- **`nodemailer@7.0.13`** — SMTP command injection via unquoted `envelope.size` and CRLF in transport name. No fix currently available; review again next release cycle.
- **`postcss <8.5.10`** (transitive via `@react-email/preview-server`, dev-only) — XSS via unescaped `</style>` in CSS stringify. Will be fixed by upgrading `@react-email/preview-server` once that releases.
- **`ws@8.0.0-8.20.0`** — uninitialised memory disclosure. Transitive.

### Component refactors deferred

Three components are large and would benefit from breaking up, but each is high-risk for regressions right before handover and **was deliberately left alone**:

- `src/components/Booking/Flow/BookingFlow.tsx` (~1158 lines) — state machine across 6+ service types
- `src/components/Admin/Tabs/BusinessInfoForm.tsx` (~1143 lines) — split by section (shop / detailing / tinting / recovery / hours)
- `src/components/Header.tsx` (~1009 lines) — extract mobile menu + search sheet

Suggested next-quarter work, with the canonical example of the "server component + client island" pattern in `src/app/(admin)/admin/dashboard/viewing/page.tsx` + `src/components/Admin/ViewingBookingsClient.tsx`. There's also an explicit TODO at the top of `src/app/(admin)/admin/dashboard/shop/page.tsx` requesting that exact refactor.

### Accessibility — partial

Skip-to-content link, focus rings, image alt text, form labels, ARIA roles on the gallery, and keyboard navigation in the gallery are all in place. What's *not* fully covered:

- ~170 `cursor-pointer` + `onClick` sites on non-button elements (mostly in admin tables and some marketing components) still lack `onKeyDown` handlers. Hit the top 10–15 visible ones during this prep pass (header dropdown menus, FAQ accordion, cookie banner, share modal, etc.); the long tail remains.
- `RangeInput.tsx` min/max inputs could use explicit `aria-label`s.
- Some custom selection-card components could expose `role="radio"` more explicitly.

### Observability

`src/lib/utils/observability.ts` is a Sentry stub — `logError` / `logEvent` just write to `console.error` / `console.log`. To wire up Sentry:
1. `npm i @sentry/nextjs`
2. Add `SENTRY_DSN` to env
3. Replace the stub functions with `Sentry.captureException` and `Sentry.captureMessage`
4. The setup docs are sketched in `SETUP.md`

### Testing

- Component tests pass under `npm test` once `npm ci` has been run.
- Coverage is **~22.89%** (target 80%). The 3 critical auth flows and the booking race-conditions are covered; the long tail of admin tables and marketing components isn't.
- E2E (`npm run test:e2e`) needs `npx playwright install` first to download the browser binaries.

### Rate limiting

`createRateLimiter` in `src/lib/utils/rateLimit.ts` uses Vercel KV when `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set, and per-instance memory otherwise. Production deployments **must** configure KV — without it, the rate limit is per-Lambda-warm-instance, which is effectively no rate limit under autoscaling.

---

## 5. Architecture notes

### Tech stack
Next.js 16 (Turbopack, App Router) · React 19 · TypeScript strict · Tailwind 4 · MongoDB (native driver) · iron-session (admin) · NextAuth v5 (customer) · React Email + Nodemailer · AWS S3 (presigned uploads) · Motion (Framer-style animations) · Zod (validation).

### Auth — two parallel systems

This is the most counter-intuitive part of the codebase:

- **Customer auth → NextAuth v5 (Auth.js).** JWT strategy, MongoDB adapter, credentials + magic-link + Google OAuth providers. Configured in `src/auth.ts`. Endpoints: `/api/auth/[...nextauth]`. Cookies: standard NextAuth names.
- **Admin auth → iron-session.** Independent system. Configured in `src/lib/utils/auth.ts`. Endpoints: `/api/admin/login`, `/api/admin/logout`, `/api/admin/session`. Cookie: `carsales_admin_session`, httpOnly, sameSite=lax, 24h expiry.

Role hierarchy on the admin side: `staff (1) < manager (2) < admin (3)`. Use `hasMinimumRole(role)` from `src/lib/utils/auth.ts` for authorization. **Never** reuse `isAuthenticated()` alone for privileged endpoints — that lets a `staff` account act with `admin` permissions. See the existing fix at `src/app/api/admin/users/password/route.ts:54` for the pattern.

### MongoDB collections (15)
`cars`, `carViewingBookings`, `serviceAppointments`, `reservations`, `partExchanges`, `quotes`, `carParts`, `businessInfo`, `detailingPackages`, `tintOptions`, `serviceOverviews`, `recoveryInfo`, `adminUsers`, `users` (NextAuth), `auditLogs`. Interfaces in `src/lib/interfaces.ts`, collection accessors in `src/lib/models.ts`.

### S3 image upload
`POST /api/admin/upload` returns a presigned PUT URL bounded by content-type (`image/jpeg|png|webp|avif`) and a 10 MB cap; the client uploads directly to S3. The S3 host (and optional CloudFront fronting host) must be in `next.config.ts:remotePatterns` for `<Image>` to render them.

### CSP nonce
`src/proxy.ts` generates a per-request nonce and writes `Content-Security-Policy` headers with `'nonce-…' 'strict-dynamic'`. There's a `script-src` enforce + a `style-src 'self'` report-only mirror that posts violations to `/api/csp-report`. `style-src: 'unsafe-inline'` is currently in the enforce policy because Motion and `@next/font` inject inline styles — we're measuring with report-only to see if it can be tightened.

### Caching strategy
Per-page ISR via `export const revalidate = N` rather than `force-dynamic` at the layout level. Marketing pages range from 60s (browse) to 86400s (privacy/terms). On-demand `revalidatePath()` is called from admin mutations (`src/app/api/admin/cars/route.ts` etc.) so admins see their changes immediately. **Do not** put `force-dynamic` back into `src/app/(main)/layout.tsx` — it was removed deliberately and the comment block at the top of that file explains why (it collapsed throughput to single-digit req/s under load).

### Background work
Vercel cron at `/api/cron/review-invites` fires daily, sends review-invite emails for completed service appointments. Authenticated by `CRON_SECRET` bearer.

### Email
React Email templates in `src/emails/`. Transport via `src/emails/send.ts` (Nodemailer SMTP in prod, Ethereal test account in dev). All long-running sends are wrapped in `waitUntil` so the HTTP response returns immediately.

---

## 6. CI status snapshot at handover

Captured after the handover commit, with `npm ci` complete on Node 22:

| Check | Result |
|---|---|
| `npm run lint` | clean (1 warning: anonymous default export in `scripts/load-test/k6.js`, unrelated) |
| `npm run type-check` | clean |
| `npm run build` | TS compile clean; page-data collection requires a reachable `MONGODB_URI` (Vercel build IPs do reach Atlas in prod — see `src/app/(main)/layout.tsx` header comment) |
| `npm test` | not run in this prep pass — requires the per-test in-memory Mongo, which couldn't download in the prep sandbox; should run on the next dev's box / CI |
| `npm audit` | 7 advisories remaining after non-breaking `audit fix` — all transitive, see §4 |

---

## 7. Operational checklist for first deploy

1. Set every variable in `.env.local` per `.env.example` — at minimum `MONGODB_URI`, `SESSION_SECRET` (32+ chars), `AUTH_SECRET`, `EMAIL_FROM`, `CRON_SECRET`.
2. Optional but recommended: `KV_REST_API_URL` / `KV_REST_API_TOKEN` for distributed rate limiting; `TURNSTILE_*` for bot protection on forms.
3. `npm ci && npm run build` to verify the build with real env.
4. `npm run setup-admin` to seed the first admin user.
5. Add the production S3 host (and CloudFront host if used) to `next.config.ts:remotePatterns`.
6. Verify the Vercel cron schedule for `/api/cron/review-invites`.
7. Smoke-test: home → BrowseFleet → car detail → book a viewing → confirmation. Then admin: log in → add a car (with S3 image upload) → reservation → audit log.
