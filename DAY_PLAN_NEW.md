# Morley Motor Company — Handover Fix Plan (`DAY_PLAN_NEW`)

**Created:** 2026-05-20 · **Owner handover:** this Saturday
**Source:** prioritised P0 punch list from `HANDOVER_MASTER_AUDIT_2026-05-20.md`

## Workflow

- One branch + one PR per day, named `day-N-<slug>`.
- Each PR is merged to `main` → **auto-deploys to production via Vercel**.
- `tsc` + tests + `next build` are run locally before every merge.

## Status legend

✅ Done & merged · 🔄 In progress · ⬜ Planned

---

## Day 1 — Restore the build ✅

**Branch:** `day-1-restore-build` · **Status:** ✅ Done & merged

- Finish the `StatCard`/`KPIGrid` icon refactor. `StatCard.icon` is now `React.ReactNode` (a function reference can't cross the RSC boundary in Next 16); 7 `KPIGrid` callers still passed bare component refs, so `tsc` failed and `next build` aborted.
- Keep the `models/index.ts` `reconcileAdminEmailIndex` fix — resolves the admin-login `IndexOptionsConflict` thrown on deployments whose `email_1` index predates the `unique + sparse` schema.
- Update `StatCard.test.tsx` to the new `icon` prop shape.
- Result: `tsc --noEmit`, `next build`, and the Dashboard tests all pass.

## Day 2 — Booking-flow blockers ⬜

**Branch:** `day-2-booking-flow`

- One shared `BOOKING_SLOTS` constant consumed by every booking form **and** `validateAppointmentTime` — fixes `:30`-slot service bookings being rejected with "Invalid appointment time" after all 5 steps (also fixes the admin `AppointmentForm`).
- Make `/Booking/[_id]` a server component that fetches the car by `_id` — fixes "No Car Selected" on refresh / shared link / bookmark / new tab.

## Day 3 — Customer CTAs ⬜

**Branch:** `day-3-cta-fixes`

- Header "Book a Viewing" CTA → `/BrowseFleet`, visible at all breakpoints (also the two `WhyChooseHome` mis-routes).
- Finance calculator "Get a finance quote" → a real route (currently `/Enquiry`, a 404); "Speak to our team" empty `tel:` link fixed.
- Gate the car-detail "Book a viewing" CTA on `car.status === "available"` — sold/reserved cars are currently bookable.

## Day 4 — Saved cars & booking lookup ⬜

**Branch:** `day-4-saved-and-lookup`

- New public `GET /api/cars?ids=…` endpoint; rewire `SavedCarsPage` + account `SavedCarsList` (both currently call the admin-only endpoint → 401, and read the wrong response shape).
- `/api/bookings/lookup` accepts `QT-` / `RS-` / `PX-` references — quote tracking is currently broken.

## Day 5 — Admin tooling ⬜

**Branch:** `day-5-admin-fixes`

- Fix `CarActions` edit/view routes and wire the dead Delete + Featured-toggle handlers in the cars Table/List views.
- `UserForm` / `PasswordForm` success screens reflect the real email-link flow (they currently show an empty password box).
- `Form.tsx` shows a success state and surfaces the server's error message.

## Day 6 — Security hardening ⬜

**Branch:** `day-6-security`

- Remove the production-seeding write from `GET /api/carparts`.
- Role-gate the admin write routes with `hasMinimumRole("manager")`.
- Zod `.strict()` + `$`-key reject on the `admin/carparts` PUT.
- `CRON_SECRET` constant-time compare; `x-forwarded-for` → `ipAddress(request)`; KV rate-limiter fail-closed for security limiters.

## Day 7 — Content, trust & ops ⬜

**Branch:** `day-7-content-and-ops`

- "London" → "Leeds" across `/Recoveries`, `/Repairs`, `/AboutUs` **and** the `RECOVERY_SEED` data.
- Remove the admin-dashboard link from the customer footer; fix the FAQ "Platinum" package copy; drive "Open now / 7pm" from `businessInfo.hours`; contrast fixes for `text-gray-400` body text.
- Add a CI workflow (`lint` + `type-check` + `test`); `next.config.ts` perf flags; `React.cache` on `getCar` / `getBusinessInfo`.

---

## Progress log

- **2026-05-20** — Day 1 complete: build restored (StatCard/KPIGrid icon refactor finished, admin-login index fix kept), merged to `main`.
