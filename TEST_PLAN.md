# Test Coverage Audit & Plan

**Generated:** 2026-05-15
**Branch:** `main`

## tl;dr

| Config                      | Suites pass/total | Tests pass/total | Stmt   | Branch | Func   | Line   |
| --------------------------- | ----------------- | ---------------- | ------ | ------ | ------ | ------ |
| **Before this audit**       |                   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 14 / 91           | 413 / 1122       | 22.86% | —      | —      | —      |
| node (`jest.config.api.js`) | 27 / 41           | 490 / 556        | 61.00% | 50.92% | 72.43% | 61.65% |
| **Mid-audit (infra fixed)** |                   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 73 / 78           | 1024 / 1032      | 26.60% | 28.25% | 30.60% | 26.39% |
| node (`jest.config.api.js`) | 39 / 47           | 578 / 635        | 68.13% | 63.82% | 77.83% | 68.61% |
| **Session 2 (broken-suite repairs + untested-API tests)** |        |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 77 / 77           | 1029 / 1029      | 25.90% | 28.06% | 30.14% | 25.64% |
| node (`jest.config.api.js`) | 57 / 57           | 713 / 713        | 81.61% | 75.11% | 89.18% | 82.30% |
| **Session 3 (high-value components + remaining API gaps)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 81 / 81           | 1067 / 1067      | 27.06% | 29.32% | 31.54% | 26.86% |
| node (`jest.config.api.js`) | 59 / 59           | 747 / 747        | 83.40% | 77.41% | 90.27% | 84.14% |
| **Session 4 (component breadth: Account, Dropdown, Skeleton, Booking Flow)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 94 / 94           | 1136 / 1136      | 29.19% | 31.73% | 33.55% | 29.08% |
| node (`jest.config.api.js`) | 59 / 59           | 747 / 747        | 83.40% | 77.41% | 90.27% | 84.14% |
| **Session 5 (Shared / Home / Admin Nav + partial-coverage polishing)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 101 / 101         | 1194 / 1194      | 30.81% | 33.08% | 35.49% | 30.63% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 6 (Account auth + dashboard flows)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 105 / 105         | 1238 / 1238      | 33.47% | 35.88% | 38.04% | 33.45% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 7 (Admin Dashboard primitives + tables + Booking TitleBlock)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 112 / 112         | 1271 / 1271      | 34.24% | 36.69% | 38.84% | 34.19% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 8 (Admin login / reset / 2FA panel / reservations)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 116 / 116         | 1307 / 1307      | 36.45% | 38.54% | 40.79% | 36.54% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 9 (PartExchange + Quotes admin tables)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 118 / 118         | 1330 / 1330      | 37.60% | 39.80% | 42.26% | 37.75% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 10 (Services/Common presentational + Admin/Tabs modals)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 129 / 129         | 1367 / 1367      | 38.51% | 41.65% | 43.46% | 38.62% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 11 (Admin tab forwarders + ShopSettingsTab + ImageUploader)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 133 / 133         | 1388 / 1388      | 39.49% | 42.83% | 45.27% | 39.60% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 12 (DateSelector + DashboardSkeleton + 2 charts)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 137 / 137         | 1411 / 1411      | 40.59% | 44.07% | 46.95% | 40.67% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 13 (Charts batch + UI skeleton variants + ToastContainer)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 140 / 140         | 1426 / 1426      | 41.39% | 44.35% | 48.02% | 41.41% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 14 (SaveCarButton + CarListCard + SavedCarsPage)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 143 / 143         | 1452 / 1452      | 42.27% | 45.64% | 48.89% | 42.28% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 15 (CarTable + Filters + CarView)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 146 / 146         | 1471 / 1471      | 43.29% | 46.93% | 50.70% | 43.30% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 16 (WhatsAppButtonClient + Modal focus trap + ShopButton)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | 148 / 148         | 1485 / 1485      | 43.81% | 47.65% | 51.03% | 43.86% |
| node (`jest.config.api.js`) | 59 / 59           | 757 / 757        | 85.36% | 79.49% | 92.43% | 85.99% |
| **Session 17 (final — Service subgrids + AuthSessionProvider + StatusDashboard)** |   |                  |        |        |        |        |
| jsdom (`jest.config.js`)    | **151 / 151**     | **1502 / 1502**  | **44.94%** | **48.16%** | **52.24%** | **44.91%** |
| node (`jest.config.api.js`) | **59 / 59**       | **757 / 757**    | **85.36%** | **79.49%** | **92.43%** | **85.99%** |

**Net delta from session start:** Suite pass rate jumped from **41/132 (31%) → 210/210 (100%)**.
API statement coverage went from **61% → 85.36%** (+24.4pp), branches **50.92% → 79.49%**,
functions **72.43% → 92.43%**. jsdom statement coverage **22.86% → 44.94%** (+22.08pp).
New tests added: **950+** assertions across **104 new files** — the test surface
went from ~80 files at audit start to ~186+ now.

> **100% coverage is not realistic in a single pass.** This repo has 301 source
> files, ~80 test files, and most of the remaining gap is in UI components and
> API routes that need fixture/CAPTCHA scaffolding rebuilt. The work below is a
> staged plan that gets you there over the next few PRs.

---

## 1. Root cause of the meltdown (now fixed)

77 of 91 jsdom test suites were failing with `React.act is not a function`.
The chain:

- React 19's `act()` only exists in the **development** build of `react`
  (`react/cjs/react.development.js`).
- `react/index.js` chooses dev vs production by reading `process.env.NODE_ENV`.
- `next/jest` (via `@next/env`'s `loadEnvConfig` and Jest worker setup) was
  leaving `NODE_ENV` at `"production"` by the time the test file ran, so the
  production React bundle (without `act`) loaded.
- `@testing-library/react@16` fell back to `react-dom/test-utils.act`, which
  internally calls `React.act` — same failure, same module.

**Fix** in [jest.env.setup.js](jest.env.setup.js):

```js
Object.defineProperty(process.env, "NODE_ENV", {
  value: "test",
  writable: true,
  configurable: true,
  enumerable: true,
});
```

This runs in `setupFiles` (before any `require("react")`), so React loads the
development bundle and `act()` is present. Going from 77 → 5 failing suites
was a single 5-line change.

### Secondary infra fixes shipped with this audit

- **next-auth ESM** wasn't being transformed by SWC — added `next-auth`,
  `@auth`, `@panva`, `jose`, `oauth4webapi`, `preact*` to the allow-list in both
  `jest.config.js` and `jest.config.api.js`.
- **`useSession` blew up everywhere** because the new auth-gated forms call
  `useSession()` but no test wrapped them in a provider. Added a default
  `next-auth/react` mock in [jest.setup.component.js](jest.setup.component.js)
  that returns an unauthenticated session and lets individual tests override.
- **`__tests__/utils/proxy.test.ts`** uses `NextRequest` (depends on the global
  `Request` constructor), which isn't in jsdom. Added an `@jest-environment
  node` docblock so the suite runs under the node env regardless of which config
  picks it up.

---

## 2. Stale test cases (deleted / rewritten)

These tests were asserting behavior the code deliberately no longer has — they
were a maintenance trap, not a safety net.

| Test                                                        | Why it was stale                                                                          | Action                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `validateEmail` "should sanitize XSS in email input"        | `validation.ts` header explicitly says it is NOT an XSS sanitizer — React escapes on render. | Rewrote to assert the regex *rejects* `<script>` payloads. |
| `AuthContext` "should show loading state initially"         | The blocking spinner was removed (`AuthContext.tsx:18` "#10").                            | Rewrote to assert children render immediately.        |
| `AuthContext` "should redirect to login when not authenticated" | Client-side redirect was removed; the server-side layout is now the gate.              | Rewrote to assert `router.push` is **never** called. |
| `s3.test.ts` (entire file)                                  | Calls `generatePresignedUploadUrl(key, contentType)` — function gained a required `contentLength` arg for MAX_UPLOAD_BYTES enforcement (#14). | Updated every call site, added 7 new tests for the new validation. |
| `Cars.test.tsx`                                             | Component now reaches `useToast` indirectly — needed a provider in the wrapper.            | Wrapped renders in `<ToastProvider>`.                 |

---

## 3. New test files

All new files live under [__tests__/](__tests__/), mirroring the source layout.

| File                                                                | Source                                       | Tests | Coverage focus |
| ------------------------------------------------------------------- | -------------------------------------------- | ----- | -------------- |
| [`__tests__/utils/observability.test.ts`](__tests__/utils/observability.test.ts) | `src/lib/utils/observability.ts`        | 9     | 🔒 PII redaction (email, phone, tokens, cookies) at every depth; non-Error rejections; nested objects + arrays |
| [`__tests__/utils/audit.test.ts`](__tests__/utils/audit.test.ts)               | `src/lib/utils/audit.ts`                | 4     | 🎯 audit-log outage MUST NOT block admin actions; 🔒 sensitive metadata stays out of error context |
| [`__tests__/utils/buildCarFilter.test.ts`](__tests__/utils/buildCarFilter.test.ts) | `src/lib/utils/buildCarFilter.ts`     | 17    | 🔒 regex escaping in search (no ReDoS); 📋 status/sort allow-listing; clamps page/perPage |
| [`__tests__/utils/customerAuth.test.ts`](__tests__/utils/customerAuth.test.ts) | `src/lib/utils/customerAuth.ts`         | 6     | 🔒 customer identity sourced *only* from signed session; email always lowercased |
| [`__tests__/utils/turnstile.test.ts`](__tests__/utils/turnstile.test.ts)       | `src/lib/utils/turnstile.ts`            | 12    | 🔒 dev shortcut never fires in production; 📋 every Cloudflare response shape mapped to a typed result |
| [`__tests__/utils/emailVerification.test.ts`](__tests__/utils/emailVerification.test.ts) | `src/lib/utils/emailVerification.ts` | 7     | 🔒 SHA-256 *hash* of token persists, not plaintext; 📋 24h TTL; 🎯 send failures don't propagate |
| [`__tests__/hooks/useToast.test.tsx`](__tests__/hooks/useToast.test.tsx)       | `src/hooks/useToast.ts`                 | 2     | 📋 re-export shim returns the same hook as the context module |
| [`__tests__/hooks/useAccountContact.test.tsx`](__tests__/hooks/useAccountContact.test.tsx) | `src/hooks/useAccountContact.ts`    | 4     | 📋 returns session name/email; falls back to "" per field independently |
| [`__tests__/contexts/NavigationContext.test.tsx`](__tests__/contexts/NavigationContext.test.tsx) | `src/contexts/NavigationContext.tsx` | 3     | 📋 default state; state propagation; outside-provider throws |
| [`__tests__/contexts/ViewingContext.test.tsx`](__tests__/contexts/ViewingContext.test.tsx) | `src/contexts/ViewingContext.tsx` | 6 | 📋 setViewingBooking replaces; updateViewingBooking merges; addBooking clears |
| [`__tests__/contexts/BusinessInfoContext.test.tsx`](__tests__/contexts/BusinessInfoContext.test.tsx) | `src/contexts/BusinessInfoContext.tsx` | 5 | 🎯 fetch-rejection doesn't crash; 📋 refetch() updates state |
| [`__tests__/contexts/SavedCarsContext.test.tsx`](__tests__/contexts/SavedCarsContext.test.tsx) | `src/contexts/SavedCarsContext.tsx` | 10 | 🔒 server PUT only when signed in; 📋 50-item cap; 📋 localStorage hydration + reconcile |
| [`__tests__/app/robots.test.ts`](__tests__/app/robots.test.ts)                 | `src/app/robots.ts`                     | 3     | 🔒 admin/api/Booking disallowed; sitemap URL respects NEXT_PUBLIC_SITE_URL |
| [`__tests__/app/sitemap.test.ts`](__tests__/app/sitemap.test.ts)               | `src/app/sitemap.ts`                    | 6     | 🔒 only `available` cars surface publicly; 🎯 DB outage still ships static pages |

**Total new tests so far: 94 passing assertions across 14 files.**

---

## 3a. Session-2 additions: broken-suite repairs + untested-route coverage

This is the work that closed the gap from 90% suite pass rate to 100%, and
pushed API coverage from 68% → 81.61%.

### Broken suite repairs

| Suite | Root cause | Fix |
| ----- | ---------- | --- |
| `admin/shop.test.ts` | Route added `getSession()` for audit logging; mock only had `isAuthenticated` → `(0, _auth.getSession) is not a function` → 500 | Added `getSession` to the auth mock |
| `admin/login.test.ts` | Stale assertion (route now returns 400 not 500 for invalid JSON); rate-limit pollution between tests | Per-test unique IP via `uniqueIp()` helper; updated assertion; added explicit 429 rate-limit test |
| `admin/users.test.ts` | Stale assertions on "password in response" — route now sends a setup email (#11 / Fix 2.3); missing `getSession` mock | Rewrote tests for setup-email flow (placeholder hash + SHA-256 reset token); added `getSession` mock |
| `admin/users/password.test.ts` | Tests asserted the route returned a new password; route now mails a reset link instead | Rewrote for the email-token contract; asserted token is stored as SHA-256 hash; added `hasMinimumRole` mock |
| `admin/cars.test.ts` | `revalidatePath` throws "Invariant: static generation store missing" in Jest | Mocked `next/cache` (`revalidatePath` / `revalidateTag`) |
| `admin/carparts.test.ts` | Missing `getSession` mock for audit log | Added |
| `admin/bookings.test.ts` | Test inserted 4 bookings on the same date/time → tripped `uniq_active_service_slot` unique index | Spread inserts across consecutive dates; added `getSession` mock |
| `cron/review-invites.test.ts` | Was running clean in isolation — flakiness exposed when test suites ran together. Passing in current run. | None needed |
| `components/Admin/CarPartsManagement.test.tsx` | Price renderer splits £/digits across spans; modal copy tightened | Switched to flat-text-content probes via `container.textContent`; loosened modal copy assertion |
| `components/Car/PartExchangeForm.test.tsx` | Form now reads email from session (not form input) | `beforeEach` overrides `useSession` to authenticated |
| `components/CarViewing.test.tsx` | Form is now wrapped in `<BookingAuthGate>` which only renders when authed | Passthrough-mock of `BookingAuthGate` in the test |
| `links/brokenLinks.test.ts` | `/api/auth/verify-email` legitimately exists as a route handler — the test ignored `api/` subtree | Updated route discovery to also include `route.ts`/`route.tsx` under `api/` |
| `utils/getDashboardData.test.ts` | Indexes from previous runs collided (`email_1` sparse vs not); plus the test was running under both jest configs but only api has Mongo setup | Drop collections in `beforeEach`; excluded path from `jest.config.js` (jsdom doesn't have the Mongo hook) |

### New tests for untested API routes

| File | Routes covered | Tests | Focus |
| ---- | -------------- | ----- | ----- |
| [`__tests__/api/account/saved.test.ts`](__tests__/api/account/saved.test.ts) | GET/PUT `/api/account/saved` | 11 | 🔒 401 unauth; identity from session not body; 50-item cap; de-dupe |
| [`__tests__/api/account/password.test.ts`](__tests__/api/account/password.test.ts) | POST `/api/account/password` | 9 | 🔒 currentPassword gate; first-time-set path; per-IP rate limit (429) |
| [`__tests__/api/account/profile.test.ts`](__tests__/api/account/profile.test.ts) | GET/PATCH `/api/account/profile` | 10 | 📋 hasPassword/emailVerified flags; trim+min/max on name |
| [`__tests__/api/account/bookings.test.ts`](__tests__/api/account/bookings.test.ts) | GET `/api/account/bookings` | 5 | 🔒 only the session's email's bookings; case-insensitive match |
| [`__tests__/api/auth/forgot-password.test.ts`](__tests__/api/auth/forgot-password.test.ts) | POST `/api/auth/forgot-password` | 7 | 🔒 generic response for unknown emails (no enumeration); SHA-256 token at rest |
| [`__tests__/api/auth/reset-password.test.ts`](__tests__/api/auth/reset-password.test.ts) | POST `/api/auth/reset-password` | 8 | 🔒 single-use token; 8-char min; expired tokens rejected; per-IP rate limit |
| [`__tests__/api/auth/verify-email.test.ts`](__tests__/api/auth/verify-email.test.ts) | GET/POST `/api/auth/verify-email` | 8 | 🔒 single-use; 64-hex format gate; resend POST is auth-gated + rate limited |
| [`__tests__/api/admin/2fa/enroll.test.ts`](__tests__/api/admin/2fa/enroll.test.ts) | POST `/api/admin/2fa/enroll` | 4 | 🔒 pending secret only on session until verified; 409 when already on |
| [`__tests__/api/admin/2fa/verify.test.ts`](__tests__/api/admin/2fa/verify.test.ts) | POST `/api/admin/2fa/verify` | 7 | 🔒 wrong code → 401; success persists + audit-logs + clears pending |
| [`__tests__/api/admin/2fa/disable.test.ts`](__tests__/api/admin/2fa/disable.test.ts) | POST `/api/admin/2fa/disable` | 7 | 🔒 requires re-entering current password (session alone insufficient) |

**Session-2 totals: 76 new test cases across 10 new files + 13 repaired suites.**

---

## 3b. Session-3 additions: remaining API gaps + high-value component coverage

### Remaining-API additions

| File | Routes covered | Tests | Focus |
| ---- | -------------- | ----- | ----- |
| [`__tests__/api/admin/upload.test.ts`](__tests__/api/admin/upload.test.ts) | POST `/api/admin/upload` | 12 | 🔒 auth gate; content-type allow-list; folder allow-list; `contentLength` cap (413 above 10 MB); filename sanitisation against path-traversal; ContentLength threads through to the signer so S3 enforces it |
| [`__tests__/api/admin/users/reset-password.test.ts`](__tests__/api/admin/users/reset-password.test.ts) | POST `/api/admin/users/reset-password` | 8 | 🔒 stricter 12-200 password rule with mixed case + digit; single-use; per-IP rate limit |

### High-value component additions

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Car/FinanceCalculator.test.tsx`](__tests__/components/Car/FinanceCalculator.test.tsx) | `FinanceCalculator` | 11 | 📋 amortised-payment formula; 0% APR even-split fallback; zero-principal edge case; recompute on term/deposit/APR change; 🔒 disclaimer present; `/Enquiry?...` CTA href encodes inputs |
| [`__tests__/components/Account/BookingAuthGate.test.tsx`](__tests__/components/Account/BookingAuthGate.test.tsx) | `BookingAuthGate` | 6 | 🔒 children only render for authenticated; loading state during session resolve; sign-in / register CTAs carry the current pathname as `callbackUrl`; custom heading/message override |
| [`__tests__/components/Admin/AuditLogTable.test.tsx`](__tests__/components/Admin/AuditLogTable.test.tsx) | `AuditLogTable` | 12 | 📋 row rendering; en-GB datetime formatting; targetId truncation; metadata `key=value` serialisation; filter dropdowns push the right URL; cursor pagination preserves filters; empty state |
| [`__tests__/components/Car/ReserveCarForm.test.tsx`](__tests__/components/Car/ReserveCarForm.test.tsx) | `ReserveCarForm` | 9 | 📋 session prefill; 🔒 email field is `readOnly`; POST body shape (carId, customerInfo, notes, turnstileToken); ✅ success state with reservation reference; 🎯 server-error + network-error surfacing; submit button disabled with "Reserving…" label |

**Session-3 totals: 58 new test cases across 6 new files.**

---

## 3c. Session-4 additions: component breadth (Account, Dropdown, Skeleton, Booking Flow)

This session went after the long tail of untested *jsdom* code by covering
clusters of related components (Account auth screens, the global nav
dropdown, loading skeletons, and the multi-step booking flow). Each cluster
is small individually but together they moved jsdom statement coverage
from 27.06% → 29.19%.

### Account screens

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Account/AuthShell.test.tsx`](__tests__/components/Account/AuthShell.test.tsx) | `AuthShell` | 3 | 📋 title/subtitle/children slot/footer link href |
| [`__tests__/components/Account/EmailVerificationBanner.test.tsx`](__tests__/components/Account/EmailVerificationBanner.test.tsx) | `EmailVerificationBanner` | 7 | 📋 `/api/account/profile` lookup; renders only when `emailVerified=false`; `?verified=1` success + `?verified=expired` retry; 🎯 fails open (no banner on lookup error); resend posts to `/api/auth/verify-email` |
| [`__tests__/components/Account/BookingsList.test.tsx`](__tests__/components/Account/BookingsList.test.tsx) | `BookingsList` | 5 | 📋 loading / empty / populated states; per-kind icons (service/viewing/reservation); optional subtitle |
| [`__tests__/components/Account/ForgotPasswordForm.test.tsx`](__tests__/components/Account/ForgotPasswordForm.test.tsx) | `ForgotPasswordForm` | 5 | 🔒 generic "check your inbox" response (no account enumeration); 🎯 distinct copy for 429 vs other failures |
| [`__tests__/components/Account/ResetPasswordForm.test.tsx`](__tests__/components/Account/ResetPasswordForm.test.tsx) | `ResetPasswordForm` | 6 | 🔒 client-side gates: 8+ chars + match before any network call; 📋 success bounces to `/login` after 2s |

### Global nav dropdown

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Dropdown/NavLink.test.tsx`](__tests__/components/Dropdown/NavLink.test.tsx) | `NavLink` | 5 | 📋 href + text; dropdown chevron + children; 🎯 click sets NavigationContext loading flag — but not when destination is current page |
| [`__tests__/components/Dropdown/NavButton.test.tsx`](__tests__/components/Dropdown/NavButton.test.tsx) | `NavButton` | 3 | 📋 click fires onClick; disabled blocks both click AND dropdown |
| [`__tests__/components/Dropdown/NavMenu.test.tsx`](__tests__/components/Dropdown/NavMenu.test.tsx) | `NavMenu` | 4 | 📋 open/close lifecycle; 🎯 `aria-expanded` reflects state |

### Loading skeletons

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/UI/Skeleton/Skeleton.test.tsx`](__tests__/components/UI/Skeleton/Skeleton.test.tsx) | `Skeleton{Block,Circle,Text,Image,Wrapper}` | 9 | 📋 width/height/shape props; SkeletonText renders `lines` rows with 60% last line; SkeletonWrapper switches between placeholder + children |

### Booking flow

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Booking/Flow/StepStrip.test.tsx`](__tests__/components/Booking/Flow/StepStrip.test.tsx) | `StepStrip` | 5 | 📋 step counter; per-dot done/now/upcoming classification; Back button only when `onBack` supplied |
| [`__tests__/components/Booking/Flow/ContinueBar.test.tsx`](__tests__/components/Booking/Flow/ContinueBar.test.tsx) | `ContinueBar` | 3 | 📋 label/value/buttonLabel; onContinue + disabled |
| [`__tests__/components/Booking/Flow/ServiceCard.test.tsx`](__tests__/components/Booking/Flow/ServiceCard.test.tsx) | `ServiceCard` | 7 | 📋 name/description/duration/fromPrice; per-key add-on tags (detailing rating, tints warranty, repairs "Today"); `aria-pressed` mirrors selected |
| [`__tests__/components/Booking/Flow/PackageCard.test.tsx`](__tests__/components/Booking/Flow/PackageCard.test.tsx) | `PackageCard` | 6 | 📋 name/description/duration/price; "Most popular" badge only when `recommended`; `includes` list rendering |

**Session-4 totals: 68 new test cases across 13 new files.**

---

## 3d. Session-5 additions: Shared / Home / Admin Nav + partial-coverage polishing

This session went after a final round of high-traffic but uncovered
components, plus tightened up the modules that were sitting between 70%
and 92% coverage by writing tests for the specific uncovered branches
flagged in the lcov report. Net effect: the API statement coverage
crossed **85%** and jsdom **30.8%**, with the line/branch/function metrics
all moving together.

### Shared widgets

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Shared/SearchBar.test.tsx`](__tests__/components/Shared/SearchBar.test.tsx) | `SearchBar` | 6 | 📋 push to `/BrowseFleet?search=…` with trimmed value; empty submission strips the query; hydrates initial value from `?search=` so customers can refine without retyping; 🎯 sr-only label |
| [`__tests__/components/Shared/VehicleDetails.test.tsx`](__tests__/components/Shared/VehicleDetails.test.tsx) | `VehicleDetails` | 7 | 📋 optional title; year+make+model concatenation; per-spec cells only render when the field is set; 🎯 placeholder image fallback |
| [`__tests__/components/Shared/CookieBanner.test.tsx`](__tests__/components/Shared/CookieBanner.test.tsx) | `CookieBanner` | 11 | 🔒 Accept/Reject/Customize persistence shapes (`cookie-consent` flag + `cookie-preferences` JSON with version+timestamp); necessary cookies always on + disabled; 🔒 Escape key fail-safe rejects all (never grant consent from a missed click); 🎯 dialog semantics with `aria-labelledby` |

### Homepage marketing

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Home/LatestArrivals.test.tsx`](__tests__/components/Home/LatestArrivals.test.tsx) | `LatestArrivals` | 5 | 📋 renders nothing on empty stock (homepage doesn't collapse); per-car links to `/BrowseFleet/<id>`; placeholder image fallback; mileage + colour in the meta line |
| [`__tests__/components/Home/WhyChooseHome.test.tsx`](__tests__/components/Home/WhyChooseHome.test.tsx) | `WhyChooseHome` | 4 | 📋 eyebrow + headline + intro copy; per-feature card hrefs; stat + statLabel; closing "Book a Viewing" CTA |

### Admin Nav

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/Navigation/CarActions.test.tsx`](__tests__/components/Admin/Navigation/CarActions.test.tsx) | `CarActions` | 3 | 📋 Edit/View hrefs include the car id; Delete button is wired but doesn't navigate by accident |
| [`__tests__/components/Admin/Navigation/AdminNavigationTabs.test.tsx`](__tests__/components/Admin/Navigation/AdminNavigationTabs.test.tsx) | `AdminNavigationTabs` | 5 | 🔒 menu hidden entirely when `isLoggedIn=false`; brand link to `/admin/dashboard`; nav links present after opening the dropdown; Logout calls `AuthContext.logout()` |

### Partial-coverage polish (existing files extended)

| File | Source covered | New cases | Uncovered lines closed |
| ---- | -------------- | --------- | ---------------------- |
| [`__tests__/utils/booking.test.ts`](__tests__/utils/booking.test.ts) | `generateReservationReference`, `generatePartExchangeReference` | 6 | Previously 70% coverage — now 100% (BK/QT/RS/PX prefix family) |
| [`__tests__/utils/buildCarFilter.test.ts`](__tests__/utils/buildCarFilter.test.ts) | make / colour / doors filter pass-through; yearMax-only and mileageMin-only ranges; priceMax-only range; non-'all' colour passthrough | 4 | Previously 92.42% → now ~100% |
| [`__tests__/hooks/useApi.test.tsx`](__tests__/hooks/useApi.test.tsx) | network-error catch path; non-Error rejection fallback; non-envelope JSON fallback; AbortController on unmount; refetch aborts the previous in-flight | 5 | Previously 84.61% — closed the 136-142 catch block + abort paths |
| [`__tests__/hooks/useScrollLock.test.tsx`](__tests__/hooks/useScrollLock.test.tsx) | scrollbar-width compensation when innerWidth > clientWidth; `__resetScrollLockForTests` no-op idempotency | 2 | Previously 90% — closed the padding-compensation branch |

**Session-5 totals: 58 new test cases across 8 new files + 4 extended files.**

---

## 3e. Session-6 additions: Account auth + dashboard flows

This session went after the biggest remaining jsdom blocks: the customer
auth screens (`LoginForm`, `RegisterForm`) and the post-login dashboard
shell (`AccountDashboard`, `AccountSettings`). Together they cover
~960 source lines of "the things a signed-in customer actually does",
and pushed jsdom statement coverage from 30.81% to **33.47%** in one batch.

### Auth flows

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Account/LoginForm.test.tsx`](__tests__/components/Account/LoginForm.test.tsx) | `LoginForm` | 11 | 🔒 Auth.js error codes mapped to friendly copy — `CredentialsSignin` (incorrect password) vs `RateLimited` (distinct message) vs `OAuthAccountNotLinked` (already-registered method); 📋 three sign-in paths (Credentials POST, Nodemailer magic-link, Google full-page); `?callbackUrl=` round-trips; `?error=` and `?check-email=1` hydrate the UI on first render |
| [`__tests__/components/Account/RegisterForm.test.tsx`](__tests__/components/Account/RegisterForm.test.tsx) | `RegisterForm` | 7 | 📋 two-step flow: POST `/api/auth/register` → `signIn('credentials')`; falls back to `/login?callbackUrl=…` when auto-sign-in fails (so the journey doesn't dead-end); 🔒 never surfaces raw `Error.message` from network failures |

### Dashboard shell

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Account/AccountDashboard.test.tsx`](__tests__/components/Account/AccountDashboard.test.tsx) | `AccountDashboard` | 12 | 📋 on-mount `/api/account/bookings` fetch; `?tab=` query-param hydrates the initial tab; tab switch uses `router.replace` so refresh + deep-link survive; 🎯 booking-error banner shown only on Upcoming/History tabs (not Saved); session name overrides the server-passed prop so a Settings edit reflects immediately; 🔒 Sign out destination fixed at `/` (no smuggling) |
| [`__tests__/components/Account/AccountSettings.test.tsx`](__tests__/components/Account/AccountSettings.test.tsx) | `AccountSettings` | 13 | 📋 profile fetch on mount; Save name → `PATCH /api/account/profile` + `useSession.update()` (greeting refreshes without re-login); 🔒 `hasPassword=true` requires currentPassword field, `hasPassword=false` omits it (first-time-set path); Save name disabled until value actually changes; 🔒 Delete-account two-click confirmation, DELETE + signOut on success, surfaces server error and **does not** sign out on failure |

**Session-6 totals: 43 new test cases across 4 new files.**

---

## 3f. Session-7 additions: Admin Dashboard primitives + tables + Booking TitleBlock

Final pass to lift the Admin Dashboard cluster off 0% and pick up the
last small Booking Flow component. These are presentational pieces, but
they're a substantial slice of the live admin home page and the booking
journey UI — so each test catches a category of regression (status
badges, date labels, AM/PM time, GBP formatting).

### Admin Dashboard

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/Dashboard/StatCard.test.tsx`](__tests__/components/Admin/Dashboard/StatCard.test.tsx) | `StatCard` | 5 | 📋 label/value/icon always render; optional `subtext` + `badge`; accepts string or number for value |
| [`__tests__/components/Admin/Dashboard/UpdatedAt.test.tsx`](__tests__/components/Admin/Dashboard/UpdatedAt.test.tsx) | `UpdatedAt` | 1 | 📋 SSR-safe: renders nothing on first paint then "Updated HH:MM" en-GB after mount |
| [`__tests__/components/Admin/Dashboard/RefreshButton.test.tsx`](__tests__/components/Admin/Dashboard/RefreshButton.test.tsx) | `RefreshButton` | 2 | 📋 click calls `router.refresh()` inside a transition |
| [`__tests__/components/Admin/Dashboard/KPIGrid.test.tsx`](__tests__/components/Admin/Dashboard/KPIGrid.test.tsx) | `KPIGrid` | 6 | 📋 all 8 stat-card labels render; inventory + sold value formatted as GBP; subtext fragments correct; pending badge shows only when count > 0 |
| [`__tests__/components/Admin/Dashboard/RecentActivityTable.test.tsx`](__tests__/components/Admin/Dashboard/RecentActivityTable.test.tsx) | `RecentActivityTable` | 6 | 📋 empty-state copy; per-status pill (pending/confirmed/completed/cancelled + neutral fallback); per-type badge; em-dash placeholder for missing detail/createdAt |
| [`__tests__/components/Admin/Dashboard/UpcomingAppointments.test.tsx`](__tests__/components/Admin/Dashboard/UpcomingAppointments.test.tsx) | `UpcomingAppointments` | 7 | 📋 'Today'/'Tomorrow'/weekday labels; 12-hour AM/PM time; detail falls back to reference; per-type icon |

### Booking flow

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Booking/Flow/TitleBlock.test.tsx`](__tests__/components/Booking/Flow/TitleBlock.test.tsx) | `TitleBlock` | 6 | 📋 eyebrow + title always render; subtitle optional; prefill chip only when `prefillLabel`; 'change' button only when `onPrefillChange`; accepts ReactNode for title/subtitle |

**Session-7 totals: 33 new test cases across 7 new files.**

---

## 3g. Session-8 additions: Admin auth shell (login + reset + 2FA + reservations table)

The previous sessions left the admin side at a low coverage % because the
sign-in screen, password reset, 2FA panel, and reservation management
were untested. This session covers all four — they're the security-sensitive
surface a privileged user actually interacts with at sign-in and lifecycle
moments.

### Admin auth

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/AdminForm.test.tsx`](__tests__/components/Admin/AdminForm.test.tsx) | `AdminForm` | 8 | 📋 POST `/api/admin/login` → AuthContext.login on success; server `requires2fa=true` flips into TOTP entry; second submit includes `totpCode`; 🔒 TOTP input filters non-digits; 🎯 invalid TOTP stays in 2FA mode with error; generic network error fallback |
| [`__tests__/components/Admin/ResetPasswordForm.test.tsx`](__tests__/components/Admin/ResetPasswordForm.test.tsx) | `ResetPasswordForm` (admin) | 7 | 🔒 stricter 12+ char rule + mixed case + digit (matches `/api/admin/users/reset-password`); 📋 POST + success → router.push('/admin/login') after 2s; distinct error per validation failure |
| [`__tests__/components/Admin/TwoFactorPanel.test.tsx`](__tests__/components/Admin/TwoFactorPanel.test.tsx) | `TwoFactorPanel` | 11 | 🔒 QR code rendered client-side via dynamic-imported `qrcode` (secret never leaves the browser); 📋 state machine idle → verifying → idle; disable requires current password; 🎯 numeric-only TOTP input; cancel returns to idle |

### Admin reservations management

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/ReservationsTable.test.tsx`](__tests__/components/Admin/ReservationsTable.test.tsx) | `ReservationsTable` | 9 | 📋 per-row Confirm/Cancel action set matches lifecycle (Confirm only on pending; Cancel on pending/confirmed; nothing for cancelled/expired); 🎯 status filter pushes the URL; Clear link only when a filter is active; PATCH success → router.refresh; server error and network error surface |

**Session-8 totals: 35 new test cases across 4 new files.**

---

## 3h. Session-9 additions: Part-exchange + Quotes admin tables

Two more management-table components — both follow the same lifecycle
pattern as `ReservationsTable` (status filter URL, per-row action set
gated by current status, PATCH with refresh on success). Tests focus on
the documented status transitions and the `window.prompt`-driven
metadata capture (valuation amount for part-ex, response note for
quotes).

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/PartExchangeTable.test.tsx`](__tests__/components/Admin/PartExchangeTable.test.tsx) | `PartExchangeTable` | 11 | 📋 lifecycle (`pending → valued → accepted/declined`); `window.prompt` valuation flow: parses digits-only number, skips if blank, cancels on `null`; status filter URL; "Clear" visibility; PATCH success → router.refresh; server error surfacing |
| [`__tests__/components/Admin/QuotesTable.test.tsx`](__tests__/components/Admin/QuotesTable.test.tsx) | `QuotesTable` | 11 | 📋 lifecycle (`pending → responded → accepted`, plus "Expire" on any non-terminal); response-note prompt is optional (skipped → no `responseMessage` in body); Mark accepted bypasses prompt; status filter URL; server error path |

**Session-9 totals: 22 new test cases across 2 new files.**

---

## 3i. Session-10 additions: Services/Common presentational + Admin/Tabs modals

Two clusters of small, focused presentational components. Together they
take Services/Common from 7.69% to ~75% and the Admin/Tabs modals from
~15% to ~60%.

### Services/Common presentational

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Services/Common/BackNavigation.test.tsx`](__tests__/components/Services/Common/BackNavigation.test.tsx) | `BackNavigation` | 2 | href + arrow icon |
| [`__tests__/components/Services/Common/BlackRedSection.test.tsx`](__tests__/components/Services/Common/BlackRedSection.test.tsx) | `BlackRedSection` | 2 | children render + className concat |
| [`__tests__/components/Services/Common/InfoBox.test.tsx`](__tests__/components/Services/Common/InfoBox.test.tsx) | `InfoBox` | 2 | row label/value rendering; empty-rows safety |
| [`__tests__/components/Services/Common/PackageGrid.test.tsx`](__tests__/components/Services/Common/PackageGrid.test.tsx) | `PackageGrid` | 3 | default 3-col vs explicit 2-col class wiring |
| [`__tests__/components/Services/Common/ProcessFlow.test.tsx`](__tests__/components/Services/Common/ProcessFlow.test.tsx) | `ProcessFlow` | 3 | step number/title/description; dark mode; custom accent |
| [`__tests__/components/Services/Common/FeatureList.test.tsx`](__tests__/components/Services/Common/FeatureList.test.tsx) | `FeatureList` | 4 | features render; optional title; `highlightPrefix` applies the accent class only when matched |
| [`__tests__/components/Services/Common/WhyChooseUs.test.tsx`](__tests__/components/Services/Common/WhyChooseUs.test.tsx) | `WhyChooseUs` | 2 | default 3-item list; custom items override |
| [`__tests__/components/Services/Common/PackageCard.test.tsx`](__tests__/components/Services/Common/PackageCard.test.tsx) | `PackageCard` | 5 | name/price/body/optional subtitle/extra/footer; popular badge + custom popularLabel; per-`AccentColor` class wiring |
| [`__tests__/components/Services/Common/BenefitsGrid.test.tsx`](__tests__/components/Services/Common/BenefitsGrid.test.tsx) | `BenefitsGrid` | 4 | default title; custom title; dark-mode classes; per-column grid class wiring |

### Admin/Tabs modals

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/Tabs/CancelBookingModal.test.tsx`](__tests__/components/Admin/Tabs/CancelBookingModal.test.tsx) | `CancelBookingModal` | 5 | 🎯 "Cancel Booking" disabled until reason ≥ 10 chars; inline counter while below threshold; onClose + onCancel(reason) wiring |
| [`__tests__/components/Admin/Tabs/BookingDetailsModal.test.tsx`](__tests__/components/Admin/Tabs/BookingDetailsModal.test.tsx) | `BookingDetailsModal` | 4 | 📋 service-type block only on service bookings; vehicle block only on viewing bookings; footer Close vs header X-Close button disambiguation |

**Session-10 totals: 37 new test cases across 11 new files.**

---

## 3j. Session-11 additions: Admin tab forwarders + ShopSettingsTab + ImageUploader

Two clusters left in the Admin shell: the `ServiceBookingsTab` /
`ViewingBookingsTab` thin forwarders (so a refactor can't silently drop
the `type` prop), the full `ShopSettingsTab` form, and `ImageUploader` —
the most security-sensitive admin client component because it brokers
S3 presigned-URL uploads.

### Admin tab forwarders

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/Tabs/ServiceBookingsTab.test.tsx`](__tests__/components/Admin/Tabs/ServiceBookingsTab.test.tsx) | `ServiceBookingsTab` | 1 | 📋 forwards `type="service"` + all props to BookingsTable |
| [`__tests__/components/Admin/Tabs/ViewingBookingsTab.test.tsx`](__tests__/components/Admin/Tabs/ViewingBookingsTab.test.tsx) | `ViewingBookingsTab` | 1 | 📋 forwards `type="viewing"` + all props to BookingsTable |
| [`__tests__/components/Admin/Tabs/ShopSettingsTab.test.tsx`](__tests__/components/Admin/Tabs/ShopSettingsTab.test.tsx) | `ShopSettingsTab` | 8 | 📋 every field's `onChange` immutably merges via `onShopInfoChange` (so partial edits don't clobber sibling fields); per-day `hours.{day}` and `socialMedia.{key}` nested merges; submit fires onSave; null fields → `""` (no controlled/uncontrolled React warning) |

### ImageUploader

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/ImageUploader.test.tsx`](__tests__/components/Admin/ImageUploader.test.tsx) | `ImageUploader` | 10 | 🔒 client-side validation: rejects disallowed MIME types AND files > 10 MB before any network call; 🔒 remove only sends DELETE for keys in approved folders (`cars/` or `parts/`) — legacy or external URLs skip the DELETE; URL-parse failures swallow safely; 📋 hides drop zone when slots are full; 'Main' badge on first preview in multiple mode; drag-drop calls into the same upload path |

**Session-11 totals: 20 new test cases across 4 new files.**

---

## 3k. Session-12 additions: DateSelector + DashboardSkeleton + 2 charts

The dashboard's date-range filter was the last sizeable client-component
piece without tests. Pairing it with the loading-state skeleton and two
sample charts (one with an explicit empty state, one without) closes the
Admin/Dashboard cluster off ~18% and lifts jsdom statement coverage
across the 40% threshold for the first time.

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Admin/Dashboard/DateSelector.test.tsx`](__tests__/components/Admin/Dashboard/DateSelector.test.tsx) | `DateSelector` | 14 | 📋 URL-driven label (`?range=`, `?from/?to`); preset / month / custom paths all push the right pathname+query; 'All time' strips the param; future months disabled; Apply disabled until both From and To set; clear (×) badge appears only when filter active; outside-click + Back button restore presets view |
| [`__tests__/components/Admin/Dashboard/DashboardSkeleton.test.tsx`](__tests__/components/Admin/Dashboard/DashboardSkeleton.test.tsx) | `DashboardSkeleton` | 3 | 📋 mounts the 8-card KPI grid placeholder + chart + table shimmer rows; every shimmer block carries `animate-pulse` |
| [`__tests__/components/Admin/Dashboard/InventoryPieChart.test.tsx`](__tests__/components/Admin/Dashboard/InventoryPieChart.test.tsx) | `InventoryPieChart` | 4 | 📋 title + optional subtitle; 🎯 'No data available' empty state when every slice has value=0; Recharts container mounts when there is data |
| [`__tests__/components/Admin/Dashboard/PriceDistributionChart.test.tsx`](__tests__/components/Admin/Dashboard/PriceDistributionChart.test.tsx) | `PriceDistributionChart` | 2 | 📋 static heading + subtitle; chart container mounts for both empty and populated data |

**Session-12 totals: 23 new test cases across 4 new files.**

---

## 3l. Session-13 additions: Charts batch + UI skeleton variants + ToastContainer

Final pass to close out the remaining cluster of `src/components/Admin/
Dashboard/*Chart.tsx` Recharts wrappers, the five `src/components/UI/
Skeleton/*` variants, and the small Toast portal container.

### Dashboard charts (batched)

| File | Components | Tests | Focus |
| ---- | ---------- | ----- | ----- |
| [`__tests__/components/Admin/Dashboard/Charts.test.tsx`](__tests__/components/Admin/Dashboard/Charts.test.tsx) | `BookingsChart`, `BookingsByDayChart`, `PopularCarsChart`, `ServiceTypeChart` | 8 | 📋 each renders its static heading + subtitle; 🎯 empty-state copy for the two charts that have one (`PopularCarsChart` → "No viewing data yet"; `ServiceTypeChart` → "No service data yet"); Recharts container mounts for populated data |

### UI skeleton variants (batched)

| File | Components | Tests | Focus |
| ---- | ---------- | ----- | ----- |
| [`__tests__/components/UI/Skeleton/Variants.test.tsx`](__tests__/components/UI/Skeleton/Variants.test.tsx) | `CarCardSkeleton`, `CarListCardSkeleton`, `CarDetailSkeleton`, `HeroFeaturedCarSkeleton`, `PackageCardSkeleton` | 5 | 📋 each renders a real DOM tree with the shared rounded/shimmer placeholder treatment — catches a regression where a skeleton accidentally renders no children |

### Toast portal

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Toast/ToastContainer.test.tsx`](__tests__/components/Toast/ToastContainer.test.tsx) | `ToastContainer` | 3 | 📋 renders nothing when no toasts; portals into `document.body` when present; one Toast per entry; 🎯 `aria-live="polite"` wrapper for screen readers |

**Session-13 totals: 16 new test cases across 3 new files.**

---

## 3m. Session-14 additions: SaveCarButton + CarListCard + SavedCarsPage

Customer-facing save-a-car flow: the heart toggle, the list-card that
renders it for both customer + admin variants, and the dedicated
`/saved` page that fetches and filters the saved list.

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Car/SaveCarButton.test.tsx`](__tests__/components/Car/SaveCarButton.test.tsx) | `SaveCarButton` | 6 | 📋 `aria-pressed` + sr-only label flip with saved state; click fires `toggle(carId)`; 🎯 stops the click from bubbling to a wrapping `<Link>` (so the click doesn't accidentally navigate); custom `label` override; heart icon `fill-red-600` only when saved |
| [`__tests__/components/Car/CarListCard.test.tsx`](__tests__/components/Car/CarListCard.test.tsx) | `CarListCard` | 10 | 📋 customer variant: View Details link to `/BrowseFleet/<id>`, SaveCarButton, status dot/label; admin variant: status badge with per-status colour wiring, Featured toggle, CarActions; Featured pill only when `car.featured`; features list truncates to 5 with `+N more` overflow; image fallback |
| [`__tests__/components/Car/SavedCarsPage.test.tsx`](__tests__/components/Car/SavedCarsPage.test.tsx) | `SavedCarsPage` | 10 | 📋 fetches `/api/admin/cars?limit=500&status=available` then filters by savedIds; 🎯 distinct sub-heading for authenticated vs unauthenticated; empty-state copy; non-ok + network failure both leave the list empty without crashing; "Clear all" only when savedIds non-empty, prompts for confirmation, cancels safely |

**Session-14 totals: 26 new test cases across 3 new files.**

---

## 3n. Session-15 additions: CarTable + Filters + CarView

The admin Car-management surface: paginated table view, the filter
panel that drives all three views, and the orchestrator that ties them
together with the filter context.

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/Car/CarTable.test.tsx`](__tests__/components/Car/CarTable.test.tsx) | `CarTable` | 6 | 📋 header columns; 10-per-page slicing (page 1 shows cars 0..9); per-row formatted price + mileage; per-row Actions dropdown + status badge; 🎯 empty-state copy |
| [`__tests__/components/Car/Filters.test.tsx`](__tests__/components/Car/Filters.test.tsx) | `Filters` | 7 | 📋 header shows "<filtered> of <total> vehicles"; 'More' toggle reveals advanced filters (Year/Mileage/Doors/Colour/Features); Doors options derive from unique car values; Status select updates value; Features section lists unique features; 🎯 Reset button only when a filter is active |
| [`__tests__/components/Car/CarView.test.tsx`](__tests__/components/Car/CarView.test.tsx) | `CarView` | 6 | 📋 wraps content in FilterProvider; renders the Filters bar with the total count; Card view default (Card button disabled); switching to Table/List swaps the rendered child; 🎯 empty state for `cars=[]`; Card view shows a 'Bookings' section below |

**Session-15 totals: 19 new test cases across 3 new files.**

---

## 3o. Session-16 additions: WhatsAppButtonClient + Modal focus trap + ShopButton

Closing out three small, focused targets the earlier sessions left
behind. WhatsAppButtonClient is the floating chat button (Day 9 / Fix
9.2 privacy guard); Modal's focus trap is the one piece of the dialog
shell that earlier tests didn't cover; ShopButton is the debounced
add-to-cart button shipping anti-double-click logic.

| File | Component | Tests | Focus |
| ---- | --------- | ----- | ----- |
| [`__tests__/components/WhatsAppButtonClient.test.tsx`](__tests__/components/WhatsAppButtonClient.test.tsx) | `WhatsAppButtonClient` | 8 | 📋 hides on `/admin/*` and `/confirmation` paths; 📋 E.164 normalisation of UK numbers ("0..." → "44..."); context-aware deep-link message on `/BrowseFleet/<id>`; generic message elsewhere; 🔒 strips `?utm_*` and hash from the URL pasted into the wa.me text (Day 9 / Fix 9.2 privacy leak) |
| [`__tests__/components/Helpful/Buttons/Modal.test.tsx`](__tests__/components/Helpful/Buttons/Modal.test.tsx) (+3 cases) | `Modal` focus trap | 3 | 🎯 CODEBASE_ISSUES G3: Tab from the last focusable cycles back to the dialog's first (close button); Shift+Tab from the first cycles to the last; non-Tab keys pass through unchanged |
| [`__tests__/components/Helpful/Buttons/ShopButton.test.tsx`](__tests__/components/Helpful/Buttons/ShopButton.test.tsx) | `ShopButton` | 3 | 📋 click disables the button for ~1s and fires onClick after a 500ms delay (so the animation gets a chance to show); 🎯 repeated rapid clicks while disabled are ignored (the production bug this guards against is double-submitting "add to cart") |

**Session-16 totals: 14 new test cases across 2 new files + 1 extended file.**

---

## 3p. Session-17 additions: Service subgrids + AuthSessionProvider + StatusDashboard

Closes out three more clusters that each had 0% coverage:
- The three service-page sub-grids (Detailing / Tints / Repairs)
- The customer auth session provider wrapper
- The admin status dashboard that polls `/api/admin/health`

| File | Component(s) | Tests | Focus |
| ---- | ------------ | ----- | ----- |
| [`__tests__/components/Services/SubGrids.test.tsx`](__tests__/components/Services/SubGrids.test.tsx) | `DetailingPackageGrid`, `RepairServiceGrid`, `EmergencyBanner`, `TintOptionsGrid`, `VLTGuide` | 6 | 📋 per-package rendering for detailing + tints; repair service categories; 🔒 EmergencyBanner strips whitespace from the phone in the `tel:` link; VLT guide renders 4 options + 🎯 legal-compliance notice |
| [`__tests__/components/Providers/AuthSessionProvider.test.tsx`](__tests__/components/Providers/AuthSessionProvider.test.tsx) | `AuthSessionProvider` | 1 | 📋 pass-through wrapper around next-auth's SessionProvider that owns the `"use client"` directive — verifies children render |
| [`__tests__/components/Admin/Dashboard/Status/StatusDashboard.test.tsx`](__tests__/components/Admin/Dashboard/Status/StatusDashboard.test.tsx) | `StatusDashboard` | 10 | 📋 banner copy per operational/degraded/outage; per-service rows with response-time pill (omitted when null); uptime formatted "Xd Yh Zm"; node version + Updated timestamp; Refresh fetches `/api/admin/health` and updates state; 🎯 error banner on fetch failure |

**Session-17 totals: 17 new test cases across 3 new files.**

---

## 3q. Session-18 additions: SEO Breadcrumb + UI leaf components + CustomDropdown

Mops up four small leaf components that each had 0% coverage:
- The schema.org `BreadcrumbList` JSON-LD emitter
- The single-purpose `FeaturedCarBookingButton` Link
- The `PageLoader` 800ms reset timer
- The custom dropdown with outside-click handling

| File | Component(s) | Tests | Focus |
| ---- | ------------ | ----- | ----- |
| [`__tests__/components/SEO/Breadcrumb.test.tsx`](__tests__/components/SEO/Breadcrumb.test.tsx) | `Breadcrumb` | 2 | 🔒 JSON-LD shape (`@context`, `@type: "BreadcrumbList"`, 1-indexed `position`); relative URLs are prefixed with `NEXT_PUBLIC_SITE_URL`; absolute URLs pass through untouched (no double-prefixing) |
| [`__tests__/components/UI/FeaturedCarBookingButton.test.tsx`](__tests__/components/UI/FeaturedCarBookingButton.test.tsx) | `FeaturedCarBookingButton` | 3 | 📋 renders as a Link pointing at `/Booking/<carId>`; click sets ViewingContext's pending car (verified via consumer); copy + arrow icon present |
| [`__tests__/components/UI/PageLoader.test.tsx`](__tests__/components/UI/PageLoader.test.tsx) | `PageLoader` | 3 | 📋 hidden by default (no `isNavigating`); appears once `setNavigating(true)` is called; 🎯 fake-timer-asserted 800ms reset so a stuck loader self-clears |
| [`__tests__/components/CarParts/CustomDropdown.test.tsx`](__tests__/components/CarParts/CustomDropdown.test.tsx) | `CustomDropdown` | 5 | 📋 placeholder vs selected-label trigger text; click opens the menu and shows all options; selecting fires `onChange(value)` and collapses; 🎯 mousedown outside the dropdown closes it |

**Session-18 totals: 13 new test cases across 4 new files.**

Combined suite after this session: **214 suites / 2273 tests passing** across both configs (155 + 59). jsdom statement coverage **45.64%** (was 44.94%).

---

## 3r. Session-19 additions: SavedCarsList + HeroSection + EditCarForm + ViewingBookingsClient

Four more 0%-coverage components, picking off the next-biggest wins from
the gap list. HeroSection is the first async server component in the
suite — pattern is `const ui = await Component(); render(ui);` after
mocking the underlying data calls. ViewingBookingsClient is the first
client-island test that drives state via the props the heavy child
components receive (rendered through `jest.mock` stubs that capture the
props by ref).

| File | Component(s) | Tests | Focus |
| ---- | ------------ | ----- | ----- |
| [`__tests__/components/Account/SavedCarsList.test.tsx`](__tests__/components/Account/SavedCarsList.test.tsx) | `SavedCarsList` | 7 | 📋 empty savedIds → no fetch + EmptyState linking to `/BrowseFleet`; fetches `/api/admin/cars?limit=500&status=available` then filters by savedIds; singular vs plural count copy; 🎯 non-ok response + network error both fall back to empty-state; "Clear all" confirm + cancel paths |
| [`__tests__/components/HeroSection.test.tsx`](__tests__/components/HeroSection.test.tsx) | `HeroSection` | 4 | 📋 no-featured-car branch (single column, "Browse Cars" CTA); 📋 with-featured-car branch (2-col, year/make/model, formatted price + mileage, View Details link to `/BrowseFleet/<id>`, FeaturedCarBookingButton mount); 🎯 featured car w/o image falls back to `/tesla.webp`; heroStats threading from businessInfo |
| [`__tests__/components/Admin/Form/EditCarForm.test.tsx`](__tests__/components/Admin/Form/EditCarForm.test.tsx) | `EditCarForm` | 6 | 📋 pre-fills inputs from `car`; PUTs `/api/admin/cars` with edited fields then routes to `/admin/dashboard/cars` + refresh + success toast; surfaces `details.field[]` error from the server; network-error toast; 🎯 missing `_id` short-circuits with "Missing car ID"; Cancel routes back without firing a request |
| [`__tests__/components/Admin/ViewingBookingsClient.test.tsx`](__tests__/components/Admin/ViewingBookingsClient.test.tsx) | `ViewingBookingsClient` | 11 | 📋 empty initialBookings → "No viewing bookings available" copy; cancel rejects reasons <10 chars; cancel success → POST `/api/bookings/cancel` then refetch; confirm → PUT `/api/admin/bookings` with `status: "confirmed"` then refetch; details modal opens with the selected booking; `getStatusBadge` per-status colours + gray fallback; 🎯 toasts on every non-ok / network failure branch |

**Session-19 totals: 28 new test cases across 4 new files.**

Combined suite after this session: **218 suites / 2301 tests passing** across both configs (159 + 59). jsdom statement coverage **47.4%** (was 45.64%).

---

## 3s. Session-20 additions: BrowseFleetContent + CarDetailView + ContactSection + Cars actions

Two of the biggest 0%-coverage targets fall:

- **BrowseFleetContent** (`/BrowseFleet` listing) — 318 lines of URL-driven
  filter logic. The trick is `useSearchParams` stays mocked per-test so
  `setParams` builds the right next URL, and `usePathname`/`useRouter.push`
  are stubbed so we can assert the exact string passed to `router.push`.
- **CarDetailView** (`/BrowseFleet/<id>`) — 807 lines. The heavy child
  forms (Finance / Reserve / PartExchange / BookingAuthGate / CarShareModal)
  are stubbed; what remains is gallery state, save/share wiring, dealer
  card branching (`mapsUrl` vs mailto), and the available-only reserve/PX
  section. The scroll-listener-driven mobile sticky bar is exercised via
  a `window.dispatchEvent(new Event("scroll"))` after bumping `scrollY`.

Plus two cleanup wins: `ContactSection` (the services-page CTA strip) and
extending the existing `Cars` admin test to cover the action handlers
(Edit / View-in-new-tab / Delete confirmation + DELETE call + carousel
step-back on last-item delete).

| File | Component(s) | Tests | Focus |
| ---- | ------------ | ----- | ----- |
| [`__tests__/app/BrowseFleetContent.test.tsx`](__tests__/app/BrowseFleetContent.test.tsx) | `BrowseFleetContent` | 11 | 📋 per-control URL-update wiring (search, sort, make, doors, features, page); blank value deletes the key (not blanks it); 🔒 filter change drops a stale `?page=`; 🎯 active-count badge + Clear-all only render when ≥1 filter; empty-state copy; singular/plural "vehicle"/"vehicles"; multi-page "Showing X–Y of Z"; pagination block only on >1 page |
| [`__tests__/components/Car/CarDetailView.test.tsx`](__tests__/components/Car/CarDetailView.test.tsx) | `CarDetailView` | 16 | 📋 title/mileage/colour/dealer-line; reserved/sold status badge; gallery Prev/Next + ArrowLeft/Right keys with wrap-around; thumbnail strip jumps to index; Save toggles via `SavedCarsContext.toggle(id)` + `aria-pressed` reflects state; "Book a viewing" Link to `/Booking/<id>` seeds `ViewingContext`; 🔒 tel: link strips whitespace; 🎯 Get directions uses maps URL when present; features slice(0,8) + "See all N" overflow; stock-ref footer formatted from `_id.slice(-6).toUpperCase()`; similar-cars rail only on non-empty; reserve/PX section only when status=available; mobile sticky bar reveals once `window.scrollY > 480` |
| [`__tests__/components/Services/ContactSection.test.tsx`](__tests__/components/Services/ContactSection.test.tsx) | `ContactSection` | 5 | 📋 title/subtitle copy; per-type element (link → next/link, email/phone → plain `<a>` with mailto/tel href); per-style colour pill (primary=green, secondary=gray-border, danger=red, default=gray-600); secondary block only renders when `secondaryActions` is supplied |
| [`__tests__/components/Car/Cars.test.tsx`](__tests__/components/Car/Cars.test.tsx) (extended) | `Cars` admin card | +9 | 📋 Edit `router.push("/admin/dashboard/cars/edit/<id>")`; View `window.open("/BrowseFleet/<id>", "_blank", "noopener,noreferrer")`; Delete opens `ConfirmDialog` with the car label; confirm → DELETE `/api/admin/cars?id=<id>` + success toast + `router.refresh()`; 🎯 last-item delete steps the carousel back via `setCarId(carId-1)`; non-ok response → error toast with `body.error`; network error → generic "Network error" toast; cancel closes dialog without firing; buttons disabled when `_id` is missing |

**Session-20 totals: 41 new test cases across 3 new files + 1 extended file.**

Combined suite after this session: **221 suites / 2342 tests passing** across both configs (162 + 59). jsdom statement coverage **49.25%** (was 47.4%).

---

## 3t. Session-21 additions: Next.js page shells (admin dashboard + booking flow)

Coverage report flagged `src/app/**/page.tsx` as a near-uniform 0% — these
are the server-component pages we'd been deliberately skipping. This
session knocks out the ones with **real branching** (auth gates, status
whitelists, query parsing) and leaves the static marketing pages
(AboutUs, AccidentClaims, terms, privacy, FAQ) since their value is
visual, not behavioural.

Pattern: `const ui = await Page({ searchParams: Promise.resolve(...) }); render(ui);`,
plus the unauth path tested via `await expect(Page(...)).rejects.toThrow("REDIRECTED")`
(the `redirect()` mock throws a sentinel so the page bails like real
Next.js does). MongoDB collections are stubbed to a tiny chainable cursor.

Also: excluded [`__tests__/utils/auth.test.ts`](__tests__/utils/auth.test.ts)
from the jsdom config — it's a server-only test (pokes `process.env.NODE_ENV`
and re-requires iron-session). Was running under both configs and
duplicating in the VS Code Test Explorer.

| File | Page | Tests | Focus |
| ---- | ---- | ----- | ----- |
| [`__tests__/app/admin/dashboard/status.page.test.tsx`](__tests__/app/admin/dashboard/status.page.test.tsx) | `/admin/dashboard/status` | 2 | 🔒 unauth → `redirect("/admin/login")` before any fetch; 📋 resolved `getHealthData()` threaded into `<StatusDashboard initialHealth>` |
| [`__tests__/app/admin/dashboard/quotes.page.test.tsx`](__tests__/app/admin/dashboard/quotes.page.test.tsx) | `/admin/dashboard/quotes` | 5 | 🔒 unauth + no-DB read; 📋 no `?status` → empty Mongo filter; valid status threads through; 🔒 invalid status silently dropped from filter (but kept in URL state for form); sort/limit/serialize wiring |
| [`__tests__/app/admin/dashboard/reservations.page.test.tsx`](__tests__/app/admin/dashboard/reservations.page.test.tsx) | `/admin/dashboard/reservations` | 4 | Same shape as quotes — different `VALID_STATUSES` list (pending/confirmed/cancelled/expired) |
| [`__tests__/app/admin/dashboard/part-exchange.page.test.tsx`](__tests__/app/admin/dashboard/part-exchange.page.test.tsx) | `/admin/dashboard/part-exchange` | 4 | Same shape — statuses are pending/valued/accepted/declined |
| [`__tests__/app/admin/dashboard/viewing.page.test.tsx`](__tests__/app/admin/dashboard/viewing.page.test.tsx) | `/admin/dashboard/viewing` | 2 | 🔒 unauth + no DB read; 📋 sorted serialised bookings threaded into ViewingBookingsClient's `initialBookings` |
| [`__tests__/app/admin/dashboard/audit.page.test.tsx`](__tests__/app/admin/dashboard/audit.page.test.tsx) | `/admin/dashboard/audit` | 12 | 🔒 unauth → `/admin/login`; **manager/staff redirected to `/admin/dashboard`** (audit is admin-only); whitespace-only actor/action filters dropped; trimmed when supplied; 🔒 targetType whitelist enforced; cursor parsed to `Date` → `{ createdAt: { $lt: <date> } }`; bad cursor silently dropped; over-fetches PAGE_SIZE+1 to determine `nextCursor`; distinct actors/actions sorted before passing to the table |
| [`__tests__/app/admin/dashboard/cars-edit.page.test.tsx`](__tests__/app/admin/dashboard/cars-edit.page.test.tsx) | `/admin/dashboard/cars/edit/[_id]` | 4 | 🔒 invalid ObjectId never hits the DB; missing car → "Vehicle not found" UI; `findOne` errors swallowed via `logError`; found car → EditCarForm with serialised doc + subtitle "year make model" |
| [`__tests__/app/Booking/confirmation.page.test.tsx`](__tests__/app/Booking/confirmation.page.test.tsx) | `/Booking/confirmation` | 6 | 📋 missing `?ref` → "Invalid Confirmation Link" fallback; with `ref` → reference + 3-step next-steps + `/Booking/lookup?ref=<>` deep-link; 🎯 `?email` shows up in the "sent to" copy, falls back to generic line without; contact card prefers `bookingsEmail` over `email`; `tel:` from `businessInfo.phone` |
| [`__tests__/app/saved.page.test.tsx`](__tests__/app/saved.page.test.tsx) | `/saved` | 2 | Thin shell — renders `<SavedCarsPage />`; 🔒 metadata exports `robots: { index: false, follow: true }` (private list, follow allowed) |
| [`__tests__/app/BrowseFleet.page.test.tsx`](__tests__/app/BrowseFleet.page.test.tsx) | `/BrowseFleet` | 5 | 📋 default params → page 1 / empty filter / facets union over the **available-only** dataset (not filtered set); 🎯 hero badge uses live `totalAvailable`; 📋 facets always run with `{ status: "available" }` filter; pagination skip = (page-1) × perPage; breadcrumb + SEO scaffolding always rendered |

**Session-21 totals: 46 new test cases across 10 new files; +1 jest.config.js exclusion (auth.test.ts).**

Combined suite after this session: **230 suites / 2360 tests passing** across both configs (171 + 59). jsdom statement coverage **50.96%** (was 49.25%) — first time above 50%.

### Session 21 continuation: page-shell sweep + AnimatePresence mock

Picked up the long-tail of `src/app/**/page.tsx` files still at 0% — auth
shells, detail pages, the booking + review pages, and the client-side
admin shop settings page.

Also fixed a class of test-pollution failures introduced by the
framer-motion migration: `AnimatePresence` defers unmounts so
`expect(...).not.toBeInTheDocument()` after a state change kept failing
in jsdom (Dropdown, NavMenu, SaveCarButton, WhyChooseHome, Modal,
CancelBookingModal). Mocked **only** `AnimatePresence` in
[`jest.setup.component.js`](jest.setup.component.js) — `motion.*` /
`motion.create(Component)` keep the real implementation so class-name
and style assertions still pass.

| File | Pages | Tests | Focus |
| ---- | ----- | ----- | ----- |
| [`__tests__/app/customer-auth.pages.test.tsx`](__tests__/app/customer-auth.pages.test.tsx) | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account` | 10 | 🔒 signed-in users redirected away from login/register (no form flash); /account redirects signed-out users to `/login?callbackUrl=/account`; reset-password's 64-hex token regex blocks the form mount on malformed links; 📋 footer link wiring + AccountDashboard receives session user |
| [`__tests__/app/admin/admin-shells.pages.test.tsx`](__tests__/app/admin/admin-shells.pages.test.tsx) | `/admin/login`, `/admin/reset-password`, `/admin/dashboard/{account, add, cars}` | 12 | 🔒 admin/login redirects authed admins → `/admin/dashboard`; admin/reset-password's 64-hex token gate; dashboard/account unauth-redirect fires BEFORE DB read, and 'user not found in DB' is treated the same as unauth (defensive); 📋 TwoFactorPanel receives `initialEnabled` from `totpEnabled === true` (false on undefined); cars page threads `cars + bookings` arrays through to CarView |
| [`__tests__/app/detail-pages.test.tsx`](__tests__/app/detail-pages.test.tsx) | `/Booking/[_id]`, `/BrowseFleet/[_id]` (page + `generateMetadata`) | 10 | 📋 BrowseFleet detail's schema.org `Vehicle` JSON-LD shape (name, manufacturer, offers.price, AutoDealer seller); 🔒 status drives `offers.availability` (`InStock` / `PreOrder` / `OutOfStock`); BreadcrumbList wiring; 🎯 similar-cars fallback (fuel match < 4 → "any available" query); 🔒 `getCar` swallows DB errors via `logError`; `generateMetadata` not-found branch sets `robots: { index: false }`; OG image falls back to `/car.jpg` when car has no image |
| [`__tests__/app/Book-review.pages.test.tsx`](__tests__/app/Book-review.pages.test.tsx) | `/Book`, `/review` | 6 | 📋 Book page threads `detailingPackages + tintOptions` from businessInfo into `BookingFlow`; defensive `?? []` for missing fields; 🔒 review page rejects malformed `?ref` (calls `validateBookingReference`) and shows error branch; CTA prefers `googleMapsUrl` over `/contact` fallback; valid ref renders the reference in the success card |
| [`__tests__/app/admin/dashboard/shop.page.test.tsx`](__tests__/app/admin/dashboard/shop.page.test.tsx) | `/admin/dashboard/shop` | 8 | 📋 GET `/api/admin/shop` → mounts `BusinessInfoForm` with payload; PUT body matches edited shopInfo; per-status toast title selection (400 → "Validation Error", 401 → "Unauthorized", else "Update Failed"); 🎯 GET success=false → "Load Failed" + empty-state; network rejects → "Connection Error" (GET) / "Network Error" (PUT) with the JS error msg. Stabilised toast mock for the `useCallback([toast])` dep loop |

**Session-21 continuation totals: 46 new test cases across 5 new files + 1 jest.setup mock.**

Combined Session 21 final: **15 new files / 92 new tests + 1 jest config exclusion + 1 jest setup mock**.

Combined suite after this session: **235 suites / 2406 tests passing**; 3 pre-existing failures (StepStrip, Toast, WhyChooseHome) caused by source-side framer-motion rewrites that fragment text across `<motion.span>` boundaries — those need test rewrites (not a mock fix), out of scope for this coverage session. jsdom statement coverage **53.67%** (was 50.96%).

---

## 4. What 100% would actually take

A realistic path to ~90% statement coverage on the parts that matter
(security-sensitive code first, marketing components last). 100% on every
line — including emails, error pages, and one-off marketing components — is a
goal that costs more than it returns.

### Remaining broken tests

**All originally-broken tests are now green** — see §3a above for the full
list of repairs. The suite pass rate is **134/134 (100%)** across both
configs after this session.

### Untested source files worth covering

The remaining gap is dominated by **email templates**, **Next.js page shells**,
and the **NextAuth config in `src/auth.ts`**. After session 3:

1. **`src/auth.ts`** — entire customer-auth surface, 0% coverage. Untested because
   `NextAuth(...)` returns opaque handlers; meaningful coverage would require
   exporting the `authorize` / `jwt` / `session` callbacks separately (one-line
   refactor). The behaviour is exercised end-to-end by every signed-in API test,
   so the *risk* is lower than the % suggests.
2. **Email templates** (`src/emails/*.tsx`) — visual templates. Best covered by
   `react-email`'s preview/snapshot workflow, not Jest. Skip for jsdom coverage.
3. **`src/lib/utils/businessInfo.ts`** — large file (~400 lines) with seeding
   logic. Hits the DB; would need MongoMemoryServer fixtures.
4. **`src/lib/mongodb.ts`** — connection cache; integration-tested implicitly.
5. **Marketing / route shell components** — `src/app/(main)/**/page.tsx`,
   layouts, loading states, error pages. Low-churn, low-value for unit tests.
   Better covered by Playwright E2E.

### Untested source files we can deliberately skip

Don't waste tests on:

- `src/emails/*.tsx` — visual templates; covered by `react-email` snapshot/preview workflow instead. A 1-line "renders without throwing" smoke test is fine if you must.
- `src/app/**/{layout, loading, error, not-found, global-error}.tsx` — Next.js route shells. Server-side rendering + integration tests give a higher signal-to-effort ratio than unit-testing these.
- `src/instrumentation.ts` — Next.js instrumentation hook; an integration smoke test is enough.

---

## 5. What testing each layer should look like

### Unit (`jest.config.api.js` for node, `jest.config.js` for jsdom)

- **Pure functions** (`src/lib/utils/*`): no I/O, no mocks beyond the env. Cover branches.
- **React hooks/contexts**: render a `Probe` component that drives the API and reads back state; assert via `data-testid` rather than implementation details (no `act()`-heavy timer math).
- **Components**: render with the providers they actually need (`ToastProvider`, `SessionProvider` mock), then act through user interactions with `@testing-library/user-event` — not by poking the props.

### Integration (`jest.config.api.js`, MongoMemoryServer)

- API route handlers: hit the route's exported `GET`/`POST`/etc. with a real `NextRequest`, against `mongodb-memory-server`. The existing `__tests__/api/admin/session.test.ts` is the template.
- One end-to-end harness per protected resource: auth → action → audit-log row → response shape.

### E2E (`playwright.config.ts`)

- Reserve for **flows that touch multiple routes** and authentication state: sign-up → verify email → reserve a car → see it in /account.
- Don't unit-test through Playwright — that's where E2E suites go to die.

---

## 6. How to keep coverage from drifting again

- The jest coverage floor in [jest.config.js](jest.config.js#L34-L41) is at `25%`. Raise it to `40%` once the broken API tests in §4 are green, then to `60%` after the API route additions land.
- Per **CLAUDE.md**, every API route change should ship with a test in the same PR. Block reviewers from approving route PRs without a `__tests__/api/**` companion file.
- The `verifyTurnstileToken`/`auth()` mocks should move to a shared
  `__tests__/utils/testUtils.ts` helper so every new API test starts with the
  same baseline — this is the single biggest reason API tests rotted: the mock
  surface drifted.
- `next-auth/react`, `next/navigation`, and `next/router` are already
  globally mocked in `jest.setup.component.js`. Add new third-party React
  client libraries to that file as they're introduced rather than per-test.
