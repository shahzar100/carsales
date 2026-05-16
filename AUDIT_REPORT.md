# Production-readiness audit

Branch: `chore/site-audit-prod-ready` · Date: 2026-05-16

Scope: static analysis (TS + ESLint), production build, security review, performance review, UX/UI + reusability review, and ready-to-run API load-test scripts. No live load testing was executed — that requires a running prod-mode server and a target the user signs off on. Scripts are scaffolded under `scripts/load-test/`.

---

## 0. Headline

The codebase is in **good shape overall**. Auth, rate limits, CSRF, CSP-with-nonce, S3 presign with `ContentLength`, hashed reset tokens, zod validation on the high-risk write paths, lucide-react tree-shaking, recharts lazy-loaded behind the admin gate, image hygiene (no raw `<img>`), and Mongo index coverage are all already in place.

The biggest single lever in the entire audit is **one line**: `export const dynamic = "force-dynamic"` at [src/app/(main)/layout.tsx:17](src/app/(main)/layout.tsx#L17). It forces every customer-facing page to render server-side per request, even pages whose content changes once a day (FAQ, privacy, terms, Services). Removing it and adding per-page `revalidate` is the highest impact-per-effort change in this report.

After that, the work splits into three buckets:

1. **Security gaps** (5 must-fix items, none currently critical-in-the-wild)
2. **Perf wins** (mostly trimming `motion/react` from the global bundle, eliminating one duplicate fetch, and a missing image `sizes` attribute)
3. **UX consistency + reusability** (one shared `<PageHero>`, `<IconInput>`, and `<AuthShell>` + finishing the half-done Button migration would delete ~600 LoC and visibly tighten the product)

---

## 1. What I did on this branch

- Removed `src/middleware.ts` — leftover; Next 16 only accepts `proxy.ts` and was failing the build with both present.
- **Fixed all 13 TypeScript errors** (all in test-mock signatures — typed `jest.fn` arg lists for `mockRedirect`, `mockIsSaved`, `mockToDataURL`, plus a UUID branded-type cast for the `randomUUID` polyfill).
- **Fixed all 32 ESLint warnings** (23 files, mostly unused imports/vars in tests; two intentional jsx-a11y / next/img cases in test fixtures got inline disables with a justifying comment).
- Ran `npm run build` clean. `npm run type-check` and `npm run lint` both return zero issues.
- Scaffolded `scripts/load-test/` (autocannon round-robin + k6 staged ramp, ten public endpoints, no admin/write paths).
- Wrote this report.

### About the "221 problems" in VS Code

The toolchain (tsc + eslint) reports **45 real issues**, all fixed on this branch. The remaining ~176 are editor-only lints (Markdown linters, JSON schema warnings, CSS analyzers from VS Code extensions). They don't affect the build, the bundle, or CI. If you want them gone, the right next step is to add Markdown/JSON-schema config files at the project root, not to disable rules.

---

## 2. Top 10 — do these first

Ordered by impact × ease of fix.

| # | Item | Type | File / location | Why |
|---|------|------|-----------------|-----|
| 1 | Remove `dynamic = "force-dynamic"` from main layout; add per-page `revalidate` to AboutUs / FAQ / privacy / terms / Services / contact / Recoveries / AccidentClaims / CarParts / Book / home | Perf | [src/app/(main)/layout.tsx:17](src/app/(main)/layout.tsx#L17) | Flips ~12 pages from per-request Mongo round-trip to edge cache hit. Single biggest TTFB win. |
| 2 | Add `totpEnabled === false` guard on 2FA verify | Security · Medium | [src/app/api/admin/2fa/verify/route.ts:50-53](src/app/api/admin/2fa/verify/route.ts#L50-L53) | A stolen session cookie can currently overwrite the legitimate user's `totpSecret` via /enroll → /verify and lock them out. |
| 3 | Type-guard + format-check `bookingReference` on cancel | Security · Medium | [src/app/api/bookings/cancel/route.ts:21-22](src/app/api/bookings/cancel/route.ts#L21-L22) | NoSQL operator injection (`{$gt:""}`) reaches `findOne`/`updateOne`. Also fix the auth subsystem mismatch — route uses admin iron-session, so customers can't cancel their own bookings. |
| 4 | Validate `googleMapsUrl.protocol` is `https:` on write and on render | Security · Medium | [src/app/api/admin/shop/route.ts:120](src/app/api/admin/shop/route.ts#L120) + [src/app/(main)/contact/page.tsx:50](src/app/(main)/contact/page.tsx#L50) | `new URL("javascript:alert(1)")` parses cleanly. A compromised admin would ship a `javascript:` href to every public visitor. |
| 5 | Add rate limit to `/api/admin/2fa/verify` and `/api/admin/2fa/disable` | Security · Medium | [src/app/api/admin/2fa/verify/route.ts](src/app/api/admin/2fa/verify/route.ts), [src/app/api/admin/2fa/disable/route.ts](src/app/api/admin/2fa/disable/route.ts) | 6-digit TOTP brute-forceable without per-session cap. Reuse `createRateLimiter`. |
| 6 | Hydrate `BusinessInfoContext` from server data instead of re-fetching `/api/businessinfo` on mount | Perf | [src/contexts/BusinessInfoContext.tsx:34](src/contexts/BusinessInfoContext.tsx#L34) | Saves one network round-trip on every cold page load (the data was already fetched server-side to render the page). |
| 7 | Switch `motion/react` to `LazyMotion + m` in the main layout | Perf | [src/app/(main)/layout.tsx](src/app/(main)/layout.tsx) and 66 import sites under `src/components/` | Drops ~25 KB gzip off the shared chunk. Mechanical refactor. |
| 8 | Generalise `AuthShell` and reuse on `/admin/login` + `/admin/reset-password` | UX · Reuse | [src/components/Account/AuthShell.tsx](src/components/Account/AuthShell.tsx), [src/app/(admin)/admin/login/page.tsx](src/app/(admin)/admin/login/page.tsx), [src/app/(admin)/admin/reset-password/page.tsx](src/app/(admin)/admin/reset-password/page.tsx) | Three near-identical centred-card shells today. One shell, branded variant. |
| 9 | Migrate eight inline red error banners to `FormPrimitives.InfoBanner variant="error"` | UX · Reuse | `src/components/Account/{Login,Register,ForgotPassword,ResetPassword}Form.tsx`, `src/components/Admin/{AdminForm,ResetPasswordForm}.tsx`, `src/app/(main)/{,admin/}reset-password/page.tsx` | The primitive already exists. Replacing the JSX makes every form look identical. |
| 10 | Add `experimental.optimizePackageImports: ["lucide-react", "motion"]` to `next.config.ts` | Perf | [next.config.ts](next.config.ts) | One-line change, typical 5–15 % shared chunk reduction. |

---

## 3. Security findings (full)

Static review covered all 41 route handlers, auth, sessions, headers, file upload, cron, CSRF, secrets, NoSQL surface. The codebase has solid foundations (rate limits everywhere, hashed CRON_SECRET, S3 `ContentLength`-bound presign, sanitised file names, CSP-with-nonce + same-origin CSRF check in `proxy.ts`). The findings below are the gaps.

### Critical
None.

### Medium
1. **2FA re-enrolment hijack.** [src/app/api/admin/2fa/verify/route.ts:50-53](src/app/api/admin/2fa/verify/route.ts#L50-L53). With a stolen admin session, an attacker can call `/enroll` → `/verify` to overwrite the user's `totpSecret`. Guard with `user.totpEnabled === false` or require the current TOTP code on re-enrol.
2. **NoSQL operator injection on `/api/bookings/cancel`.** [src/app/api/bookings/cancel/route.ts:21-22, 46, 49, 72](src/app/api/bookings/cancel/route.ts#L21). Body fields are passed straight into `findOne`/`updateOne`. Mitigated only by the (mis-applied) admin auth gate. Type-guard + format-check the reference.
3. **Wrong auth subsystem on `/api/bookings/cancel`.** Same file — uses admin iron-session, so customers can't cancel their own bookings. Decide customer vs admin, then add ownership check or move route under `/api/admin/`.
4. **`javascript:` URL bypass on admin-supplied `googleMapsUrl`.** [src/app/api/admin/shop/route.ts:120](src/app/api/admin/shop/route.ts#L120) → rendered at [src/app/(main)/contact/page.tsx:50](src/app/(main)/contact/page.tsx#L50). `new URL("javascript:alert(1)")` is a valid URL. Pin `protocol === "https:"` on write.
5. **Missing rate limit on `/api/admin/2fa/verify` and `/api/admin/2fa/disable`.**

### Low
6. **Role gating is too lax.** Most admin routes only check `isAuthenticated()` (any of `staff`/`manager`/`admin`). `staff` can therefore mutate cars/parts/shop and sign upload URLs. Decide the `staff` policy and apply `hasMinimumRole("manager")` to write routes.
7. **`/api/admin/users/lookup` open to `staff`.** [src/app/api/admin/users/lookup/route.ts:13](src/app/api/admin/users/lookup/route.ts#L13). Enumerates the full admin user list. Restrict to `manager`+.
8. **`/api/carparts` public GET takes arbitrary filter strings.** [src/app/api/carparts/route.ts:131-140](src/app/api/carparts/route.ts#L131-L140). Constrain to enum to prevent unindexed-query DOS.
9. **`getHealthData.ts` reads SMTP secrets from inside `src/components/`.** [src/components/Admin/Dashboard/Status/getHealthData.ts:46-48](src/components/Admin/Dashboard/Status/getHealthData.ts#L46-L48). Move to `src/lib/`. One stray `"use client"` would ship credentials to the browser.
10. **Missing COOP/CORP/CSP-Report headers.** [next.config.ts](next.config.ts) — add `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and a `Content-Security-Policy-Report-Only` mirror with `report-to`.
11. **Cookie name lacks `__Host-` prefix.** [src/lib/utils/auth.ts:41](src/lib/utils/auth.ts#L41). Defence-in-depth.
12. **No server-side magic-byte sniff on image uploads.** [src/app/api/admin/upload/route.ts](src/app/api/admin/upload/route.ts). Low risk because S3 isn't served from your origin (CSP `img-src` only) and the MIME allowlist excludes SVG.

---

## 4. Performance findings (full)

### Top wins

1. **`dynamic = "force-dynamic"` on the main layout** ([src/app/(main)/layout.tsx:17](src/app/(main)/layout.tsx#L17)) makes every customer page render per-request. The layout comment cites Vercel build IPs not being on the Atlas allowlist — but `BrowseFleet` and `BrowseFleet/[_id]` already prove that ISR (`export const revalidate = N`) works around this without disabling caching globally. Per-page recommendations:

   | Page | What it awaits | Suggested `revalidate` |
   |---|---|---|
   | AboutUs | businessInfo + cars | 3600 |
   | FAQ, contact, Recoveries, AccidentClaims, Services, Book | businessInfo only | 3600 / 600 |
   | privacy, terms | businessInfo only | 86400 |
   | Services/{Tints,Detailing,Repairs} | derived data | 600 |
   | CarParts | parts collection | 300 |
   | home `(main)/page.tsx` | latest cars + featured | 60 |

2. **`motion/react` is in 66 files** including `Skeleton/*`, `Toast`, `Footer`, `PageLoader`, `CountUp`, `Button`, `EmptyState`. Many use it for a fade or hover-scale. Wrap the main layout in `<LazyMotion features={domAnimation}>` and switch every `motion.div` → `m.div`. Drops the motion runtime from ~32 KB to ~6 KB.

3. **Duplicate `BusinessInfoContext` fetch.** [src/contexts/BusinessInfoContext.tsx:34](src/contexts/BusinessInfoContext.tsx#L34) re-fetches data already loaded by the server component. Pass server data as the provider's initial value.

4. **`generateMetadata` re-fetches the car.** [src/app/(main)/BrowseFleet/[_id]/page.tsx](src/app/(main)/BrowseFleet/[_id]/page.tsx) calls `getCar(_id)` twice per request (once for metadata, once for the page body). Wrap in `cache()` from React.

5. **Missing `sizes` on the featured-car hero image.** [src/components/HeroSection.tsx:91-97](src/components/HeroSection.tsx#L91-L97). Without `sizes`, Next ships the largest variant on every viewport. Add `sizes="(max-width: 1024px) 100vw, 50vw"`.

6. **Add `experimental.optimizePackageImports: ["lucide-react", "motion"]`** to [next.config.ts](next.config.ts).

7. **Dynamic-import `CookieBanner`** with `ssr: false` from the layout — banner only renders if no consent cookie exists, no need to ship its motion + focus-trap code in first paint.

8. **Drop `priority` from `Cars.tsx` admin carousel.** [src/components/Car/Cars.tsx:114](src/components/Car/Cars.tsx#L114). Admins aren't measured by Core Web Vitals.

9. **Add `{ brand: 1, category: 1 }` compound index** on `carParts`. [src/lib/models/index.ts:314](src/lib/models/index.ts#L314).

10. **Verify `getBusinessInfo()` uses `Promise.all`** for its 5 collection reads — it's called by ~10 pages. [src/lib/utils/businessInfo.ts](src/lib/utils/businessInfo.ts).

### Already optimal (don't touch)
- `recharts` is dynamically imported behind `{ ssr: false }` in [src/components/Admin/Dashboard/LazyCharts.tsx](src/components/Admin/Dashboard/LazyCharts.tsx). The 336 KB `dbf7da220f2dd289.js` chunk only ships to admin.
- All `lucide-react` imports are named, no namespace imports anywhere.
- `qrcode` and `otpauth` are server-only (`src/lib/utils/twoFactor.ts`).
- No raw `<img>` anywhere in `src/`; every image goes through `next/image`.
- Mongo index coverage on `cars`, `serviceAppointments`, `carViewingBookings`, `adminUsers`, `quotes`, `reservations`, `partExchanges`, `auditLogs` is excellent.
- No external fonts (system stack) → zero CLS.
- Turnstile loaded lazily per-form, not globally.

### Bundle (post-build, Turbopack-hashed chunks)

| Chunk | Size | Likely contents |
|---|---|---|
| `dbf7da220f2dd289.js` | 336 KB | recharts (admin-only, lazy) |
| `87037a5848f6727d.js` | 224 KB | React framework + motion |
| `59fe30e8349f718f.js` | 132 KB | Next runtime |
| `a6dad97d9634a72d.js` | 113 KB | shared vendor |
| `2f9b31e48a8929db.js` | 111 KB | shared vendor |

`.next/static` total = 2.2 MB; `public/` = 608 KB.

---

## 5. UX / UI findings (full)

### 7 pages that need a makeover

1. **`/Booking/[_id]`** — [src/app/(main)/Booking/[_id]/page.tsx](src/app/(main)/Booking/[_id]/page.tsx). 19 lines, no hero, no breadcrumb. Empty state in [src/components/CarViewing.tsx:23-37](src/components/CarViewing.tsx#L23-L37) is a plain centred div instead of the existing `EmptyState` component. Loading state is the literal text `"Loading..."` ([CarViewing.tsx:18](src/components/CarViewing.tsx#L18)).
2. **`/Booking/lookup`** — [src/app/(main)/Booking/lookup/page.tsx](src/app/(main)/Booking/lookup/page.tsx). Inputs have no `<label htmlFor>` (lines 204, 215), search is `onClick` not `<form onSubmit>`, deprecated `onKeyPress` on one input, generic red box for errors. The file's own header comment lists these as known issues.
3. **`/admin/login` + `/admin/reset-password`** — three centred-card auth shells across customer + admin sides ([src/components/Account/AuthShell.tsx](src/components/Account/AuthShell.tsx), [admin/login/page.tsx](src/app/(admin)/admin/login/page.tsx), [admin/reset-password/page.tsx](src/app/(admin)/admin/reset-password/page.tsx)) with the same gradient + centring. Generalise one.
4. **`/Book`** — [src/app/(main)/Book/page.tsx](src/app/(main)/Book/page.tsx). 42 lines, no page hero above the 1170-line `BookingFlow`. Users arrive from a `/Services/*` CTA and lose context of which service they chose. `Suspense fallback={null}` shows nothing during the wait.
5. **`/review`** — [src/app/(main)/review/page.tsx](src/app/(main)/review/page.tsx). Invalid-ref branch (lines 36-66) is a generic "couldn't find that" panel with no brand chrome — yet customers land here from an email.
6. **`/Booking/confirmation`** — [src/app/(main)/Booking/confirmation/page.tsx](src/app/(main)/Booking/confirmation/page.tsx). `🎉` emoji in the H1 breaks the brand voice (every other page uses Lucide icons). Raw `bg-yellow-50` block instead of the existing `InfoBanner variant="warning"`. No `.ics` download.
7. **`/privacy` + `/terms`** — [src/app/(main)/privacy/page.tsx:200-222](src/app/(main)/privacy/page.tsx#L200-L222), [src/app/(main)/terms/page.tsx:248-270](src/app/(main)/terms/page.tsx#L248-L270). The section-rendering JSX is byte-identical between the two files. "Last updated: March 2026" is hard-coded.

### 10 highest-value reuse extractions

1. **`<IconInput>`** — icon-prefixed labelled input. 11 inline implementations across `Account/{Login,Register,ForgotPassword,ResetPassword}Form.tsx`, `Admin/{AdminForm,ResetPasswordForm}.tsx`, `Booking/lookup/page.tsx`.
2. **`<AnimatedErrorBanner>`** — 30 lines of motion props pasted in six form files. Fold into the existing `FormPrimitives.InfoBanner`.
3. **`<PageHero>`** — the "ambient red glow + gradient-text H1" hero pattern appears identically across 7 pages: contact, AboutUs, privacy, FAQ, terms, AccidentClaims, HeroSection. ~80 lines × 6 → one component.
4. **`<StatusPanel kind="success|error|empty">`** — five inline implementations across `LoginForm` (magic sent), `ForgotPasswordForm`, `Account/ResetPasswordForm`, `CarViewingForm` (confirmed), `Booking/confirmation`, `review`.
5. **`<FeatureCard>`** — icon-circle + title + description card. 30+ inline implementations across `AboutUs`, `AccidentClaims`, `Recoveries`, `Services`, `contact`, `FAQ`.
6. **`<LegalPageShell sections={…} />`** — `/privacy` and `/terms` collapse to data files.
7. **Generalised `<AuthShell>`** — see UX item 3 above.
8. **Migrate the three `useEffect`-with-cancelled-flag fetches to `useApi`** — `AccountDashboard.tsx:71-98`, `AccountSettings.tsx:97-118`, `SavedCarsList.tsx:27-60`. The hook's own doc-comment flags this.
9. **Finish the Button migration.** Three button primitives currently coexist: [src/components/UI/Button.tsx](src/components/UI/Button.tsx) (new), [src/components/Helpful/Buttons/Button.tsx](src/components/Helpful/Buttons/Button.tsx) (legacy, ~14 import sites), `FormPrimitives.FormButton`. Sweep to one. Watch the `customWidth` (legacy) vs `fullWidth` (new) prop rename.
10. **Tokenise Tailwind.** `tailwind.config.js` is 11 lines with `theme.extend: {}`. Brand red is hard-coded as `red-600`/`red-500`/`red-700` hundreds of times; the hero blur `h-125 w-125` arbitrary values are pasted across 7 files. Add `colors.brand`, `spacing.glow`, etc.

### Files larger than 800 LoC (split candidates)

- [src/components/Booking/Flow/BookingFlow.tsx](src/components/Booking/Flow/BookingFlow.tsx) — 1170
- [src/components/Header.tsx](src/components/Header.tsx) — 1007
- [src/components/Car/CarDetailView.tsx](src/components/Car/CarDetailView.tsx) — 835

### Accessibility quick wins

- `Booking/lookup` inputs missing `<label htmlFor>` (above).
- `Modal.tsx:142-158` default-variant close button is primary-red and competes visually with the title H2.
- `CarPartsGrid.tsx` "No Image Available" fallback is grey text in a grey box — give it an icon.
- Replace `"Loading…"` text in `CarViewing.tsx:18`, `BookingsList.tsx:59`, `SavedCarsList.tsx:63` with one shared `<InlineSpinner />`.

---

## 6. Load testing — scripts ready, not yet run

Live load testing wasn't executed in this audit — it needs a running prod-mode server and a target the user signs off on (local prod-build, staging, or production with ops approval). Scripts are now in [scripts/load-test/](scripts/load-test/):

- `scenarios.json` — ten public, GET-only endpoints (home, BrowseFleet, CarParts, Services, /api/about, /api/businessinfo, /api/carparts ± brand filter, sitemap, robots). Deliberately excludes `/api/admin/**`, write endpoints, `/api/cron/*`.
- `autocannon.mjs` — Node, no global install (uses `npx autocannon`). Round-robins through scenarios. Prints a CSV at the end you can paste into this report.
- `k6.js` — staged ramp 0 → 100 → 0 over 5 min, with thresholds `http_req_failed<1%` and `p95<500ms` so it exits non-zero in CI.
- `README.md` — how to run both flavours.

Recommended first run:

```sh
npm run build && npm run start         # in a second shell
TARGET=http://localhost:3000 node scripts/load-test/autocannon.mjs \
  --duration 30 --connections 50
```

A local dev laptop should sustain ≥1500 req/s on `/api/businessinfo` with sub-50 ms p95. Anything substantially worse confirms the static-rendering finding (every request hits Mongo).

---

## 7. Suggested next branches

To keep PRs reviewable, I'd split the follow-up work into four small branches rather than one mega-PR:

1. **`fix/static-rendering`** — Top-10 item 1 only. Layout change + per-page `revalidate`. Highest ROI, lowest risk.
2. **`fix/security-must-do`** — Top-10 items 2–5 (2FA hijack, booking cancel, googleMapsUrl, 2FA rate limit). All small, all close real (not theoretical) gaps.
3. **`perf/motion-bundle-trim`** — items 6, 7, 10 (BusinessInfoContext hydration, LazyMotion, optimizePackageImports). Mechanical but touches a lot of files.
4. **`ux/shared-primitives`** — items 8, 9, plus the UX reuse extractions. The biggest visual win; do this last since it touches the most pages and benefits from the perf branches already landing.

---

## Appendix — file changes on this branch

```
A  AUDIT_REPORT.md
A  scripts/load-test/README.md
A  scripts/load-test/scenarios.json
A  scripts/load-test/autocannon.mjs
A  scripts/load-test/k6.js
D  src/middleware.ts                     # untracked leftover blocking Next 16 build
M  35 files under __tests__/             # TS-error and ESLint-warning fixes
```

`npm run type-check` ✓ · `npm run lint` ✓ · `npm run build` ✓
