# Morley Motor Company — Pre-Handover Master Audit

**Date:** 2026-05-20 (Wed) → handover this Saturday
**Baseline:** `main` @ `9e83e38` (`HEAD == origin/main`, 0 ahead / 0 behind) + 3 uncommitted working-tree edits on disk (`KPIGrid.tsx`, `StatCard.tsx`, `models/index.ts`)
**Scope:** UX/UI · CTAs · customer-flow bugs · security · performance · code debt · handover readiness
**Method:** Six specialist sub-audits run in parallel — every customer page, every admin page, every API route traced branch-by-branch and scenario-by-scenario. Every claim cites `file:line` and was re-checked against the source on disk. No live browser walkthrough (see §12).

> **How this relates to the other reports.** Two reports already exist for today: `HANDOVER_REVIEW_2026-05-20.md` and `HANDOVER_DEEP_DIVE_2026-05-20.md`. They are good, but both are static-only and overlap heavily. This report **verifies every relevant finding in them against the current code** (confirms / corrects / marks fixed), **adds ~55 new findings they missed**, and **does the page-by-page logic-branch walkthrough they explicitly skipped**. If you read one document this weekend, read this one — §10 lists what the earlier reports got wrong so you don't waste time on non-issues.

---

## §0. Build status — read this first

`main` @ `9e83e38` **compiles and is deployable.** That is your handover baseline and it is sound.

**But the working tree on disk does NOT compile.** Three files have uncommitted edits. The edit to `StatCard.tsx` changed its `icon` prop type from `LucideIcon` to `React.ReactNode`, but `KPIGrid.tsx` was only half-migrated — 7 of its 8 `<StatCard>` calls still pass a bare component reference. `npx tsc --noEmit` fails with 7 errors (`KPIGrid.tsx:36,43,57,71,78,85,92`), and `next build` type-checks by default, so a build from this tree aborts. `StatCard.test.tsx` also fails (6 errors).

**Action:** before the handover, either (a) finish the `KPIGrid.tsx`/`StatCard.tsx`/`StatCard.test.tsx` migration so `tsc` is green, or (b) `git checkout` the 3 files to revert to main. Do **not** hand over or commit the tree in its current half-migrated state. This is the single most urgent item — nothing ships until `tsc` is clean.

---

## §1. Executive summary

Morley Motor Company is a Next.js 16 / React 19 / MongoDB full-stack dealership platform for a Leeds business. **On the fundamentals it is a genuinely good codebase** — TypeScript strict with zero `any`/`@ts-ignore` in app code, Zod validation, MongoDB partial-unique indexes for race-safe bookings, iron-session admin auth with a constant-time login path, CSP with script nonces + `strict-dynamic`, presigned S3 uploads bound to content-length, background email via `waitUntil`, a working cookie-consent banner, solid legal pages, and ~77% line test coverage. The architecture is sound and the prior team clearly knew what they were doing.

**The problem is the last mile.** The damage is concentrated where it hurts most — in the customer conversion flows and the admin tools. A casual visitor *browsing* the site will be impressed: the home page, fleet listing, car detail page and service pages are polished and professional. But the moment a customer tries to *do* something — book a service, return to a viewing link, save a car, get a finance quote, reserve a part — they hit a broken flow. And converting is the entire point of the site.

### Will the customer be satisfied?

**Browsing: yes. Converting: no — not reliably.** A first impression is good. But across the customer journey there are **13 distinct things a real customer can hit that are broken or wrong** (full list in §3.3). The worst:

- Booking a service appointment with any half-past time (`09:30`, `10:30`, …) **fails after the customer fills out all 5 steps** with "Invalid appointment time" — roughly half of all date-picked service bookings.
- Returning to a car-viewing booking link (refresh, bookmark, shared link, new tab) shows **"No Car Selected"** — the page throws away the car ID in the URL.
- The **Saved Cars** feature is 100% broken — it is also the *default tab* of the customer account dashboard, so the first thing a logged-in customer sees is an empty list regardless of what they saved.
- The car-detail finance calculator's **"Get a finance quote" button is a 404** and its **"Speak to our team" button is an empty phone link**.
- The header **"Book a Viewing"** button — the most prominent CTA on every page — goes to the wrong page *and* is invisible on phones.

So: a customer will enjoy looking, then be frustrated the moment they commit. For a dealership whose site exists to generate viewing bookings, service bookings and leads, that is the central risk to fix before handover.

### The shape of the work

| Area | Verdict |
|---|---|
| **Customer flows** | Several Sev-1 breakages; the booking funnel is fragile to any navigation interruption |
| **CTAs** | The single highest-traffic CTA is mis-routed, mis-labelled and mobile-invisible; finance CTAs 404; funnel continuity broken |
| **Admin tools** | Functional on happy paths but two flows are outright broken (user/password creation) and the cars table/list views have dead Edit/Delete buttons |
| **Security** | Fundamentals strong; ~2 Critical + ~8 High issues open, mostly access-control and rate-limit hardening |
| **Performance** | No correctness blocker; several unbounded queries and missing indexes that will bite as data grows; no `React.cache` adoption |
| **Code debt** | Concentrated in ~6 god-files and ~1,500 LOC of dead code; not alarming for the size |
| **Handover ops** | The real gap — no CI, no Sentry, no uptime monitor, empty runbook ownership table, ~30 stale branches |

### Headline numbers

| Metric | Value |
|---|---|
| TS/TSX files in `src/` | 311 · ~45,000 LOC |
| Customer + admin pages | 27 (24 customer-area, 13 admin) · ~50 API routes |
| Largest file | `BookingFlow.tsx` — 1,170 LOC (0% test coverage) |
| `main` build (`tsc`) | ✅ passes · **working tree ❌ fails (uncommitted edits)** |
| Customer-facing bugs a real user can hit | 13 (§3.3) |
| Security: Critical / High open | 2 / 8 |
| New findings beyond the two prior reports | ~55 |
| CI workflow / Sentry / uptime monitor | ❌ none / ❌ none / ❌ none |

---

## §2. The weekend plan — handover-blocker punch list (P0)

These are the items to clear before Saturday, in order. Effort estimates assume you know the codebase. Total ≈ 8–11 hours; the §11 list has P1/P2.

| # | Blocker | File:line | Fix | Effort |
|--:|---|---|---|---|
| 1 | **Working tree won't compile** | `KPIGrid.tsx:36,43,57,71,78,85,92` | Finish the StatCard icon migration (`icon={<Car className="h-6 w-6"/>}`) + fix `StatCard.test.tsx`, or revert the 3 files | 15 min |
| 2 | **Service booking rejects `:30` times** after 5 steps | `validation.ts:101-114` vs `BookingFlow.tsx:51-67` (+ `AppointmentForm.tsx:45-50`, also offers invalid `13:00`) | One shared `BOOKING_SLOTS` constant imported by every form **and** the validator | 30 min |
| 3 | **`/Booking/[_id]` loses the car** on refresh/share/bookmark | `Booking/[_id]/page.tsx` (ignores `[_id]` entirely), `ViewingContext.tsx:40` | Make the page a server component: fetch the car by `_id`, pass as `initialCar` to `<CarViewing>` | 1 hr |
| 4 | **Saved Cars feature 100% broken** (2 stacked bugs) | `SavedCarsPage.tsx:46,54` + `Account/SavedCarsList.tsx:31,38` vs `admin/cars/route.ts` | Build a public `GET /api/cars?ids=…&status=available` returning `{cars:[…]}`; rewire both consumers; delete one of the two duplicate pages | 1 hr |
| 5 | **Finance "Get a finance quote" → `/Enquiry` 404** | `Car/FinanceCalculator.tsx:74-76,199-205` | Route to `/contact` or `/Booking/[_id]` (a real route); `/Enquiry` does not exist | 10 min |
| 6 | **Finance "Speak to our team" → empty `tel:`** | `Car/FinanceCalculator.tsx:207` | Pass `businessInfo.phone` into the component and interpolate it | 15 min |
| 7 | **Header "Book a Viewing" CTA** wrong page + invisible <640px | `Header.tsx:333,601,875,336` + `WhyChooseHome.tsx:43,135` | Point at `/BrowseFleet`, relabel "Browse Cars" (or split into two CTAs); remove `hidden sm:` so it shows on phones | 30 min |
| 8 | **Sold/reserved cars still bookable** | `CarDetailView.tsx:160-170,522-545,819-826` | Gate the "Book a viewing" CTA (sticky card + mobile bar) on `car.status === "available"` | 30 min |
| 9 | **Quote (`QT-`) references can't be tracked** | `bookings/lookup/route.ts:53` rejects non-`BK-`; `BookingFlow.tsx:1030` links a `QT-` ref to lookup | Accept `QT-`/`RS-`/`PX-` in the lookup schema + query, or change the quote success link | 45 min |
| 10 | **Admin "Create New → User" & "→ Password" show empty-password cards** | `UserForm.tsx:229`, `PasswordForm.tsx:320` vs APIs that return no password | Rewrite both success screens to reflect the real email-link mechanism | 45 min |
| 11 | **Admin cars Table/List views: dead Edit/View/Delete + dead Featured toggle** | `CarActions.tsx:9-11` (404 routes), `CarTable.tsx:169-186`, `CarListCard.tsx:183-196` (no `onClick`) | Fix routes to `/admin/dashboard/cars/edit/[_id]`; wire the Delete + Featured handlers | 1 hr |
| 12 | **`/api/carparts` GET writes seed data to prod Mongo** | `carparts/route.ts:124-127` | Delete the seed block; move `seedCarParts` to `scripts/seed-carparts.ts` | 10 min |
| 13 | **Admin write routes accept `staff` role + carparts PUT mass-assignment** | `admin/carparts/route.ts:107-123` + 9 other routes on `isAuthenticated()` only | `hasMinimumRole("manager")` on the 10 write routes; Zod `.strict()` + `$`-key reject on carparts PUT | 1 hr |
| 14 | **`CRON_SECRET` timing-unsafe compare + spoofable rate-limit IP** | `cron/review-invites/route.ts:108`; `x-forwarded-for` in 13 auth routes; KV limiter fails open `rateLimit.ts:155-165` | `timingSafeEqual`; sweep `x-forwarded-for` → `ipAddress(request)`; fail-closed KV for security limiters | 1 hr |
| 15 | **`/Recoveries` + `/Repairs` + `/AboutUs` say "London"** (business is Leeds) | `Recoveries/page.tsx` ×6, `Repairs/page.tsx:186`, **and** the London-based `RECOVERY_SEED` in `businessInfo.ts:246-271` | Fix the JSX strings **and** the seed data (and any already-seeded prod doc) | 30 min |

Plus handover-ops (§9): fill the `RUNBOOK.md` ownership table, add a CI workflow, wire Sentry, add an uptime monitor, triage the ~30 stale branches. Budget another ~3 hours.

---

## §3. Customer perspective — does everything work?

Every customer page was traced branch-by-branch: every conditional render, loading/empty/error/success state, URL-param permutation, signed-in vs signed-out path, and API-response branch. The summary:

### 3.1 The five customer journeys

| Journey | Path | Works? |
|---|---|---|
| **Buy a car** | Home → BrowseFleet → Car detail → Book viewing | ⚠️ Browsing works; "Book viewing" works *on click* but **breaks on refresh/share**; sold cars wrongly bookable; finance CTAs broken |
| **Book a service** | Home/Services → `/Book` → 5-step form | ❌ **`:30` time slots rejected after step 5**; state lost on refresh; quote tracking broken |
| **Track a booking** | Header "Track Booking" → `/Booking/lookup` | ⚠️ Works for `BK-` refs; **fails for quote `QT-` refs**; must re-type email |
| **Buy a part** | `/CarParts` → "Reserve Part" | ❌ "Reserve Part" → `/contact`, which **has no form and ignores the part context** |
| **Save cars** | Heart icon → `/saved` or account tab | ❌ **Entire feature broken** (admin-only endpoint 401 + response-shape mismatch) |

Three of five journeys are broken end-to-end. Only "buy a car" (if you never refresh) and a `BK-` booking lookup are reliable.

### 3.2 Per-page customer-satisfaction verdict

| Page | Verdict | Why |
|---|---|---|
| `/` Home | 🟢 Good | Strong hero, correct primary CTA. Two `WhyChooseHome` cards mis-route to `/Book`; "120+" stock count hard-coded |
| `/BrowseFleet` | 🟢 Good | Fast URL-driven filtering, robust param handling. Search fires a server round-trip *per keystroke*; unstyled `<h1>Loading…</h1>` fallback; no hero CTA |
| `/BrowseFleet/[_id]` Car detail | 🔴 Poor | Page itself excellent — but finance "Get a quote" 404s, "Speak to our team" is a dead `tel:`, sold cars stay bookable, hard-coded "Open now/7pm" |
| `/Book` Service booking | 🔴 Poor | `:30` slots rejected after 5 steps; state lost on refresh; quote success links to broken tracking; no sticky Continue |
| `/Booking/[_id]` Viewing booking | 🔴 Poor | "No Car Selected" on any non-direct entry — the `[_id]` route segment is completely ignored |
| `/Booking/confirmation` | 🟡 Fair | Clear, but "View Booking Details" omits `email` so the customer must re-type it; "🎉" emoji in `<h1>` |
| `/Booking/lookup` | 🟡 Fair | Works for `BK-`; rejects `QT-` quote refs; no `<form>`, Enter only works in the email field |
| `/saved` | 🔴 Poor | Feature can never display a saved car; duplicated by the account "Saved cars" tab with the same defects |
| `/Services` + 3 sub-pages | 🟢 Good | Detailing/Tints/Repairs well-built, deep-links work. "Learn More & Book" misses the `#book` anchor |
| `/CarParts` | 🔴 Poor | "Reserve Online" is the page's own step 1, but there is no reservation mechanism and `/contact` can't receive the context |
| `/Recoveries` | 🔴 Poor | Says "London" ~7× and lists a coverage map of SE-England counties — instant credibility collapse for a Leeds customer |
| `/AccidentClaims` | 🟡 Fair | Strong reassuring content; "Make an Enquiry" dead-ends on the form-less `/contact`; `tel:` not space-stripped |
| `/contact` | 🔴 Poor | **No contact form at all** in 2026; ignores every inbound `?subject/part/brand` param |
| `/FAQ` | 🟢 Good | Solid — except it advertises a "Platinum" detailing package that does not exist |
| `/AboutUs` | 🟡 Fair | Well-built; brand chips 404; surfaces the London recovery data; "Read the reviews" links nowhere |
| `/privacy`, `/terms` | 🟢 Good | Genuinely solid, DB-driven legal pages |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | 🟢 Good (UX) | Smooth flows; expired-but-valid reset token gives a fill-then-fail UX; security notes in §6 |
| `/account` | 🔴 Poor | Bookings + Settings tabs excellent — but the **default** "Saved cars" tab is 100% broken |
| `/review` | 🟢 Good | The cleanest page in the app; no bugs |
| `not-found` / `error` | 🟢 Good | Clean recovery; `<h1>404</h1>` is poor screen-reader semantics |

### 3.3 The 13 bugs a customer hits directly

Ranked by severity. (Full per-page scenario tables exist in the sub-audits; this is the customer-impact distillation.)

**Critical — customer-blocking:**
1. **Service booking, `:30` time → "Invalid appointment time" after all 5 steps.** Client forms offer `09:30/10:30/11:30/12:30/14:30/15:30/16:30`; the server validator (`validation.ts:101-114`) accepts on-the-hour only. ~Half of date-picked service bookings fail at the last step.
2. **`/Booking/[_id]` → "No Car Selected"** on refresh, bookmark, shared link, new tab or session timeout. `ViewingContext.tsx:40` is in-memory only and `Booking/[_id]/page.tsx` ignores the `[_id]` URL segment entirely.
3. **Saved Cars never shows anything.** `SavedCarsPage.tsx:46` and `Account/SavedCarsList.tsx:31` call the admin-only `/api/admin/cars` → 401 for every customer; *and even if that were fixed*, both read `data.cars` while the endpoint returns a bare array → still empty (`SavedCarsPage.tsx:54`). It is the default account tab.
4. **Finance "Get a finance quote" → 404.** `FinanceCalculator.tsx:74` links to `/Enquiry`, which does not exist as a route.

**High:**
5. **Finance "Speak to our team" → empty `tel:` link** (`FinanceCalculator.tsx:207`) — does nothing on mobile.
6. **Header "Book a Viewing"** (`Header.tsx:333,601,875`) → `/Book`, the *service* flow, behind a gate that says "Sign in to book a **service**"; and it is `hidden sm:inline-flex` so it does not exist on phones <640px.
7. **Sold/reserved cars still show the full "Book a viewing" CTA** (`CarDetailView.tsx:160-170,522,819`) — a customer can book a viewing for a car that is already sold.
8. **Quote tracking broken.** A submitted quote yields a `QT-` reference and the success screen links it to `/Booking/lookup`, which rejects anything not matching `BK-` (`bookings/lookup/route.ts:53`).
9. **"Reserve Part" dead-ends.** `CarPartsGrid.tsx:74` → `/contact?subject=…&part=…&brand=…`; `/contact` has no form and reads no params. The parts-reservation funnel cannot complete.
10. **"Brands We Carry" chips 404.** `AboutUs/page.tsx:528` links each make to `/BrowseFleet/{make}`, which is the car-detail `[_id]` route — `getCar("BMW")` fails → not-found.
11. **"London" on a Leeds business.** `/Recoveries` (6×), `/Repairs` (`page.tsx:186`), and `/AboutUs` all show London — *and the seed data itself* (`businessInfo.ts:246-271` `RECOVERY_SEED`) lists London boroughs + "30-45 minutes within London". Fixing the visible strings is not enough; the seeded DB data must change too.

**Medium:**
12. **`/contact` has no contact form.** In 2026 every written enquiry is forced into the customer's own email client, and every inbound deep-link (parts, accident claims) lands stripped of context.
13. **FAQ advertises a non-existent product.** `FAQ/page.tsx:108` describes a "Platinum correction detail"; the seeded packages are only Bronze/Silver/Gold. A customer asking for Platinum cannot get it.

### 3.4 Other customer-facing UX issues (lower severity)

- Booking-flow state lives in `useState` with no URL step and no `sessionStorage` — refresh/accidental-back at step 4 wipes everything to step 1 (`BookingFlow.tsx:201-213`).
- After a successful booking the StepStrip **Back button stays live**, letting the customer navigate back into a stale form and re-submit (`BookingFlow.tsx:446`, `StepStrip.tsx:31`).
- None of the booking forms gate Submit on the Turnstile token — if the token has not arrived, the form POSTs `undefined` and fails with "CAPTCHA verification failed" after the whole form (`BookingFlow.tsx:334`, `CarViewingForm.tsx:288`, `ReserveCarForm.tsx:88`, `PartExchangeForm.tsx:85`).
- Saving a 51st car silently no-ops with no feedback (`SavedCarsContext.tsx:175-184`).
- "Vehicle Not Found" renders at **HTTP 200**, not 404 — search engines index dead car URLs as live (`BrowseFleet/[_id]/page.tsx:169`).
- Slot conflicts return **HTTP 429** instead of 409 — wrong semantics; retry/back-off middleware will misbehave (`bookings/viewing/route.ts:182`, `service/route.ts:144`).
- Confirmation "Track booking"/"View Booking Details" links omit `email`, forcing a re-type (`confirmation/page.tsx:132`, `BookingFlow.tsx:1030`).
- `tel:` links on `/contact` and `/AccidentClaims` are not space-stripped (`tel:0113 468 9292`) — some Android dialers mis-parse this (`contact/page.tsx:105,138`, `AccidentClaims/page.tsx:184,430`).
- Quote and part-exchange enquiries never appear in the customer's account dashboard, even though they are tied to the account email (`account/bookings/route.ts:76-113`).
- Expired-but-well-formed password-reset tokens render the full form, let the customer fill it, then fail on submit with no prominent "request a new link" CTA (`reset-password/page.tsx`).

---

## §4. CTA placement and usage

### 4.1 The core problem

The site has **two booking products with confusable names** — `/Book` (service booking) and `/Booking/[_id]` (car-viewing booking) — and the navigation does not keep them straight. "Book a Viewing" appears **three times in the header** and **twice in `WhyChooseHome`**, and **all five point at `/Book`** (the service flow). The intended viewing funnel is `BrowseFleet → /BrowseFleet/[_id] → /Booking/[_id]`; the header CTA bypasses it into the wrong product, behind a sign-in gate whose heading literally contradicts the button the user just clicked.

This is the highest-traffic CTA in the app and it fails on three axes at once: **wrong destination, wrong label, and invisible on mobile** (`hidden sm:inline-flex`, `Header.tsx:336`).

**Recommended fix:** make the header CTA `→ /BrowseFleet` labelled "Browse Cars", or split it into "Browse cars" (red primary) + "Book a service" (outline). Show it at all breakpoints.

### 4.2 Per-page CTA table

| Page | Primary CTA | Routing OK? | Issue | Severity |
|---|---|---|---|---|
| `/` Home | "Browse Cars" → `/BrowseFleet` | ✅ | Header "Book a Viewing" → `/Book` wrong; `WhyChooseHome.tsx:43,135` → `/Book` | Critical |
| `/BrowseFleet` | — (filters only) | n/a | No CTA in hero; hero badge "Book a Viewing Online" looks clickable, is inert text; empty state has no reset CTA | High |
| `/BrowseFleet/[_id]` | "Book a viewing" sticky | ✅ on click | Loses car on refresh; finance CTAs 404 / empty `tel:`; mobile sticky bar covered by WhatsApp button (z-40 < z-50) | High |
| `/Book` | Step "Continue" | ✅ | Inbound labels say "Viewing" but page is *services*; gate copy mismatch; Continue never sticky | High |
| `/Booking/[_id]` | `CarViewing` submit | ⚠️ | Car lost on hard entry → "No Car Selected" | Critical |
| `/Booking/confirmation` | "View Booking Details" | ✅ | Omits `email`; "Browse More Cars" styled equal weight (competes) | High |
| `/Booking/lookup` | "Search" | ✅ | No `<form>`; Enter only works in email field; bare "Loading…" fallback | Medium |
| `/AboutUs` | none in hero | ❌ | Brand chips → `/BrowseFleet/{make}` → 404; "Read the reviews" links nowhere | High |
| `/contact` | tel:/mailto: | ✅ | No contact form; drops inbound `?part`/`?subject` context | High |
| `/CarParts` | "Reserve Part" per card | ❌ | → `/contact` (no reservation, no form); button `size="sm"` <44px touch target | High |
| `/Services` | "Start booking" → `/Book` | ✅ | "Learn More & Book" → sub-page with no `#book` anchor → lands at top | Medium |
| `/Services/Detailing,Tints,Repairs` | "Book …" → `/Book?service=…` | ✅ | Correctly passes `?service=`; well done | — |
| `/Recoveries` | "Call Now" tel: | ✅ | CTA fine; copy says "London" | Medium |
| `/AccidentClaims` | "Call Now" tel: | ✅ | "Make an Enquiry" → form-less `/contact`; two near-identical CTA blocks | Medium |
| `/FAQ` | "Contact Us" → `/contact` | ✅ | No "Browse fleet"/"Book a viewing" follow-up for research-stage readers | Low |
| `/saved` | "Browse the fleet" (empty state) | ✅ | Page broken (§3.3 #3); "Clear all" uses native `window.confirm` | Critical |
| `/review` | "Leave a Google review" | ✅ | Good | — |

### 4.3 Funnel & placement observations

- **Funnel continuity is broken at step 1** — the top-of-funnel CTA on every page routes into the wrong product.
- **The footer has no CTA at all** — only plain link columns (`Footer.tsx:111-225`). Bottom-of-page conversion is missed sitewide. Add a CTA card row above the column grid.
- **`/BrowseFleet` and `/CarParts` have no closing CTA.**
- **Context loss between pages** — `/CarParts` "Reserve Part" and `/AccidentClaims` "Make an Enquiry" both funnel to `/contact`, which has no form and reads no params, so the funnel dead-ends.
- **Inert elements that look like CTAs** — hero "badge" chips on `/BrowseFleet`, `/CarParts`, `/Services` look interactive but are plain text; `CarDetailView.tsx:474` "See all N features" is styled as a red link with a chevron but has no handler.
- **Competing CTAs** — the confirmation page styles "Browse More Cars" with the same weight as the red primary; give secondaries an outline/ghost style.

---

## §5. UX / UI

### 5.1 Accessibility (WCAG 2.1 AA)

**Wins:** skip-to-content link, `Modal.tsx` has a full focus trap + restore, toasts have `aria-live="polite"` + `role="alert"`, form labels use `htmlFor`, the design-token `caption`/`label-sm` colours were already contrast-fixed to `gray-600`.

**Gaps:**

- **No global `prefers-reduced-motion` handling.** `globals.css` has zero reduced-motion guards and there is no `<MotionConfig reducedMotion="user">` — all 67 `motion/react` importers plus the `skeleton-shimmer`/`mm-pop` keyframes animate unconditionally, including infinite animations (WhatsApp pulse ring, ContinueBar arrow bounce). WCAG 2.3.3 + a vestibular-safety concern. Fix: wrap the app in `<MotionConfig reducedMotion="user">` and add a global `@media (prefers-reduced-motion: reduce)` block. (`Book/booking-flow.css` already does this locally — just generalise it.)
- **Signed-out `/Book` and `/Booking/[_id]` have no `<h1>`.** `BookingAuthGate.tsx:71` renders the prompt as `<h2>`; `CarViewing.tsx:25` renders "No Car Selected" as `<h2>`. Screen-reader users get no page-level heading.
- **WCAG AA contrast failures** — `text-gray-400` (~2.5–2.85:1) on light backgrounds in `BrowseFleetContent.tsx:282,285` (empty state), `not-found.tsx:12`, `CarPartsGrid.tsx:203`. The `caption` token was fixed for exactly this reason; these inline call sites were missed. Bump to `gray-600`.
- **Account dashboard tabs** (`AccountDashboard.tsx:127-215`) are an incomplete ARIA tabs pattern — `role="tab"`/`aria-selected` present, but no `aria-controls`, no `role="tabpanel"`/`id`/`aria-labelledby` on the panel, no arrow-key navigation.
- **FAQ accordion** (`FAQAccordion.tsx:37-66`) has `aria-expanded` but no `aria-controls` and the panel has no `id`/`role="region"`.
- **`role="menu"` without `role="menuitem"`** on the header desktop dropdown panel — incorrect ARIA.
- **CookieBanner contradiction** — declares `aria-modal="false"` (`CookieBanner.tsx:163`) but installs a Tab-key focus trap (`:98-115`). Keyboard users cannot Tab out to the page — a WCAG 2.1.2 keyboard trap. Either make it a true modal or stop trapping.
- **Confirmation success not announced** — booking success is conveyed only by a green icon + heading; the reference card has no `role="status"`.
- **`not-found.tsx:8`** `<h1>404</h1>` — a screen reader announces "four hundred and four". Make the `<h1>` text and the number decorative.
- **Touch targets <44px** — "Reserve Part" (`CarPartsGrid.tsx:186`, `size="sm"`), header mobile-search button (`Header.tsx:319`, 40px), `/saved` "Clear all".

### 5.2 Design system

- **Split source of truth.** `globals.css` is Tailwind 4 (`@import "tailwindcss"`), but a legacy v3-style `tailwind.config.js` with an empty `theme.extend` also exists. `globals.css:10-18` deliberately removed all `--color-*` variables, so there are **no colour tokens** — every component hard-codes `bg-red-600`, `bg-[#0a0a0a]`, `bg-[#171717]`, `#25D366`, etc. `design.md` documents a full palette that exists *only as prose*. A rebrand or dark mode would mean editing hundreds of literals. Fix: define the palette as Tailwind 4 `@theme` tokens.
- **Mis-named utilities.** `.page-title`/`.section-title` bake in `text-red-600`, but several pages override it back with `text-gray-900!` (`AboutUs/page.tsx:197,282,450`) — the `!important` overrides are a smell showing the token is wrong. `.badge-blue` was already renamed to `.badge-brand` (good).
- **Z-index is undocumented and collision-prone.** Observed ladder: Header `z-60` → mobile search `z-70` → mobile menu `z-80` → Modal `z-100` = CookieBanner `z-100` → skip-link `z-200` → Toast `z-999999`; meanwhile WhatsApp button, the hero `<section>`, the desktop dropdown and `PageLoader` all sit at `z-50`. Confirmed/likely collisions: car-detail mobile sticky CTA (`z-40`) sits *under* the WhatsApp button (`z-50`); CookieBanner (`z-100`) can overlay an open Modal (`z-100`). The hero `z-50`/WhatsApp `z-50` interaction is disputed between two of my sub-audits — it is a 1-minute fix (drop the hero's `z-50`) and worth a 30-second visual check regardless. Define a documented z-index ladder.
- **Four Button primitives.** `UI/Button.tsx` (the intended unified one — only **7** call sites, all in `Account/*`), `Helpful/Buttons/Button.tsx` (legacy — **20** call sites including customer-facing pages), `FormPrimitives` `FormButton` (used by `BookingFlow` + all admin/account forms), plus dead `LinkPrimaryButton.jsx` and `ShopButton.tsx` (0 call sites each). They have divergent sizes/variants, so adjacent buttons render at different heights. Finish the migration to `UI/Button`, delete the two dead files.

### 5.3 Trust & credibility

- **No reviews or testimonials anywhere**, despite `AboutUs/page.tsx:496` copy "Read the reviews and see why". Either wire a reviews source or remove the copy.
- **Hard-coded claims** — `WhyChooseHome.tsx` "120+" vehicles, "4.9" rating, "25+ years"; `AboutUs` "thousands of customers". Every one is a liability if untrue. Drive the stock count from a live count or `businessInfo`.
- **Trust band on car detail** ("HPI clear", "6-month warranty", "AA pre-sale inspection", `CarDetailView.tsx:53-58`) is plain text with no logos or evidence links.
- **`/Recoveries` "London"** — covered in §3.3 #11; the single biggest credibility hit.
- **Admin Dashboard link in the customer footer** (`Footer.tsx:200-206`) — signposts the admin URL to every visitor. Remove it.
- **Hero stats can flash `undefined`** before `heroStats` loads (`HeroSection.tsx:188-213`). Generic hero copy (`HeroSection.tsx:60-63`) — lead with proof and the Leeds location.

### 5.4 Loading / empty / error states

- A purpose-built `UI/Skeleton/` set (6 components, ~799 LOC) exists with **zero importers** — dead code. `DashboardSkeleton` likewise exported, never used.
- The `BrowseFleet` Suspense fallback is a bare unstyled `<h1>Loading…</h1>`; the booking-lookup fallback is bare "Loading…". No house style for loading microcopy.
- `EmptyState.tsx` is well-built but several pages hand-roll their own empty states (`BrowseFleetContent`, `CarPartsGrid`, `SavedCarsPage`) — the BrowseFleet one has no reset CTA and fails contrast.
- **No `error.tsx` in `src/app/(main)/` or `src/app/(admin)/`.** A render throw in any customer or admin page shows the unbranded default Next.js error screen with no recovery CTA. Admin pages do a lot of server-side `find()` — a Mongo hiccup crashes the whole dashboard chrome.

### 5.5 Responsive / mobile

- Header "Book a Viewing" CTA invisible <640px (§4).
- Car-detail mobile sticky CTA bar covered by the WhatsApp button (z-index, §5.2).
- `BookingFlow` "Continue" is never sticky (the prior reports' "sticky on steps 1-2" claim is wrong — see §10) → on mobile the customer scrolls to find it on every step.
- `CarPartsGrid` part image uses fixed `width={300} height={192}` stretched with `h-full w-full` → aspect mismatch + CLS; no `sizes`.
- Sub-44px touch targets (§5.1).

---

## §6. Security

The security fundamentals are strong. Issues are concentrated in **access control** and **rate-limit hardening**.

### 6.1 Critical

- **C1 — `/api/carparts` GET writes seed data to production Mongo.** `carparts/route.ts:124-127` — a public, unauthenticated GET runs `insertMany(seedCarParts)` (8 mock parts) whenever the collection is empty. If staff ever clear the collection to re-import real stock, the next page-load or a `curl` reseeds fake inventory onto the live storefront. Delete the block; move seeding to `scripts/`.
- **C2 — Mass-assignment / NoSQL operator injection on `admin/carparts` PUT.** `admin/carparts/route.ts:107-123` — `const {_id, ...updateData} = body; $set: {...updateData}` with no Zod, no `$`-key strip. Any authenticated session that satisfies `isAuthenticated()` (i.e. `staff`+ — see H1) can spray arbitrary fields onto a part, persist operator-shaped values, and break the public catalog. Use `carPartSchema.partial().strict()` and reject `$`-prefixed keys.

### 6.2 High

- **H1 — Admin write routes accept the low-privilege `staff` role.** `admin/cars`, `admin/carparts`, `admin/shop`, `admin/bookings`, `admin/bookings/cancel`, `admin/upload`, `admin/upload/delete`, `admin/reservations`, `admin/quotes`, `admin/part-exchange` all gate on `isAuthenticated()` only. The `ROLE_HIERARCHY` and `hasMinimumRole()` exist and are used correctly in `admin/users/*` and `/audit` — just not these. The product's *own* UI defines "Staff = view-only" (`UserForm.tsx:118-124`), so this contradicts the stated permission model. A compromised `staff` cookie can rewrite the storefront, cancel bookings, and mint S3 upload URLs. This is the multiplier that makes C2 and several Mediums reachable from `staff`. Apply `hasMinimumRole("manager")` to all 10 (and `"admin"` to `upload`+`shop`).
- **H2 — `CRON_SECRET` compared with non-constant-time `!==`.** `cron/review-invites/route.ts:108`. Timing oracle on the secret. Use `crypto.timingSafeEqual`.
- **H3 — Rate limiters trust client-controlled `x-forwarded-for`.** 13 auth/account routes read `headers.get("x-forwarded-for").split(",")[0]` — the first hop, which on Vercel is attacker-supplied. Rotating the header bypasses every login / TOTP / password-reset / registration limiter. The booking routes already use `ipAddress(request)` from `@vercel/functions` correctly — sweep the auth routes to match.
- **H4 — KV rate-limiter fails OPEN.** `rateLimit.ts:155-165` — any KV error returns `{allowed:true}`. One Upstash blip disables every limiter site-wide; an attacker can induce it by exhausting the KV quota. Fail **closed** for security limiters (login, 2FA, password actions).
- **H5 — Admin upload-signing endpoint has no rate limit** and `sanitizeFileName` does not cap length / normalise unicode (`admin/upload/route.ts`). A `staff`/admin session can mint unlimited 10 MB presigned PUTs → unbounded S3 cost.
- **H6 — GDPR: account deletion leaves customer PII in bookings.** `DELETE /api/account` (`account/route.ts:24-46`) removes the `users`/`accounts`/`verification_tokens` rows but not the booking records, which retain name/email/phone indefinitely. Also: no rate limit, no password/re-auth confirmation. Anonymise booking PII to tombstones on delete; add a limiter + re-auth. (Note: the prior reports' "leaves orphaned `sessions` rows" sub-point is moot — this app uses JWT sessions, there is no `sessions` collection.)
- **H7 — `admin/bookings` GET over-returns PII.** `admin/bookings/route.ts:38-49` returns whole booking docs (email, phone, notes) with no projection — combined with H1, a `staff` session exfiltrates the full customer PII set in two requests.
- **H8 — `account/bookings` does 3× unindexed `$regex` scans.** `account/bookings/route.ts:53-58` — case-insensitive anchored `$regex` on `customerInfo.email` cannot use the plain index → COLLSCAN across 3 collections on every authenticated dashboard load. DoS amplification. Store a lowercased `customerEmailLc` mirror and exact-match it.

### 6.3 Medium / Low (summary)

NextAuth Credentials provider is an account-enumeration timing oracle — no dummy-hash path (`auth.ts:141-149`); register route enumerates accounts (`register/route.ts:81,102`); TOTP secrets stored as plaintext base32 (`twoFactor.ts:42`); `admin/shop` PUT `as`-casts unvalidated nested objects (`shop/route.ts:156-175`); admin booking-cancel writes no audit row; `forgot-password` can be used to email-bomb across IPs; CSRF same-origin check skipped for *all methods* on `/api/cron/*`; admin cookie lacks `__Host-` prefix and has no rolling renewal; password complexity is `min(8)` only (`"12345678"` passes); 13 production `console.*` calls leak SMTP user / email subjects / message IDs to stdout (`emails/send.ts`, `env.ts`, `mongodb.ts`, `auth.ts`). `npm audit --omit=dev`: 0 critical / 0 high / 6 moderate / 3 low — none reachable in a production path.

### 6.4 Defenses that are correct — do not regress

Admin login uses a dummy bcrypt hash for a constant-time path; booking-cancel uses compare-and-set to prevent double emails; the cron job claims rows atomically before sending; S3 presigned PUTs bind `ContentLength`; `env.ts` hard-throws in production on missing `SESSION_SECRET`/`AUTH_SECRET`/`CRON_SECRET`; booking routes use real client IPs; NoSQL injection is closed on `admin/login`/`bookings/cancel`/`bookings/lookup`; slot-uniqueness is enforced by DB partial-unique indexes; the admin dashboard layout has a server-side auth gate; CSP uses script nonces + `strict-dynamic`; customer bookings overwrite the form email with the authenticated account email.

---

## §7. Performance

No correctness blocker, but several issues scale badly as data grows.

### 7.1 Database & queries

- **Unbounded `find({})`** with no `.limit()` / no projection: `/CarParts` server page (`CarParts/page.tsx:29`), `/api/carparts` GET, `/api/admin/carparts` GET, and the admin `cars`/`service`/`viewing` dashboard pages. The admin `cars` page is the worst — it does *two* unbounded scans (cars + entire viewings collection) run sequentially.
- **`admin/cars` GET** runs `countDocuments` then `find` sequentially — should be `Promise.all` (every other admin list route already does).
- **`getFacets()`** on `/BrowseFleet` does a full available-cars projection scan + JS dedup on every request, in parallel with the paginated query — roughly doubling the cars-collection read per page hit. Use `distinct()` + `unstable_cache`.
- **`bookings/lookup`** does two sequential `findOne` calls — should be `Promise.all`.
- **Search COLLSCAN** — `buildCarFilter.ts:151-159` does `$or` regex on make/model/colour with no text index.

### 7.2 Missing Mongo indexes

```js
// carParts — every list query sorts by createdAt; nothing indexes it
{ brand: 1, category: 1 }   { inStock: 1, createdAt: -1 }
// quotes — filtered by status, sorted by createdAt
{ status: 1, createdAt: -1 }
// bookings — admin GET sorts createdAt with filter {}
{ createdAt: -1 } on serviceAppointments + carViewingBookings
// cars — search
{ make: "text", model: "text", colour: "text" }
// + a lowercased customerEmailLc field/index on the 3 booking collections (see H8)
```

Note also that index creation runs *in the request path* on cold start (every `get*Collection()` getter calls `createIndexes`) — consider moving to `src/instrumentation.ts`. And `reconcileAdminEmailIndex` (in the uncommitted `models/index.ts` edit) runs `listIndexes`/`dropIndex` on every cold start — remove it once it has run once in prod.

### 7.3 Caching

- **`React.cache` is used nowhere in the codebase.** `getBusinessInfo()` (~10 Mongo ops per call) runs **twice per home render** (HeroSection + WhatsAppButton), and `BusinessInfoContext` then client-fetches the *same* data a third time for the Footer. `getCar()` runs twice per car-detail render (metadata + body). Wrap both in `React.cache`; make the Footer a server component fed by `getBusinessInfo()` and delete `BusinessInfoContext`.

### 7.4 Bundle / client

- 67 files import `motion`/`motion/react`; no `LazyMotion` / `m` adoption anywhere → the full motion runtime is in the shared chunk on every route.
- `next.config.ts` has no `experimental.optimizePackageImports`, no `images.formats: ["image/avif","image/webp"]`, no `images.minimumCacheTTL`.
- `priority` is set on the 100×100 Header logo (never the LCP element — de-prioritises the real LCP image) and on the admin car carousel.
- 5 `<Image fill>` sites have no `sizes` (`HeroSection.tsx:94`, `Cars.tsx:112`, `CarCard.tsx:78`, `CarTable.tsx:97`, `VehicleDetails.tsx:41`) — mobile ships desktop-width images. (`CarDetailView` already has `sizes` — the prior reports said it didn't; see §10.)
- `CookieBanner` is statically imported into the layout, pulling motion into the shared chunk — lazy-load it with `next/dynamic({ssr:false})`.
- `force-dynamic` on data-less pages (`forgot-password`, `reset-password`, `saved`) and declared twice in the admin layout chain.

### 7.5 Quick wins this weekend (≈45 min total)

Wrap `getCar` + `getBusinessInfo` in `React.cache`; add `.limit()` + projection to `/CarParts` + `/api/carparts` + the admin scans; add the three missing compound indexes; add the `next.config.ts` perf block; drop `priority` from the logo + carousel and add `sizes` to the 5 images.

---

## §8. Code debt

The codebase is cleaner than its size suggests — 0 `any` in app code, 0 `@ts-ignore`, 2 ESLint disables, 1 real TODO. Debt is concentrated in **god-files** and **dead code**.

### 8.1 Largest files (exact `wc -l`)

| LOC | File | Refactor |
|---:|---|---|
| 1,170 | `Booking/Flow/BookingFlow.tsx` | 0% coverage, highest-traffic flow. Extract helpers → `lib/utils/booking-form.ts`, validators → `useBookingValidators`, submit → `useBookingSubmit`, each `StepN` → own file. Target ~325-line shell |
| 1,143 | `Admin/Tabs/BusinessInfoForm.tsx` | Extract `DetailingEditor`/`TintEditor`/`ServiceOverviewEditor`/`RecoveryEditor`; generic `useEditableList<T>` hook |
| 1,007 | `components/Header.tsx` | Extract `DesktopAccountPanel`, `DesktopMenuPanel`, `MobileMenuOverlay`; static menu data → `menuData.ts` |
| 835 | `Car/CarDetailView.tsx` | Extract `<CarGallery>`, `<CarSpecsGrid>`, `<CarStickyCTACard>`, `<DealerCard>`, `<SimilarCarsRail>` |
| 774 | `AboutUs/page.tsx` | Extract a shared `<PageHero>` (reused by contact/FAQ/AccidentClaims/Recoveries) |
| 700 | `Main/Form/ServiceBookingForm.tsx` | **Delete — dead code, zero importers** |
| 604 | `Admin/Dashboard/getDashboardData.ts` | 0% coverage. Split the 3 `$facet` pipelines into `pipelines/*.ts` |

Refactoring the god-files is **not** a handover-weekend task — they are 4–6 hours each and risky in a handover window. Put them on the debt register; do the dead-code deletion (below) instead, which is zero-risk.

### 8.2 Dead code (~1,500 LOC, safe to delete in one PR)

`Main/Form/ServiceBookingForm.tsx` (700 LOC, zero importers — production uses `BookingFlow.tsx`); `UI/Skeleton/` (6 files, ~799 LOC, zero external importers); `Helpful/Buttons/LinkPrimaryButton.jsx` (the only `.jsx` in a TS codebase, 0 importers) and `ShopButton.tsx` (0 importers); `Services/Repairs/EmergencyBanner.tsx` and `Services/Common/ContactSection.tsx` (exported from barrels, imported by no page — and `ContactSection` has latent white-on-white styling); `/api/carparts` and `/api/about` routes (zero callers in `src/` — and `/api/carparts` is the prod-seeding hazard C1); the `clientEnv` export; `DashboardSkeleton` (exported, never used); the `Dropdown/` nav components (admin-only, superseded by `Header.tsx`).

### 8.3 Duplication & consistency

- **Five inconsistent appointment-slot lists** — no two identical (`validation.ts`, `BookingFlow.tsx`, `CarViewingForm.tsx`, `AppointmentForm.tsx`, dead `ServiceBookingForm.tsx`). This *is* the §3.3 #1 customer-blocking bug. One exported `BOOKING_SLOTS` constant fixes the bug and the debt together.
- `emailRegex`/`phoneRegex`/`today()`/`maxDate()`/`capLength` copy-pasted into 4 forms — and the client copies differ from the server ones in `validation.ts`, so client and server validate by different rules.
- Two parallel multi-step form systems — `Form/Form.tsx` (6 importers) and `BookingFlow.tsx`'s hand-rolled state machine.
- Two `Saved Cars` implementations (`/saved` page + account tab) with divergent, separately-buggy code.
- `getStatusBadge` re-implemented inline in `Booking/lookup/page.tsx:155` instead of using the `<StatusBadge>` primitive.
- 13 production `console.*` calls that should route through `observability.ts`.
- `SETUP.md:39-52` documents `RESEND_API_KEY` + 7 `NEXT_BUSINESS_*` env vars that exist nowhere in `.env.example` or the code.

---

## §9. Handover operational readiness

This is the genuine handover gap — the codebase is in better shape than the *operational story*.

- **No CI workflow.** `.github/workflows/` has only `auto-approve-deps.yml` and `dependency-update.yml`. Nothing runs lint / type-check / tests on a PR — the only gate between a broken PR and production is `next build` on Vercel. Add `.github/workflows/ci.yml` (lint + `type-check` + `jest` + Playwright) and make it required for merge. **This would have caught the §0 build break.**
- **No error monitoring.** `@sentry/nextjs` is not in `package.json`; `SENTRY_DSN` is optional. `observability.ts` is scaffolded for it. Without it, a Sunday outage is invisible until a Monday customer complaint. Wire it.
- **No uptime monitor.** Add UptimeRobot/BetterStack free tier pointing at a cheap endpoint (e.g. `/api/admin/session`).
- **`RUNBOOK.md` ownership table is entirely empty** (lines 8-21 — domain registrar, Vercel org, MongoDB Atlas, AWS account, Cloudflare/Turnstile, Sentry, SMTP provider all say `_(fill in)_`). **This is the single largest handover risk** — without it the new owner cannot pay the bills or rotate keys. Fill it in (30 min).
- **~30 unmerged branches on origin**, several with production-impact names (`fix/security-must-do`, `chore/next-upgrade`, …). Merge, close, or document each in a `HANDOVER_BRANCHES.md`.
- **No `DATA.md`.** A UK dealership stores customer PII; there is no documented retention policy, DSAR process, or breach contact — and the account-deletion route does not actually purge booking PII (H6). Write a one-pager.
- **`SETUP.md` is stale** — references env vars that do not exist (§8.3). Reconcile with `.env.example`.
- **Deployment trigger is undocumented** — Vercel auto-deploys from `main`; say so in `RUNBOOK.md`.

---

## §10. Corrections to the existing reports

The two prior reports are broadly accurate, but spending weekend time on these would be wasted — they are **already fixed** or **wrong**:

- **`admin/bookings` PUT "mass-assignment CRITICAL"** (DEEP_DIVE 🔥#3) — **false.** The route destructures `{bookingId, status, type}` explicitly and allow-lists `status` and `type`. There is no mass-assignment. (The *role-gating* gap H1 is real; the injection claim is not.)
- **`SESSION_SECRET` empty-string bypass P0** (HANDOVER_REVIEW 2b.2) — **already fixed.** `env.ts:100-105` hard-throws in production when `SESSION_SECRET` is missing.
- **`/api/csp-report` no body-size cap** (DEEP_DIVE Low) — **already fixed.** `csp-report/route.ts:25-27` returns 204 for bodies >65 KB before parsing.
- **`admin/bookings` GET "unbounded"** (DEEP_DIVE perf #14) — **wrong.** It has `.limit(limit)` with `limit` capped at 200. Only the missing sort index is real.
- **`CarDetailView` `<Image fill>` missing `sizes`** — **wrong.** All three `CarDetailView` images already have `sizes`. Five *other* sites are the real offenders.
- **`s3KeyFromStoredImage` is dead code** — **wrong.** It is used internally in `s3.ts:141`.
- **ContinueBar "sticky on steps 1-2"** — **wrong.** `.bk-continue-row` is `position: relative` — it is never sticky on any step. (The real issue: "Continue" needs scrolling on *every* step.)
- **Form offers `18:00` / the booking flow offers `18:00`** — **imprecise.** `BookingFlow`'s `TIME_SLOTS` max is `17:00`. The viewing form offers `18:00` and the validator allows it — the *viewing* slots are actually consistent; only the *service* flow's `:30` slots are the bug.
- **`today()` UTC bug "tells BST users at 23:30 the date is in the past"** — **direction wrong.** The bug bites at 00:00–00:59 local (UTC is still the previous day), and it makes the picker permit *yesterday*, not reject today. Low severity.
- **Hero `z-50` clashes with WhatsApp** — **disputed.** One sub-audit traced it as real (hero section is a positioned stacking context), one as not manifesting. 1-minute fix; verify visually.
- **Account deletion "orphans `sessions` rows"** — **moot.** JWT session strategy; there is no `sessions` collection. (The PII-in-bookings part of H6 stands.)
- **`/review` and `/admin/reset-password` pages "missing"** (the older `WEBSITE_REVIEW.md`, 2026-05-12) — **both now exist** and work.

Net: the prior reports' headline P0s (header CTA, `/Booking/[_id]`, half-hour slots, saved cars, Recoveries "London", role gating, `/api/carparts` seed) are all genuinely open and confirmed.

---

## §11. Full prioritized punch list

### P0 — before Saturday

The §2 table (15 items) — build break, the four Critical customer bugs, finance CTAs, header CTA, sold-car booking, quote tracking, the two broken admin flows, admin cars table actions, `/api/carparts` seed, role gating + carparts injection, `CRON_SECRET` + rate-limit hardening, "London". Plus the §9 ops: fill `RUNBOOK.md`, add CI, wire Sentry, add uptime monitor, triage branches.

### P1 — week 1 after handover

Booking-flow state persistence (URL step + `sessionStorage`); Turnstile-gate the Submit buttons; lock navigation on the booking success screen; "Vehicle Not Found" → `notFound()` (HTTP 404); slot conflict → HTTP 409; confirmation links carry `email`; build a real `/contact` form that reads `?subject/part/brand`; `AboutUs` brand chips → `?make=`; FAQ "Platinum" copy fix; remove the admin link from the footer; drive "Open now/7pm" from `businessInfo.hours`; add `error.tsx` to `(main)` and `(admin)`; admin "Confirm" idempotency (no false 400); admin "mark completed" UI; styled admin empty states; admin reservations/quotes/part-exchange pagination (currently capped at 50 rows); BusinessInfoForm save loading state + `heroStats` crash guard; bound the unbounded queries + add indexes; `React.cache` for `getCar`/`getBusinessInfo`; `next.config.ts` perf flags; `<MotionConfig reducedMotion="user">`; contrast fixes; account-deletion PII anonymisation (H6); encrypt TOTP secrets; `admin/shop` Zod validation.

### P2 — month 1

Delete the ~1,500 LOC of dead code; split the god-files (BookingFlow, BusinessInfoForm, Header, CarDetailView); unify the Button primitives and the form abstractions; centralise form helpers; `LazyMotion` migration; define `@theme` colour tokens + a z-index ladder; ARIA tabs/accordion fixes; `__Host-` cookie prefix; password complexity; CSP `style-src` tightening; E2E coverage for register/forgot-password/reservation/part-exchange; write `DATA.md`; reconcile `SETUP.md`.

---

## §12. What I could not verify — recommended live checks

This audit is deep static analysis. I did **not** run the app in a browser (the sandbox can't hold a dev server, and `MONGODB_URI` points at a live Atlas cluster). Before the handover, spend ~30 minutes with `npm run dev` doing this checklist — it will catch interaction-level issues no static pass can see:

1. **Book a service** picking a `09:30` slot — confirm it fails (verifies §3.3 #1), then re-test after the fix.
2. **Book a viewing**, then **hard-refresh** the `/Booking/[_id]` page — confirm "No Car Selected" (verifies #2).
3. Open the **account dashboard** — confirm "Saved cars" is empty even after hearting a car (#3).
4. Click **"Get a finance quote"** on any available car — confirm the 404 (#4).
5. Tap the header **"Book a Viewing"** on a phone-width viewport — confirm it is absent (#6).
6. Open a **sold** car's detail page — confirm "Book a viewing" still shows (#7).
7. Submit a **quote**, then click "Track booking" — confirm lookup rejects the `QT-` ref (#8).
8. Scroll the home page on mobile — eyeball whether the hero blobs or the WhatsApp button render correctly (§5.2 z-index).
9. Run **Lighthouse + the axe DevTools extension** on `/`, `/BrowseFleet`, `/BrowseFleet/[_id]`, `/Book` — validates the contrast / heading / ARIA findings in §5.1.
10. As an **admin**, open the cars page in **Table** view and click "Edit"/"Delete" — confirm they 404 / do nothing (§2 #11).

Other unverifiable items: Vercel env-var contents; whether a staging environment exists; whether the `/api/carparts` seed has ever fired in prod (check the `carParts` collection for docs with `image: "/car.jpg"`); whether DB backup-restore has ever been drilled.

---

*Generated 2026-05-20 against `main @ 9e83e38` + 3 uncommitted edits. Method: six parallel specialist sub-audits (purchase funnel, services/content/auth pages, admin dashboard, security, performance/code-debt, UX/CTA/a11y), each tracing every page branch-by-branch and verifying the two prior handover reports against current source. Re-verify any specific finding before opening a PR — the codebase is past the size where line numbers stay stable.*
