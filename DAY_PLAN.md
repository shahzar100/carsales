# Pre-Handover Cleanup — Day Plan

**Date:** 2026-05-09
**Repository:** `carsales` (`shahzar100/carsales`)
**Source reports:** [CODE_AUDIT.md](./CODE_AUDIT.md), [REUSABILITY_REPORT.md](./REUSABILITY_REPORT.md)
**Owner:** Shahzar
**Goal:** Ship-ready handover to client. Client may come back for fixes after.

---

## How this plan is organised

Five "Days" of work, ordered the way the audit recommends: **bugs first, then dead code, then debt, then polish.** Each Day is one branch and one PR-style merge to `main`. Days build on each other, so they're sequential, not parallel.

Two streams of work run alongside the Days because they're handover-specific, not codebase-cleanup:

- **Pre-handover work** — Status widget, GitHub Actions, READMEs. These exist only because the client is taking the keys.
- **Deferred / skipped** — Things the audit flagged that are not worth doing before handover (or possibly ever).

"Day" is a rough sizing, not a calendar deadline. Day 1 is genuinely an afternoon. Days 4–5 are realistically a week of focused work.

---

## Day 1 — Critical customer bugs

**Branch:** `fix/critical-customer-bugs`
**Goal:** Stop bleeding. Every item here is a customer-visible bug or a real security risk.

| # | Item | Status | Audit ref |
|---|---|---|---|
| 1 | Render real car images instead of hardcoded `/tesla.webp` (7 files) | ✅ Already in main (commit 2) | §2.1 |
| 2 | Fix admin login Tailwind typo `bg-linear-to-brpx-4` | ✅ Already in main (commit 3) | §2.2 |
| 3 | Fix carparts admin page envelope unwrap bug | ✅ Already in main (commit 2) | §2.3 |
| 4 | Replace invalid `React.SubmitEvent` with `React.FormEvent<HTMLFormElement>` | ✅ Already in main (commit 3) | §2.4 |
| 5 | Dashboard `redirect("/admin")` → `redirect("/admin/login")` | ✅ Already in main (commit 3) | §2.5 |
| 6 | `app/error.tsx` `<a>` → `<Link>` | ✅ Already in main (commit 3) | §2.6 |
| 7 | Delete `useSkeleton` hook + unwire from 5 wrapper components | ✅ Done on `fix/critical-customer-bugs` (2026-05-09) | §3.2 |
| 8 | Delete `/api/admin/health/tests` route + `TestRunner.tsx` UI | ✅ Done on `fix/critical-customer-bugs` (2026-05-09) | §7.1 |

**Validation:** `npm run lint && npm test` clean on the branch before merge.

---

## Day 2 — Delete the rot ✅

**Branch:** `chore/delete-dead-code` (commit `9883b5aa`, 2026-05-09)
**Goal:** Shrink the surface area before refactoring it. No point migrating dead code to new patterns.

Twelve dead source files (audit §1.1–1.6, §1.10), two macOS Finder duplicate test files (`*.test 2.tsx`, §1.11), the test files for the dead `Helpful/{Grid,GridItem,Input}` components (§1.7), and the dead state / unused imports flagged by lint (§1.15).

Also: move `agent/` (1132 LOC of dev-time AI fixer tooling, §1.14) out of the product tree to `tools/agent/` and exclude from `tsconfig` and `eslint`. It has nothing to do with the car sales product.

**Expected outcome:** lint count drops from 235 → ~150. Source tree ~600 LOC lighter. `npm test` no longer runs duplicate suites.

**Actual outcome (2026-05-09):**
- Lint: 235 → **186** problems (140 errors, 46 warnings). Remaining errors are mostly `react/no-unescaped-entities` in email templates and `no-require-imports`/`no-explicit-any` in tests — both flagged by audit §6.3 as a separate cleanup, not Day 2 scope.
- Source tree: 33 files changed, **+9 / −2,594 lines**.
- 6 test files deleted (incl. the two `*.test 2.tsx` macOS duplicates) — `npm test` no longer runs duplicate suites.
- `agent/` moved to `tools/agent/` and excluded from `tsconfig.json` and `eslint.config.mjs`.
- One Day 3 prerequisite intentionally left in place: `JsonLd` import in `BrowseFleet/[_id]/page.tsx` — Day 3 will render it rather than removing the import.
- Pre-existing `tsc` errors in `admin/cars/route.ts` and `admin/users/route.ts` are unchanged (not Day 2 scope).

---

## Day 3 — Wire in the salvageable five

**Branch:** `feat/wire-up-salvageable-features`
**Goal:** Activate features that already exist in the codebase but aren't connected. Reusability §2.

| Item | What | Effort |
|---|---|---|
| Wire `lib/env.ts` into `instrumentation.ts` | The Zod env validation never runs today. Replace ad-hoc `process.env.X` reads in `backend/mongodb.ts` and `lib/utils/auth.ts` with typed `serverEnv.X` reads. | 30 min |
| Build carparts edit modal | `PUT /api/admin/carparts` is fully implemented and tested but no UI calls it. The `Pencil` icon is imported but unused. | 60 min |
| Wire `Cars.tsx` Edit / View / Delete handlers | Buttons exist with no `onClick`. Endpoints exist. Pure UI plumbing. (Delete uses `<ConfirmDialog>` from Day 4.) | 30 min |
| Render `<JsonLd>` on car detail pages | Component imported on `/BrowseFleet/[_id]/page.tsx` but never rendered — real SEO debt for a sales site. | 15 min |
| Verify and wire `CarShareCard` / `ShareButton` | Audit usage on car detail pages; integrate where missing. | 15 min each |

---

## Days 4–5 — Build high-leverage primitives

**Branch:** `feat/shared-primitives`
**Goal:** Build the missing reusable pieces *before* migrating call sites — otherwise we'll get a fourth button system mid-migration.

Build in this order, then sweep call sites:

1. `lib/utils/format.ts` — `formatPrice`, `formatMileage`, `formatDate`, `formatTime`, `formatRelativeTime`. Replaces inline duplication in 30+ files. Highest ROI in the entire roadmap.
2. `lib/utils/apiResponse.ts` — `ok(data)` / `fail(error, status)`. Sweep all routes to consistent envelope.
3. `components/UI/Button.tsx` — unified Button with `href` support. Replaces the three current button systems (`Helpful/Buttons/Button`, `FormPrimitives.FormButton`, raw `<button>` tags).
4. `components/UI/ConfirmDialog.tsx` — used by Day 3's `Cars.tsx` Delete handler and the carparts delete.
5. `components/UI/StatusBadge.tsx` — replaces the 4 `getStatusColor` switches.
6. `components/UI/EmptyState.tsx` — replaces 5 inline empty panels.
7. `hooks/useApi.ts` — typed `{ data, error, loading, refetch }`. Pairs with `apiResponse.ts`.
8. `hooks/useScrollLock.ts` — fixes the body-overflow race between `Modal` and `NavMenu`.

**Estimated impact:** ~900 LOC of duplicated code removed, plus consistent UX across ~50 files.

---

## Day 6+ (deferred until after handover) — Bigger primitives

`Card`, `PageHeader`, `DataTable`, `FormField`, `ResponsiveGrid`. Build only when there's a third or fourth call site that justifies the abstraction. Don't pre-emptively build these.

---

## Phase 5 — Structural consolidation

**DO NOT do this before handover.** Save it for a quiet week, possibly with the client's blessing. Touches almost every import in the project, conflicts with everything else in flight.

Items: merge `src/backend/` into `src/contexts/`; merge `src/lib/interfaces.ts` and `src/lib/types.ts`; rename `src/components/Helpful/` → `src/components/UI/`; standardise on one rate limiter (`createRateLimiter`).

---

## Pre-handover work (parallel to the Days, all required before handover)

These don't fit the Day numbering because they're not audit findings — they're handover prerequisites. Pick them up between Days as time allows.

| Task | Why | Effort |
|---|---|---|
| **System Status widget** | Replaces the deleted TestRunner with the *right* tool: a live operational health panel ("website ✓ online, DB ✓ connected, last booking 4 min ago, email service ✓ sending") that tells the client what they actually need to know. Plain language, no stack traces. | Half a day |
| **GitHub Actions CI** | Run `npm test` on every push/PR. The green tick on github.com signals "this code is tested" at handover. Optional later: rebuild a TestRunner-style button in the admin panel that triggers the workflow via `workflow_dispatch`. | 30 min for the workflow, +2 hr for the trigger UI |
| **Client-facing operations README** | Plain-language guide for the non-technical client: "how to add a car," "how to confirm a booking," "what to do when the Status widget shows red." Lives in admin dashboard or as a shared doc, not the repo. | Half a day |
| **Developer handover docs** | Refresh `README.md` and `SETUP.md`. Add an ops runbook: MongoDB / S3 / email service ownership, domain registrar, env vars, deployment URL, who pays for what. Document the escalation path (you, for paid fixes). | Half a day |

---

## Skipped / not worth doing

These were flagged by the audit but explicitly **not** in the plan:

| Item | Why skipping |
|---|---|
| Remove `'unsafe-inline'` from CSP (audit §7.3) | Non-trivial. Requires nonce middleware. Not urgent. Would eat a day. |
| `<DataTable>` primitive (reusability §4.8) | Only 3 call sites today. Build only when there's a 4th. |
| Migrate `ServiceBookingForm` and `CarViewingForm` to the multi-step `Form` framework (reusability §3.8) | High risk on revenue-critical flows. Only do this if you're rewriting them anyway. |
| Pre-commit hook for `prettier-plugin-tailwindcss` (audit §5.9) | Nice-to-have, not handover-critical. Run `npm run format` once before handover instead. |

---

## How to track progress

This file is the working checklist. Update the status column as you complete items. When a Day finishes:

1. Confirm `npm run lint && npm test && npm run build` all pass on the branch.
2. Merge (or push directly, if that's your flow).
3. Tick all boxes for that Day in this file.
4. Open the next Day's branch off the new `main`.

When all five Days are done plus the four pre-handover items, the codebase is handover-ready.

---

*This plan was generated from CODE_AUDIT.md and REUSABILITY_REPORT.md on 2026-05-09. Update as priorities shift.*
