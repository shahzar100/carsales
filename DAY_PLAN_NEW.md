# Morley Motor Company — Handover Fix Plan (`DAY_PLAN_NEW`)

**Created:** 2026-05-20 · **Owner handover:** this Saturday
**Source:** prioritised P0 punch list from `HANDOVER_MASTER_AUDIT_2026-05-20.md`

## Workflow

- One branch + one PR per day, named `day-N-<slug>`.
- Each PR is merged to `main` → **auto-deploys to production via Vercel**.
- `tsc` + tests + `next build` are run locally before every merge.

## ⚠️ Known blockers (pre-existing — not introduced by this plan)

- **Production deploys have been failing since 2026-05-17.** `next build` prerenders DB-backed pages and the Vercel build environment cannot reach MongoDB Atlas (`MongoServerSelectionError`). Each day's PR merges, but the Vercel deploy fails. The fix is infrastructure-side (Atlas Network Access allowlist / cluster status / Vercel `MONGODB_URI`) — see `HANDOVER_MASTER_AUDIT_2026-05-20.md`.
- **Pre-existing test failures on `main`** — 5 in the jsdom/component suite (`ViewingBookingsClient`, `ServiceBookingsClient`, `Toast` ×2, `WhyChooseHome`) and 7 in the API suite (`auth`, `getDashboardData`, `2fa/*` and `users/*` — test-env setup gaps: a `CRON_SECRET`/`NODE_ENV` mismatch and a Jest ESM dynamic-import flag). All unrelated to this plan and present on `main` before Day 1 (each day's verification confirmed the same set via `git stash`). The Day 7 CI workflow runs the full suites, so these 12 surface as a red `test` job — `lint` + `type-check` are green. **Clearing the 12 is the recommended immediate follow-up** (it is its own focused debugging task, out of scope for the Day 7 content/ops work).

## Status legend

✅ Done & merged · 🔄 In progress · ⬜ Planned

---

## Day 1 — Restore the build ✅

**Branch:** `day-1-restore-build` · **Status:** ✅ Done & merged

- Finish the `StatCard`/`KPIGrid` icon refactor. `StatCard.icon` is now `React.ReactNode` (a function reference can't cross the RSC boundary in Next 16); 7 `KPIGrid` callers still passed bare component refs, so `tsc` failed and `next build` aborted.
- Keep the `models/index.ts` `reconcileAdminEmailIndex` fix — resolves the admin-login `IndexOptionsConflict` thrown on deployments whose `email_1` index predates the `unique + sparse` schema.
- Update `StatCard.test.tsx` to the new `icon` prop shape.
- Result: `tsc --noEmit`, `next build`, and the Dashboard tests all pass.

## Day 2 — Booking-flow blockers ✅

**Branch:** `day-2-booking-flow` · **Status:** ✅ Done & merged

- Added a shared `BOOKING_SLOTS` constant (`src/lib/utils/bookingSlots.ts`) consumed by every booking form (`BookingFlow`, `CarViewingForm`, admin `AppointmentForm`) **and** `validateAppointmentTime` — a slot a form offers is now always a slot the API accepts. The forms previously offered `:30` (and `13:00`) slots the server rejected after all 5 steps. The canonical list is the 9 on-the-hour slots the validator already enforced, so nothing new became bookable — to enable half-hour appointments, add the `:30` entries to that one constant.
- `/Booking/[_id]` now server-fetches the car by its `_id` and passes it to `<CarViewing>`, which seeds the viewing context — fixes "No Car Selected" on refresh / shared link / bookmark / new tab. An unknown id returns a 404.

## Day 3 — Customer CTAs ✅

**Branch:** `day-3-cta-fixes` · **Status:** ✅ Done & merged

- The three header "Book a Viewing" CTAs now route to `/BrowseFleet` (not `/Book`, the service flow) — relabelled "Browse Cars", and the desktop CTA is visible at all breakpoints (was hidden below 640px). The two `WhyChooseHome` mis-routes (`/Book` → `/BrowseFleet`) are fixed too.
- Finance calculator: "Get a finance quote" now routes to `/contact` (was `/Enquiry`, a 404); "Speak to our team" now uses a real `tel:` link from `businessInfo.phone` (was an empty `tel:`).
- The car-detail "Book a viewing" CTA (desktop card + mobile sticky bar) is gated on `car.status === "available"` — sold/reserved cars show a "browse available cars" link instead of a bookable CTA.

## Day 4 — Saved cars & booking lookup ✅

**Branch:** `day-4-saved-and-lookup` · **Status:** ✅ Done & merged

- New public `GET /api/cars?ids=…` endpoint returns the available cars for a set of ids. `SavedCarsPage` and the account `SavedCarsList` now use it instead of the admin-only `/api/admin/cars` (which 401'd every customer and returned a response shape the components couldn't read) — the Saved Cars feature works again.
- `/api/bookings/lookup` now accepts `QT-` quote references and the lookup page renders the quote — the quote success screen links here and previously errored. `RS-`/`PX-` references were descoped: nothing in the app links them to the lookup page (no live bug), and supporting them needs per-type rendering on the lookup page — left as a follow-up.

## Day 5 — Admin tooling ✅

**Branch:** `day-5-admin-fixes` · **Status:** ✅ Done & merged

- The cars **Table and List views** are usable again. `CarActions` (the per-row "Actions" menu) linked Edit/View to non-existent routes and its Delete button did nothing — it now routes Edit to the real edit page, View to the public listing, and Delete opens a confirmation dialog and actually deletes. The dead Featured-toggle stars are replaced by a shared, wired `FeaturedToggle` component.
- `UserForm` / `PasswordForm` no longer promise a password that does not exist. The APIs email the user a secure setup/reset link; the forms' success screens and copy now say so (they previously rendered an empty "copy this password" card). _Follow-up:_ PasswordForm's "reset" and "reminder" options both just email a reset link — the two-option UI is now accurate but redundant and could be collapsed.
- `Form.tsx` (the shared multi-step form engine) now shows a success banner and disables the submit button after a successful submit — preventing duplicate submissions — and surfaces the server's actual error message instead of a generic one.

## Day 6 — Security hardening ✅

**Branch:** `day-6-security` · **Status:** ✅ Done & merged

- `GET /api/carparts` no longer auto-seeds the collection — a public, unauthenticated GET was performing a DB write (and could quietly resurrect mock inventory in production). An empty collection now returns `[]`; real inventory comes from the admin API.
- Every admin **write** route (POST/PUT/PATCH/DELETE on cars, carparts, bookings, bookings/cancel, part-exchange, quotes, reservations, shop, upload, upload/delete) is now gated with `hasMinimumRole("manager")` — a read-only `staff` session can still GET but gets a 403 on any mutation. GET handlers are unchanged.
- The `admin/carparts` PUT spread its request body straight into a Mongo `$set`. It now strict-parses with a Zod `.strict()` schema and rejects `$`-prefixed / dotted / `__proto__` keys outright — closing the mass-assignment / operator-injection hole.
- `CRON_SECRET` is compared in constant time (SHA-256 + `timingSafeEqual`) instead of `!==`. The spoofable `x-forwarded-for` IP parse is replaced with `ipAddress(request)` across all 13 rate-limited routes. The KV rate-limiter gained a `failClosed` option; the 10 credential-guarding limiters (login, 2FA, password reset/change, magic link) now fail **closed** on a KV outage so it can't open an unlimited brute-force window.

## Day 7 — Content, trust & ops ✅

**Branch:** `day-7-content-and-ops` · **Status:** ✅ Done & merged

- **"London" → "Leeds".** A Leeds business was advertising London ~9× — `/Recoveries` (6 strings), `/Repairs`, the admin `BusinessInfoForm` placeholders, **and** the `RECOVERY_SEED` data itself (London boroughs + SE-England counties → Leeds / West Yorkshire areas). `/AboutUs` has no hard-coded "London" — it renders the recovery seed, so fixing the seed fixes it. _Note:_ the seed only applies to a fresh DB — an already-seeded production `recoveryInfo` doc must be corrected once via the admin BusinessInfoForm.
- **Trust & content.** Removed the "Admin Dashboard" link from the customer footer (it signposted the admin URL to every visitor; column renamed "Legal"). Fixed the FAQ copy advertising a non-existent "Platinum" detailing package (packages are Bronze/Silver/Gold). "Open now / 7pm" on the car-detail page is now derived from `businessInfo.hours` via a new, tested `getOpenStatus()` helper instead of hard-coded. Contrast: the `text-gray-400` body text the audit flagged (`BrowseFleetContent`, `not-found`, `CarPartsGrid`) bumped to `text-gray-600` for WCAG AA.
- **Ops & perf.** Added `.github/workflows/ci.yml` — `lint` + `type-check` + `test` on every push/PR (the missing gate that let the 2026-05-17 type-error build break ship). `next.config.ts` gained `experimental.optimizePackageImports`, AVIF/WebP image formats and a 31-day image cache TTL. `getBusinessInfo` and the car-detail `getCar` are wrapped in `React.cache` so repeat calls within one render share a single DB round-trip.

---

## Progress log

- **2026-05-20** — Day 1 complete: build restored (StatCard/KPIGrid icon refactor finished, admin-login index fix kept), merged to `main`.
- **2026-05-20** — Day 2 complete: shared `BOOKING_SLOTS` constant (fixes `:30`-slot rejection across all booking forms + validator) and server-fetched `/Booking/[_id]` (fixes "No Car Selected" on refresh/share), merged to `main`. `tsc` + 78 targeted tests + `next build` green; the 5 pre-existing test failures noted above are unrelated.
- **2026-05-20** — Day 3 complete: header + `WhyChooseHome` CTAs re-routed off the broken `/Book` path to `/BrowseFleet`; finance-calculator `/Enquiry` 404 and empty `tel:` fixed; sold/reserved cars no longer show a bookable CTA. Merged to `main`. `tsc` + full suite (zero new failures, +3 tests) + `next build` green.
- **2026-05-20** — Day 4 complete: public `/api/cars?ids=` endpoint + Saved Cars feature rewired (was 401-broken for every customer), and `/Booking/lookup` now supports `QT-` quote tracking. Merged to `main`. `tsc` + API tests (14, incl. the new `/api/cars` suite) + jsdom suite + `next build` green; zero new failures.
- **2026-05-20** — Day 5 complete: admin cars Table/List Edit/View/Delete + Featured toggle wired (were all dead); `UserForm`/`PasswordForm` no longer show a fake password; `Form.tsx` gained a success state + real error messages. Merged to `main`. `tsc` + jsdom suite (zero new failures, +3 tests) + `next build` green.
- **2026-05-20** — Day 6 complete: security hardening — removed the public-GET seeding write from `/api/carparts`; role-gated all admin write routes with `hasMinimumRole("manager")`; Zod-`.strict()` + `$`-key reject on the `admin/carparts` PUT; `CRON_SECRET` constant-time compare; `x-forwarded-for` → `ipAddress()` across 13 routes; KV limiter fails closed for the 10 credential limiters. 37 files (26 source incl. `src/auth.ts`, 11 tests). Merged to `main`. `tsc` + API suite (zero new failures, +5 tests; baseline-confirmed) + jsdom suite + `next build` green.
- **2026-05-20** — Day 7 complete: "London"→"Leeds" across `/Recoveries`, `/Repairs`, `BusinessInfoForm` + `RECOVERY_SEED`; footer admin-dashboard link removed; FAQ "Platinum" copy fixed; "Open now/7pm" driven from `businessInfo.hours` via a new tested `getOpenStatus()` helper; `text-gray-400`→`gray-600` contrast fixes; added `.github/workflows/ci.yml` (`lint`+`type-check`+`test`); `next.config.ts` perf flags; `React.cache` on `getBusinessInfo`/`getCar`. Merged to `main`. `lint` + `tsc` + API suite (+8 tests) + jsdom suite + `next build` green; zero new failures. **Plan complete — all 7 days done.**
