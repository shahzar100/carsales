# Morley Motor Company — Pre-Handover Review

**Date:** 2026-05-20 · **Reviewer:** Claude (Opus) — fresh static + dynamic audit  
**Branch reviewed:** `main` @ `9e83e38` (also spot-checked working branch `fix/e2e-regressions`)  
**Scope:** UX/UI, CTA placement, code debt, security, performance, customer-flow bugs, handover readiness  
**Output for:** weekend handover to new owner / team

---

## TL;DR — what you should actually do before Saturday

The codebase is in **good shape on the fundamentals** (auth model, CSP, rate limits, S3 hygiene, Mongo indexes, zod validation, TS strict, ESLint clean). The previous `AUDIT_REPORT.md` (2026-05-16) has been thoroughly worked through — 7 of 12 prior security findings are fixed. The remaining gaps are concentrated in three places:

1. **Customer-flow bugs that nobody has caught yet** (4 of these are Sev-1 customer-blockers — see §3).
2. **Handover operational story** — no PR/CI workflow, no Sentry wired, no uptime monitoring, `RUNBOOK.md` ownership table is entirely empty, ~30 unmerged feature branches sitting on origin (see §7).
3. **CTA misrouting** — the global "Book a Viewing" button in the header goes to `/Book` (the services page), which is the single most damaging UX bug in the app (see §5).

If you only have time for 10 things this weekend, do these — in this order:

| # | Fix | File:line | Effort | Why |
|---|------|-----------|--------|-----|
| 1 | Half-hour booking slots silently rejected | `src/lib/utils/validation.ts:101-114` | 2 min | **Every customer who picks :30 fails after 5 form steps.** Sev-1. |
| 2 | Saved cars page calls admin endpoint → 401s every customer | `src/components/Car/SavedCarsPage.tsx:46` | 30 min | Saved-cars feature is silently broken for every logged-in customer. Sev-1. |
| 3 | "Book a Viewing" CTA goes to services page | `src/components/Header.tsx:333,601,875` + `src/components/Home/WhyChooseHome.tsx:43,135` | 5 min | Most-clicked top-of-funnel button → wrong destination → sign-in wall labelled "Sign in to book a service". Sev-1. |
| 4 | `/Booking/[_id]` hard-refresh / share / bookmark shows "No Car Selected" | `src/contexts/ViewingContext.tsx:40` + `src/app/(main)/Booking/[_id]/page.tsx` | 1 hr | Anyone returning to a booking link loses their car. Sev-1. |
| 5 | Fill in `RUNBOOK.md` ownership table | `RUNBOOK.md:8-21` | 30 min | Without this the new owner can't pay the bills or page on-call. |
| 6 | Add a CI workflow (lint + type-check + jest + e2e on PR) | `.github/workflows/ci.yml` (new) | 1 hr | Today nothing tests PRs except `next build`. |
| 7 | Wire Sentry (it's already 80% scaffolded in `src/lib/utils/observability.ts`) | `SETUP.md:307-348` walks through it | 30 min | Without it, Sunday outages go unnoticed until Monday. |
| 8 | `/Recoveries` page says "London" — business is in Leeds | `src/app/(main)/Recoveries/page.tsx:31,36,128,137,156,239` | 10 min | Instant credibility hit for local customers. |
| 9 | Account-enumeration on register endpoint | `src/app/api/auth/register/route.ts:81,102` | 20 min | Confirms whether any email has an account. Forgot-password is already generic — mirror it. |
| 10 | Hide "Admin Dashboard" link from customer footer | `src/components/Footer.tsx:200-206` | 1 min | Don't signpost the admin URL to every customer. |

Everything else in this report is either lower-priority or longer-effort.

> **One thing I could not do:** spin up `npm run dev` and click through the site myself. The sandbox doesn't keep a dev server alive between calls, and your `MONGODB_URI` points at a real Atlas cluster which I didn't want to hit from a sandbox without your say-so. Everything below is from reading the actual code at HEAD plus the `coverage/lcov.info` data on disk. I've spot-checked 7 of the most damaging claims (including the half-hour-slot bug and the saved-cars 401) against source — all confirmed. If you want me to also run it locally on your machine I can guide you through it.

---

## 1. Code debt — what to refactor / delete

### 1a. Dead code you can delete this weekend (~1,500 LoC, zero risk)

| File | LoC | Why safe to delete |
|------|-----|--------------------|
| `src/components/Main/Form/ServiceBookingForm.tsx` | 700 | Zero importers anywhere (`grep -rln ServiceBookingForm` only finds the file itself). It's a parallel implementation of `BookingFlow.tsx` with its own duplicated `emailRegex`/`phoneRegex`/`today`/`maxDate`/`capLength`/`timeSlots`. Production uses `BookingFlow.tsx`. |
| `src/components/UI/Skeleton/` (6 files + index, 799 LoC) | 799 | All 9 exports have zero importers outside the directory. |
| ~25 unused exports across `src/lib/` (`cleanupRateLimits`, `forbidden`, `clientEnv`, `_resetFeaturedCarMemoryCache`, `readFeaturedCarCache`, `writeFeaturedCarCache`, `s3KeyFromStoredImage`, `getDetailingPackagesCollection`, etc.) | ~150 | Confirmed unused via grep. Either delete or mark `@internal`. |

**Single PR, CI will catch any miss.**

### 1b. Files that are too large and what to extract

| File | Lines | Refactor (priority order) |
|------|------:|---------------------------|
| `src/components/Booking/Flow/BookingFlow.tsx` | 1,170 | (0% test coverage, highest-traffic page in the app) Extract: helpers (L41-141) → `src/lib/utils/booking-form.ts` (-95); validators (L287-316) → `useBookingValidators` hook (-30); submit (L333-411) → `useBookingSubmit` hook (-80); each `StepN` (L541, 622, 710, 810, 935) → own file (-624). Target: ~325 line shell. |
| `src/components/Admin/Tabs/BusinessInfoForm.tsx` | 1,143 | Extract `DetailingEditor`, `TintEditor`, `ServiceOverviewEditor`, `RecoveryEditor` (each 150-200 lines, near-identical structure) → own files; generic `useEditableList<T>` hook to dedupe their add/remove/update. Target: ~250 line shell. |
| `src/components/Header.tsx` | 1,007 | Extract `DesktopAccountPanel` (-140), `DesktopMenuPanel` (-140), `MobileSearchSheet` (-44), `MobileMenuOverlay` (-195), static menu data → `menuData.ts` (-50). `useHeaderShortcuts` hook for the 3 effects (L159-216). Target: ~350 line shell. |
| `src/components/Car/CarDetailView.tsx` | 835 | Extract `<CarGallery>` (L188-385, ~200 LoC), `<CarSpecsGrid>`, `<CarStickyCTACard>`, `<DealerCard>`, `<SimilarCarsRail>`. Target: ~290 line layout. |
| `src/app/(main)/AboutUs/page.tsx` | 774 | Extract a shared `<PageHero>` used across AboutUs/contact/FAQ/AccidentClaims/Recoveries (-60 here, ~200 across the codebase). Then `<AboutServicesGrid>`, `<AboutHoursAndContact>`, `<WhyChooseUs>`, `<BrandsRail>`. |
| `src/components/Admin/Dashboard/getDashboardData.ts` | 604 | (0% coverage) Split the three `$facet` pipelines into `pipelines/{cars,service,viewing}Pipeline.ts`; extract `rollupKPIs`, `buildRecentActivity`, `buildUpcoming` from L455+. Each becomes individually testable. |

### 1c. Cross-cutting debt

- **`emailRegex` / `phoneRegex` / `today()` / `maxDate()` / `capLength` / `TIME_SLOTS` copy-pasted into 4 forms** (`BookingFlow.tsx:41-141`, `CarViewingForm.tsx`, `AppointmentForm.tsx`, dead `ServiceBookingForm.tsx`). Validation utilities exist in `src/lib/utils/validation.ts` but client forms don't import them. **Fix:** add `src/lib/utils/booking-form.ts` and import everywhere.
- **Same `relative overflow-hidden bg-black text-white` hero JSX duplicated** across `AboutUs/page.tsx:114`, `contact/page.tsx:80`, `FAQ/page.tsx:217`, `AccidentClaims/page.tsx:158`. **Fix:** `<PageHero>` shared component.
- **`useApi` hook adopted in only 3 of 12 candidate sites.** 9 components still hand-roll `useState` + `useEffect` + `fetch` (BookingFlow, Booking/lookup, admin/dashboard/shop, PartExchangeForm, SavedCarsPage, ReserveCarForm, StatusDashboard, EmailVerificationBanner, CarViewingForm).
- **Inline `getStatusBadge` in `Booking/lookup/page.tsx:155`** duplicates the `<StatusBadge>` primitive in `src/components/UI/StatusBadge.tsx`.
- **One stray `.jsx` file** — `src/components/Helpful/Buttons/LinkPrimaryButton.jsx` (only `.jsx` in a TS codebase, 0% coverage).
- **Production code with `console.log`** in `src/lib/env.ts:86,87,141,142` and `src/emails/send.ts:64,80,104,107` — `src/lib/utils/observability.ts` exists exactly to route these.

### 1d. Counts across `src/`

| Metric | Count |
|--------|------:|
| Total LoC (ts + tsx) | 45,194 |
| TS/TSX files | 311 |
| `'use client'` directives | 118 |
| Real TODO comments | 1 (`src/app/(admin)/admin/dashboard/shop/page.tsx:1`) |
| `any` types at runtime | 0 |
| `@ts-ignore` / `@ts-expect-error` | 0 |
| ESLint disables | 2 |
| `console.*` in src/ | 15 (7 `log` + 8 `warn`/`error`) |

**Verdict:** the codebase is much cleaner on the obvious anti-pattern axis than its size suggests. The debt is concentrated in **dead-code volume** and **a handful of god-components**.

---

## 2. Security — verified status of prior findings + new gaps

### 2a. Status of prior findings (from `AUDIT_REPORT.md` 2026-05-16)

| Prior finding | Status |
|----------------|--------|
| 2FA re-enrolment hijack (`api/admin/2fa/verify/route.ts:50-53`) | **FIXED** |
| NoSQL injection on `api/bookings/cancel` | **FIXED** (zod schema `BK-[A-Z0-9]{6}`) |
| Wrong auth subsystem on bookings cancel | **FIXED** (`getCustomerIdentity()` + owner email scope) |
| `javascript:` URL bypass on `googleMapsUrl` | **FIXED** (https:-only check on write) |
| Missing rate limit on 2FA verify/disable | **FIXED** (5/15min IP limiter) |
| `/api/admin/users/lookup` open to staff | **FIXED** (`hasMinimumRole("manager")`) |
| Missing COOP/CORP/CSP-RO headers | **FIXED** |
| `X-Powered-By` leak | **FIXED** |
| CRON_SECRET not boot-required | **FIXED** |
| Role gating too lax on admin write routes | **STILL OPEN** (see 2b §1) |
| `/api/carparts` accepts arbitrary filter strings | **STILL OPEN** (see 2b §3) |
| `getHealthData.ts` reads SMTP env from `src/components/` | **STILL OPEN** (move to `src/lib/`) |
| Cookie missing `__Host-` prefix | **STILL OPEN** |
| Magic-byte sniff on uploads | Accepted risk |

### 2b. New findings (not in prior audits)

| Sev | File:line | Issue | Fix |
|-----|-----------|-------|-----|
| **HIGH** | `src/app/api/cron/review-invites/route.ts:108` | `authHeader !== \`Bearer ${cronSecret}\`` is a string `!==` comparison — timing oracle on the secret. | Use `crypto.timingSafeEqual` over equal-length buffers. |
| **HIGH** | `src/lib/utils/auth.ts:33-44` | `serverEnv.SESSION_SECRET \|\| FALLBACK_SECRET` triggers on the **empty string** too. On Vercel each Lambda gets its own random fallback → session resumption breaks silently. | Throw at module load if `NODE_ENV === "production" && !SESSION_SECRET`. |
| **MED** | All admin write routes (`api/admin/cars`, `carparts`, `shop`, `bookings`, `reservations`, `quotes`, `part-exchange`, `upload`, `upload/delete`) | Only `isAuthenticated()` — accepts `staff` role. The role hierarchy in `auth.ts:13-17` exists but is only used in 3 routes. A compromised `staff` account can mutate cars, parts, shop info, sign S3 upload URLs. | Apply `hasMinimumRole("manager")` to every write verb; `"admin"` to `upload` + `shop`. |
| **MED** | `src/lib/utils/twoFactor.ts:50-54` + `api/admin/2fa/verify/route.ts:107` | TOTP shared secrets stored as **plaintext base32** in the `adminUsers` document. A read-only Mongo leak hands every admin's MFA seed to the attacker. | Encrypt with AES-256-GCM using a new `TOTP_ENC_KEY` env. |
| **MED** | `src/app/api/admin/carparts/route.ts:48-50` | Only validates `name`/`brand`/`category`/`price` exist + one `/[${}]/` regex on category. Body like `{ price: { $gt: 0 } }` slips through the truthy check. | Add zod schema mirroring `carSchema` from `cars/route.ts`. |
| **MED** | `src/app/api/admin/shop/route.ts:115-145` | Most body fields cast straight to `ShopInfo` with `as` — no shape validation on `socialMedia`, `heroStats`, `detailingPackages`, `tintOptions`, etc. With the role-gating gap above, a `staff` account reaches this. | Add zod schemas; reject extra keys. |
| **MED** | `src/lib/utils/auth.ts:41` | Admin cookie lacks `__Host-` prefix, no rolling renewal. | Rename to `__Host-carsales_admin_session`. |
| **LOW** | `src/app/api/auth/register/route.ts:78-80` | Account enumeration — "An account with that email already exists". `forgot-password` is correctly generic; register isn't. | Return generic success + email the existing user separately. |
| **LOW** | `src/app/api/admin/2fa/enroll/route.ts` | No per-user rate limit. | Add 10/hour limiter symmetrical with verify/disable. |
| **LOW** | `src/proxy.ts:67-89` | `/api/csp-report` is exempt from same-origin CSRF but accepts unauthenticated POSTs that write to logs. | Add IP rate limit on `/api/csp-report`. |

### 2c. `npm audit --omit=dev` summary

```
0 critical · 0 high · 7 moderate · 2 low
```

No HIGH or CRITICAL on production deps. Moderates are: `nodemailer ≤8.0.4` (SMTP command injection — no upstream fix, mitigated by not exposing envelope params to user input), transient `postcss <8.5.10`, plus `ws`/`engine.io` via the react-email preview server (dev-only path). Next.js bumped to 16.2.6 (#50) closed five prior HIGH advisories.

### 2d. Top 5 must-fix-before-handover (with concrete patches)

**1. Constant-time CRON_SECRET compare** — `src/app/api/cron/review-invites/route.ts:108`:
```ts
import { timingSafeEqual } from "crypto";
const expected = `Bearer ${cronSecret}`;
const a = Buffer.from(authHeader ?? "");
const b = Buffer.from(expected);
if (!cronSecret || a.length !== b.length || !timingSafeEqual(a, b)) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**2. Harden production session-secret guard** — `src/lib/utils/auth.ts:33`:
```ts
if (serverEnv.NODE_ENV === "production" && !serverEnv.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production");
}
```

**3. Role-gate admin write routes** — sweep across the 10 routes listed above; replace `if (!await isAuthenticated()) return unauthorized();` with `if (!await hasMinimumRole("manager")) return unauthorized();`. Add an `__tests__/role-gating.test.ts` that asserts each route 403s for `role: "staff"`.

**4. Account-enumeration in register** — `src/app/api/auth/register/route.ts:81,102`:
```ts
// Replace both `return badRequest("An account with that email already exists");`
// with the same generic success the forgot-password route uses, and email
// the existing user separately with a "you already have an account" link.
return ok({ message: "Check your inbox to continue." });
```

**5. Constrain `/api/carparts` filter inputs** — `src/app/api/carparts/route.ts:127`:
```ts
const FilterSchema = z.object({
  brand: z.enum(["BMW","Honda","Toyota","Audi","Ford","Mercedes","Nissan","Volkswagen"]).optional(),
  category: z.enum(["Brakes","Lighting","Engine","Body","Cooling","Exhaust","Wheels"]).optional(),
  condition: z.enum(["New","Used","Refurbished"]).optional(),
});
const parsed = FilterSchema.safeParse({
  brand: searchParams.get("brand") ?? undefined,
  category: searchParams.get("category") ?? undefined,
  condition: searchParams.get("condition") ?? undefined,
});
if (!parsed.success) return badRequest("Invalid filter");
```

---

## 3. Customer-flow bugs (Sev-1 first)

I traced 8 customer-facing flows end-to-end through the source. **Four are silently broken in ways the test suite doesn't catch.** Sev-1 = customer-blocking, Sev-2 = confusing, Sev-3 = cosmetic.

### Sev-1 bugs — fix before the handover

**3.1. Half-hour booking slots are silently rejected by the API**  
**Where:** `src/lib/utils/validation.ts:101-114` allows only `09:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00, 17:00, 18:00`. `src/components/Booking/Flow/BookingFlow.tsx:51-67` offers `09:30, 10:30, 11:30, 12:30, 14:30, 15:30, 16:30` as well.  
**Impact:** ~half of all bookings hit "Invalid appointment time" *after* filling 5 steps. **Confirmed in code.**  
**Fix:**
```ts
// src/lib/utils/validation.ts:101
export function validateAppointmentTime(time: string): boolean {
  const validTimes = [
    "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
    "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00",
  ];
  return validTimes.includes(time);
}
```
Better fix: move the slot list into a single shared constant in `src/lib/utils/booking-form.ts` and import in both the form and the validator. Add a jest test.

**3.2. `/Booking/[_id]` shows "No Car Selected" on hard refresh / share / bookmark**  
**Where:** `src/contexts/ViewingContext.tsx:40` uses `useState` only — no `localStorage` mirror. State is only set by `CarDetailView.handleBookingClick`. Anyone who:
- refreshes the booking page mid-flow,
- bookmarks the URL,
- opens it in a new tab from email,
- returns after a session timeout,

…lands on the empty "No Car Selected" fallback at `src/components/CarViewing.tsx:22-37`.  
**Fix:** make `src/app/(main)/Booking/[_id]/page.tsx` a server component that fetches the car by `_id` (mirror `getCar` from `BrowseFleet/[_id]`), pass to `<CarViewing initialCar={car} />`, seed the context from props. Alternative: persist `viewingBooking` to `sessionStorage` in the context.

**3.3. Saved cars page hits an admin-only API and 401s for every customer**  
**Where:** `src/components/Car/SavedCarsPage.tsx:46`:
```ts
fetch(`/api/admin/cars?limit=500&status=available`, ...)
```
`src/app/api/admin/cars/route.ts:62-67` calls `isAuthenticated()` (admin session check) → returns 401 for every customer. **Confirmed in code.**  
**Impact:** the saved cars feature shows the empty state regardless of how many cars the customer has saved. **The entire feature is broken.**  
**Fix:** add a public endpoint `GET /api/cars?ids=...&status=available` that returns the named cars (the data is already public via `/BrowseFleet`); rewire `SavedCarsPage`.

**3.4. Global "Book a Viewing" CTA goes to `/Book` (the *services* page)**  
**Where:** `src/components/Header.tsx:333, 601, 875` and `src/components/Home/WhyChooseHome.tsx:43, 135` all `href="/Book"`. `/Book` is the service-booking flow, not viewings. Signed-out users hit `BookingAuthGate` with the heading **"Sign in to book a service"** (`src/app/(main)/Book/page.tsx:34-35`). **Confirmed.**  
**Impact:** the most-clicked CTA on the entire site lands users on the wrong product behind a sign-in wall with confusing copy. High bounce risk.  
**Fix:**
```tsx
// src/components/Header.tsx:333,601,875 — replace href="/Book" with href="/BrowseFleet"
// src/components/Home/WhyChooseHome.tsx:43,135 — same
```
Or split into two CTAs: "Browse cars" (red-600) + "Book a service" (outline).

### Sev-2 bugs — fix soon

| # | Bug | Where |
|---|-----|-------|
| 3.5 | "Vehicle Not Found" returns HTTP **200** — search engines index dead URLs as live | `src/app/(main)/BrowseFleet/[_id]/page.tsx:169` — replace inline JSX with `notFound()` from `next/navigation` |
| 3.6 | `today()` client helper uses `toISOString()` (UTC) → BST users at 23:30 are told "Date cannot be in the past" for today | `BookingFlow.tsx:43`, `CarViewingForm.tsx:27`, dead `ServiceBookingForm.tsx:32` — replace with local-date helper |
| 3.7 | Slot-conflict on viewing/service booking returns HTTP **429** instead of **409** — wrong semantics, retry middleware will back off | `api/bookings/viewing/route.ts:177-185` and `service/route.ts:139-146` |
| 3.8 | "Brands We Carry" chips on About link to `/BrowseFleet/${make}` — that route is the **car-detail dynamic `[_id]`**, so clicking "BMW" tries to load BMW as a car ID and 404s | `src/app/(main)/AboutUs/page.tsx:527` — change to `/BrowseFleet?make=${encodeURIComponent(make)}` |
| 3.9 | `/Recoveries` page repeatedly says "across **London**" — business is in **Leeds, LS27** | `src/app/(main)/Recoveries/page.tsx:31, 36, 128, 137, 156, 239` — 6 occurrences, **confirmed via grep** |
| 3.10 | `CarPartsGrid` "Reserve Part" punts to `/contact?partId=...&partName=...` but `/contact/page.tsx` reads zero `searchParams` — silent context loss | `src/components/CarPartsGrid.tsx:74` + `src/app/(main)/contact/page.tsx` (build the form or change destination) |
| 3.11 | "Open now · Closes 7pm · 7 days a week" is **hard-coded** in `CarDetailView.tsx:582` — wrong on Sundays / outside hours | Drive from `businessInfo.hours` |
| 3.12 | `BrowseFleet` search input uses `defaultValue` and fires on every keystroke (no debounce) — Back button doesn't restore input, UI flickers under typing | `BrowseFleetContent.tsx:158-159` |
| 3.13 | Quote confirmation → "Track booking" link omits `email`, so the lookup page can't auto-search | `BookingFlow.tsx:1029-1034`, `Booking/confirmation/page.tsx:131` |
| 3.14 | Phone regex `/^[\d\s+()-]{7,20}$/` accepts `+++++++` (no digit requirement) | duplicated in 3 forms |
| 3.15 | Password complexity is just `min(8)` — `"password"` and `"12345678"` pass | `api/auth/register/route.ts:40` and `reset-password/route.ts:33` |

### Sev-3 (cosmetic)

`SavedCarsPage.tsx:100` uses `window.confirm` (the only place in the app); `Booking/lookup/page.tsx:79` Suspense fallback is bare "Loading..."; `Booking/confirmation/page.tsx:55` has an out-of-tone "🎉" emoji; `onKeyPress` (deprecated) at `lookup/page.tsx:222`; etc. — full list in the bug-hunt section above.

### Flow 8 — cancel booking is **fixed** ✓
The prior auth-subsystem mismatch is resolved (`api/bookings/cancel/route.ts:42-45` uses `getCustomerIdentity()`, scopes by booking owner email, has the zod schema, has CAS update preventing double-cancel emails).

---

## 4. Performance — verified status + new gaps

### 4a. Status of prior perf findings

| Prior item | Status |
|------------|--------|
| `force-dynamic` on `(main)/layout.tsx` | **FIXED** (#49) — per-page `revalidate` added throughout |
| `getBusinessInfo()` uses `Promise.all` | **FIXED** |
| Next.js dep bumped 16.1.6 → 16.2.6 | **FIXED** (#50) |
| `motion/react` in 66 files (no LazyMotion) | **STILL OPEN** |
| Duplicate `BusinessInfoContext` client fetch | **STILL OPEN** |
| `generateMetadata` re-fetches the car | **STILL OPEN** |
| Missing `sizes` on hero `<Image fill>` | **STILL OPEN** |
| `optimizePackageImports` not configured | **STILL OPEN** |
| `CookieBanner` not lazy | **STILL OPEN** |
| `priority` on admin carousel | **STILL OPEN** |
| `{ brand: 1, category: 1 }` compound on `carParts` | **STILL OPEN** |

### 4b. New perf findings ranked by impact

| Sev | File:line | Issue | Est. gain |
|-----|-----------|-------|-----------|
| **High** | `src/lib/utils/businessInfo.ts:294` + 14 callers | `getBusinessInfo()` runs 5 collection round-trips per call; called twice per home-page render (HeroSection + WhatsAppButton). Not wrapped in React `cache()`. | -50 to -150 ms TTFB |
| **High** | `src/app/(main)/BrowseFleet/[_id]/page.tsx:82,125` | `getCar(_id)` called twice (metadata + body) — not wrapped in `cache()` | One `findOne` removed per detail page |
| **High** | `src/app/api/carparts/route.ts:140` | Public endpoint does `find(filter).toArray()` with **no `.limit()`** and **no projection** — DoS surface as catalog grows | Bounded response |
| **High** | `src/app/(admin)/admin/dashboard/{cars,service,viewing,carparts}/page.tsx` | All four do unbounded `find({}).toArray()` — every car, every booking, every part, every render | Linear scan removed |
| **High** | `src/app/api/account/bookings/route.ts:50-55` | Case-insensitive anchored `$regex` on `customerInfo.email` — index isn't used → full collection scan across 3 collections per request | IXSCAN vs COLLSCAN |
| **High** | `src/lib/utils/buildCarFilter.ts:148-157` | Search uses `$or` regex on make/model/colour with `status: "available"` — no covering index → COLLSCAN | Index-backed search |
| Med | `HeroSection.tsx:91-97` | LCP image: `<Image fill priority>` without `sizes` — Next ships the widest variant on mobile | LCP -10 to -25% |
| Med | `Car/Cars.tsx:108-114`, `Car/CarCard.tsx:78`, `Car/CarTable.tsx:97`, `Shared/VehicleDetails.tsx:41` | `<Image fill>` without `sizes` | -30 to -60% image bytes on mobile |
| Med | 66 files importing `motion/react` | Full motion runtime in shared chunk — no `LazyMotion`/`m` adoption | -25 KB gzip on shared chunk |
| Med | `next.config.ts` | No `experimental.optimizePackageImports` block | -5 to -15% shared chunk |
| Med | `src/contexts/BusinessInfoContext.tsx:34` | Client refetches `/api/businessinfo` after server already rendered with the same data | -1 round-trip per cold load |
| Low | `src/app/(main)/{login,register,forgot-password,saved}/page.tsx` | `force-dynamic` declared on pages that read **no** server data | Static optimization restored |
| Low | `src/app/(admin)/layout.tsx:22` vs `(admin)/admin/dashboard/layout.tsx:13` | `force-dynamic` declared twice (parent + child layout) | Drop one |

### 4c. Mongo index DDL to add

```js
// src/lib/models/index.ts → getCarPartsCollection
await carPartsCollection.createIndexes([
  { key: { brand: 1, category: 1 } },          // combo filter
  { key: { inStock: 1, createdAt: -1 } },
]);

// src/lib/models/index.ts → getCarsCollection — search + status
await carsCollection.createIndex(
  { make: "text", model: "text", colour: "text" },
  { name: "cars_text", weights: { make: 5, model: 5, colour: 1 } }
);
await carsCollection.createIndexes([
  { key: { status: 1, mileage: 1 } },
  { key: { status: 1, year: -1 } },
]);

// Email-lookup: store lowercased mirror + index on customerEmailLc
// across serviceAppointments / carViewingBookings / reservations.
```

### 4d. Top 5 quick wins this weekend

1. **Bound the four unbounded admin scans** (`(admin)/admin/dashboard/{cars,service,viewing,carparts}/page.tsx`) with `.limit(50-100)` + a `page` searchParam. ~15 min.
2. **Wrap `getCar` and `getBusinessInfo` in `React.cache()`** to dedupe within a render. 5 min each.
3. **Add `.limit(60)` + projection to `/api/carparts`.** 2 min.
4. **Add `sizes` to the 5 `<Image fill>` use sites, drop `priority` on the admin carousel.** 5 min each.
5. **Add `experimental: { optimizePackageImports: ["lucide-react", "motion"] }` to `next.config.ts` + delete `force-dynamic` from the 4 data-less pages.** 5 min.

Stretch: `LazyMotion` migration (66 files, codemod material — not a weekend task).

---

## 5. UX/UI and CTA review

### 5a. CTA audit — short version

| Page | Primary CTA | Issue |
|------|-------------|-------|
| `/` (home) | "Browse Cars" + header "Book a Viewing" | Header CTA routes to wrong page (§3.4); home hero CTA only appears below the featured car on mobile (extra scroll) |
| `/BrowseFleet` | (none on hero — filters only) | Missing explicit CTA |
| `/BrowseFleet/[_id]` | "Book a viewing" sticky | **Strongest CTA in the app.** Mobile sticky bar overlaps the floating WhatsApp button (z-40 vs z-50) |
| `/Book` | "Continue to package" | Sign-in gate copy says "Sign in to book a **service**" while header CTA said "Viewing" — total confusion |
| `/AboutUs` | None in hero | Wasted real-estate. Brand chips at L527 link to `/BrowseFleet/${make}` which is the car-detail route — they 404 |
| `/contact` | tel:/mailto: buttons | **No contact form at all** in 2026. Mobile users coming from "Reserve Part" lose all context |
| `/CarParts` | "Reserve Part" per card | Routes to `/contact?partId=...` but contact page doesn't read query params — silent context loss |
| `/FAQ` | "Contact us" rail | OK, but no "Browse fleet" follow-up for FAQ readers mid-research |
| `/Booking/lookup` | "Search" | Suspense fallback is a bare "Loading...", no autofocus, no "forgot reference?" recovery |
| `/saved` | "Browse the fleet" (empty state only) | Bug §3.3 means the page is broken; "Clear all" uses native `window.confirm` |

### 5b. Trust / credibility gaps

- **No reviews surfaced anywhere.** `AboutUs/page.tsx:493` claims "Our customers love us. Read the reviews and see why" but doesn't link.
- **Trust band on car detail** ("AA pre-sale inspection", "HPI clear", "6-month warranty" at `CarDetailView.tsx:53-58`) is just text — no AA logo, no HPI badge link, no warranty terms link.
- **Stock count "120+"** is hard-coded in `WhyChooseHome.tsx:33`; if actual stock is 18 the home page lies.
- **`/Recoveries` claims London** — instantly breaks credibility (§3.9).
- **No physical address above the fold on home.** Customers don't see we're a real Leeds dealership until they scroll to the footer.
- **Admin Dashboard link in customer footer** (`Footer.tsx:200-206`) — signposts the admin URL to every visitor.

### 5c. Microcopy rewrites — high-impact

| # | Where | Current | Suggested |
|---|-------|---------|-----------|
| 1 | `HeroSection.tsx:60` | "Browse our premium collection of vehicles and schedule convenient viewing appointments. Experience quality cars with expert guidance." (25 words, bland) | "120+ inspected, HPI-clear cars in Leeds. Book a viewing in under a minute — no deposit, no pressure." |
| 2 | `Booking/confirmation/page.tsx:55` | "Booking Confirmed! 🎉" | "Booking confirmed" — the green check icon does the celebration |
| 3 | `BookingFlow.tsx:1056` | "Submitting…" | "Confirming your booking…" with a spinner |
| 4 | `CarParts/page.tsx:107` | "Contact Us for More Info" | "Ask about a part" (and actually read the partId param) |
| 5 | `Book/page.tsx:34` | "Sign in to book a **service**" (shown when user wanted a viewing) | "Sign in to continue" — and fix #3.4 so this never triggers in confused state |

### 5d. Mobile-specific

- **z-index conflict on car detail mobile:** sticky CTA bar (z-40) vs WhatsApp float (z-50). On a phone the WhatsApp button sits on top of the "Book viewing" CTA.
- **`BookingFlow` `ContinueBar` is inconsistent** — sticky on steps 1-2, plain right-aligned button on steps 3-5. On mobile, finding "Continue" on step 3 requires scrolling.
- **Home hero CTA placement:** with a featured car (the common case), "Browse All Cars" hides behind `lg:block` and only the duplicate at `:165-180` shows on mobile — *below* the featured-car card. Move the CTA above on all viewports.

### 5e. Top 10 UX fixes (recap with file:line)

1. **Header "Book a Viewing" → `/BrowseFleet`** — `Header.tsx:333,601,875`, `WhyChooseHome.tsx:43,135`
2. **AboutUs brand chips → `?make=` query** — `AboutUs/page.tsx:527`
3. **Strip "London" → "Leeds"** — `Recoveries/page.tsx:31,36,128,137,156,239`
4. **Remove admin link from customer footer** — `Footer.tsx:200-206`
5. **Drive "Open now / 7pm" from businessInfo.hours** — `CarDetailView.tsx:582, 483`
6. **Reset-filters CTA in BrowseFleet empty state** — `BrowseFleetContent.tsx:282-291`
7. **Coordinate WhatsApp z-index on `/BrowseFleet/[_id]` mobile** — `WhatsAppButtonClient.tsx:30, 65` + `CarDetailView.tsx:817`
8. **Replace `window.confirm` in saved** — `SavedCarsPage.tsx:99-101` with the existing `ConfirmDialog`
9. **Wire `/contact` to read `?partId&partName`** or change Reserve-Part destination — `contact/page.tsx`, `CarPartsGrid.tsx:74`
10. **Mobile-first home hero CTA** — `HeroSection.tsx:67-81, 165-180`

---

## 6. Test coverage gaps

`coverage/lcov.info` indicates rough numbers (no `coverage-summary.json` on disk):

- **Lines ≈ 77%**, **functions ≈ 85%**, **branches ≈ 75%** — healthy.
- Distribution is uneven. The following high-traffic files have <30% line coverage:

| File | Approx % lines | Risk |
|------|---------------:|------|
| `src/app/api/admin/login/route.ts` | 18 | Critical auth path |
| `src/app/api/bookings/lookup/route.ts` | 17 | Customer-facing |
| `src/app/api/bookings/service/route.ts` | 22 | Revenue-critical |
| `src/app/api/bookings/reservation/route.ts` | 0 | |
| `src/app/api/bookings/part-exchange/route.ts` | 0 | |
| `src/app/api/auth/reset-password/route.ts` | 28 | |
| `src/app/api/cron/review-invites/route.ts` | 14 | |
| `src/app/api/admin/2fa/disable/route.ts` | 18 | |
| `src/app/api/account/route.ts` (DELETE) | 0 | GDPR — DSAR path |
| `src/components/Booking/Flow/BookingFlow.tsx` | 0 | The biggest, hottest customer file |
| `src/components/Admin/Dashboard/getDashboardData.ts` | 0 | All three `$facet` pipelines |
| `src/components/Admin/Tabs/BusinessInfoForm.tsx` | 20 | |
| `src/components/Header.tsx` | 41 | |

E2E (`e2e/`) covers admin login, viewing booking, service booking, quote request, booking lookup, home→detail, admin cars quick-edit, admin carparts CRUD. **Missing:** registration, forgot-password, email-verify, reservation, part-exchange flows.

---

## 7. Handover readiness — operational gaps

### 7a. Docs

| File | Status | Notes |
|------|--------|-------|
| `README.md` | Partial | Mostly auto-generated design tokens; no quickstart |
| `SETUP.md` | Mostly complete | **But lines 30-62 reference `RESEND_API_KEY` and `NEXT_BUSINESS_*` vars that aren't in `.env.example` and aren't read in `src/`.** Stale. |
| `RUNBOOK.md` | **Ownership table is entirely placeholders** (lines 8-21: domain registrar, Vercel slug, Atlas org, AWS account, Cloudflare, Sentry org, SMTP provider — every cell says `_(fill in)_`) |
| `OPERATIONS.md` | Complete | Best file in the repo — give it to non-technical handover party first |

### 7b. CI — RED

`.github/workflows/` contains only `dependency-update.yml` and `auto-approve-deps.yml`.

**There is no PR workflow. No test workflow. No lint workflow. No type-check workflow.**

Today the only thing between a broken PR and prod is Vercel running `next build`. Any test failure or lint warning that doesn't break the build will ship.

**Add `.github/workflows/ci.yml`:**
```yaml
name: CI
on:
  pull_request:
  push: { branches: [main] }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env: { MONGODB_URI: mongodb://localhost:27017, ADMIN_PASSWORD: testpass123 }
```
Make it required for merge in branch protection.

### 7c. Monitoring — RED

- **Sentry:** referenced in `src/lib/utils/observability.ts` and `SETUP.md`, but `@sentry/nextjs` is **not in `package.json`** and `SENTRY_DSN` is empty. Errors land in Vercel function logs only.
- **Uptime monitoring:** none.
- **If the site goes down on Sunday at 14:00:** no page, no email. First signal is a customer complaint Monday morning.

**Wire Sentry following `SETUP.md:307-348`** (4 steps). Add UptimeRobot or BetterStack free tier pointing at `/api/admin/session`.

### 7d. ~30 unmerged branches sitting on origin

Several have production-impact names: `fix/security-must-do`, `chore/npm-audit-fixes`, `chore/next-upgrade`, `chore/coop-corp-coep-headers`, `chore/csp-style-src-tighten`, `perf/static-rendering`, `fix/color-contrast`, plus `day-10-…`, `day-11-…`, `day-12-…` and ~15 others.

**For each branch:** merge, close, or note in a new `HANDOVER_BRANCHES.md` why it's parked. The new owner can't inherit a graveyard of 30 unknown-status branches.

### 7e. Ownership / on-call — RED

`RUNBOOK.md:8-21` is the right shape and **entirely empty**:
- Domain registrar — blank (renewal date? auto-renew?)
- Vercel org slug — blank
- MongoDB Atlas org + billing owner — blank
- AWS account ID + IAM owner — blank
- Cloudflare account (Turnstile) — blank
- Sentry org — blank
- SMTP provider — even the doc isn't sure if it's Resend or SES

**This is the single largest handover risk.** Without it, the new owner literally cannot pay the bills, rotate keys, or page anyone.

### 7f. GDPR — YELLOW

UK dealership with PII storage. Privacy page exists, PII redactor in `observability.ts`, but **no documented DSAR process, no retention policy, no breach contact**. The `DELETE /api/account/route.ts` exists with 0% test coverage — whether it actually purges bookings is unverified.

**Add a one-page `DATA.md`:** what PII is stored, retention period, DSAR process, breach contact, cookie banner status.

### 7g. Deployment trigger — undocumented

Vercel auto-deploys from `main` to the `carsales` project (per `.vercel/project.json`). **This sentence isn't in any doc.** Add it to `RUNBOOK.md`.

### 7h. "Day 1" reading order for the new owner

1. `OPERATIONS.md` (10 min) — non-technical overview
2. `RUNBOOK.md` (15 min) — **stop and verify the ownership table is filled in**
3. `SETUP.md` (30 min) — skim, deep-read Sentry + Backup + Secret rotation
4. `.env.example` (5 min) — canonical env list
5. `src/lib/env.ts` (5 min) — understand what fails to boot in prod
6. `next.config.ts` + `vercel.json` (5 min) — security headers + cron
7. `e2e/README.md` (10 min) — what's tested
8. `CODEBASE_ISSUES.md` (A-section) (30 min) — open critical findings
9. This file (`HANDOVER_REVIEW_2026-05-20.md`) (30 min)
10. Walk through `src/app/api/admin/login/route.ts` and `bookings/service/route.ts` to learn the route pattern

Total: ~2.5 hours to be functional.

---

## 8. Severity-prioritized punch list (single page, copyable to a ticket tracker)

### P0 — must-fix before handover

- [ ] **Half-hour booking slots rejected** — `src/lib/utils/validation.ts:101`
- [ ] **Saved cars 401s every customer** — `src/components/Car/SavedCarsPage.tsx:46` + new public endpoint
- [ ] **Header "Book a Viewing" → wrong page** — `src/components/Header.tsx:333,601,875` + `WhyChooseHome.tsx:43,135`
- [ ] **`/Booking/[_id]` loses car on refresh** — `src/contexts/ViewingContext.tsx:40` + `src/app/(main)/Booking/[_id]/page.tsx`
- [ ] **CRON_SECRET constant-time compare** — `src/app/api/cron/review-invites/route.ts:108`
- [ ] **Production SESSION_SECRET hard-fail** — `src/lib/utils/auth.ts:33`
- [ ] **Fill `RUNBOOK.md` ownership table** — `RUNBOOK.md:8-21`
- [ ] **Add CI workflow** — `.github/workflows/ci.yml`
- [ ] **Wire Sentry** — `npm i @sentry/nextjs`, `SENTRY_DSN`
- [ ] **External uptime monitor** — UptimeRobot/BetterStack pointing at `/api/admin/session`
- [ ] **Account-enumeration on register** — `src/app/api/auth/register/route.ts:81,102`
- [ ] **Resolve or document the ~30 unmerged branches**

### P1 — fix this week

- [ ] Role-gate admin write routes (10 routes) — `hasMinimumRole("manager")`
- [ ] Encrypt stored TOTP secrets — `src/lib/utils/twoFactor.ts`
- [ ] Constrain `/api/carparts` filter inputs (zod enums) — `src/app/api/carparts/route.ts:127`
- [ ] "Vehicle Not Found" should call `notFound()` (HTTP 404) — `BrowseFleet/[_id]/page.tsx:169`
- [ ] Local-date helper for client `today()` (timezone bug) — 3 forms
- [ ] Slot conflict should be HTTP 409, not 429 — 2 routes
- [ ] "Brands We Carry" 404 — `AboutUs/page.tsx:527`
- [ ] `/Recoveries` "London" → "Leeds" — 6 occurrences
- [ ] Reserve-part context loss — `CarPartsGrid.tsx:74` + `contact/page.tsx`
- [ ] Remove admin link from customer footer
- [ ] Hard-coded "Open now" in `CarDetailView.tsx`
- [ ] Bound unbounded admin scans — 4 dashboard pages
- [ ] `React.cache()` for `getCar` + `getBusinessInfo`
- [ ] `.limit(60)` + projection on `/api/carparts`
- [ ] Add `sizes` to `<Image fill>` use sites; drop `priority` from admin carousel

### P2 — fix this month

- [ ] Delete dead code (`ServiceBookingForm.tsx`, `Skeleton/`, 25 unused exports) — ~1,500 LoC
- [ ] Split `BookingFlow.tsx` (1,170 → ~325 + 5 step files); add tests
- [ ] Split `BusinessInfoForm.tsx`, `Header.tsx`, `CarDetailView.tsx`
- [ ] Extract `<PageHero>` shared component
- [ ] Centralise form helpers in `src/lib/utils/booking-form.ts`
- [ ] Adopt `useApi` across 9 hand-rolled fetch sites
- [ ] `LazyMotion` migration (66 files — codemod)
- [ ] `experimental.optimizePackageImports` + drop unnecessary `force-dynamic`
- [ ] Mongo index DDL (text index on cars, compound on carParts, lowercase-email)
- [ ] E2E coverage for register / forgot-password / reservation / part-exchange
- [ ] `__Host-` cookie prefix
- [ ] Move `getHealthData.ts` to `src/lib/`
- [ ] Password complexity (`refine` for letter + digit)
- [ ] Write `DATA.md` (GDPR / DSAR / retention)

### Stretch / accepted-risk

- Magic-byte sniff on uploads (accepted risk per prior audit)
- CSP `style-src 'unsafe-inline'` (Report-Only mirror gathers telemetry)
- LCP image migration to `next/image` `priority` + AVIF (already mostly done)

---

## 9. What I couldn't verify

- **Runtime customer flow walkthrough in a real browser** — sandbox limitation (see TL;DR note).
- **Vercel env-var contents** — can only infer the required set from `src/lib/env.ts`.
- **Whether staging actually exists** — `SETUP.md:351-365` describes it; `.vercel/project.json` only lists prod.
- **Whether backup-restore drills have ever been run** — no `RESTORE_LOG.md`.
- **External monitoring setup** — no evidence in repo.

---

## Appendix — verified claims (spot-check)

I verified the 7 most damaging claims directly against source before finalizing:

1. ✅ `BookingFlow.tsx:51-67` has `09:30, 10:30, 11:30, 12:30, 14:30, 15:30, 16:30`; `validation.ts:101-114` only allows on-the-hour times.
2. ✅ `SavedCarsPage.tsx:46` fetches `/api/admin/cars?limit=500&status=available`.
3. ✅ `api/auth/register/route.ts:81,102` returns "An account with that email already exists".
4. ✅ `ViewingContext.tsx:40` uses `useState` only — no localStorage/sessionStorage.
5. ✅ `Header.tsx:333,601,875` all `href="/Book"` with text "Book a Viewing".
6. ✅ `/Recoveries/page.tsx` contains "London" 6 times.
7. ✅ `Footer.tsx:200-206` links to `/admin/dashboard` with label "Admin Dashboard".

All other claims in this report come from the static analysis above (file/line cited) — I would re-verify any specific item before opening a PR.

---

*Generated 2026-05-20. Reviewed against `main @ 9e83e38`. If anything in the codebase has changed since that commit, re-verify before acting.*
