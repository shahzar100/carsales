# Implementation Plan: Complete Missing Features, Improve Quality/Consistency & Fix Test Debt

## Summary

A comprehensive plan to (1) integrate Car Parts with MongoDB, removing hardcoded mock data, (2) remove dead legacy Shop components with a divergent interface, (3) fix the single source-code type error, (4) fix all test-file type errors and failing tests, and (5) add accessibility quick wins. This brings the codebase to a fully green health check with zero type errors and no dead code.

## Impact Analysis

- **New files:** 4 (CarPart model, admin API route, admin page, car parts API route)
- **Modified files:** ~18
- **Database changes:** Yes — new `carParts` collection
- **New dependencies:** No
- **Risk level:** Low–Medium

---

## Tasks

### Task 1: Fix Source Type Error in Booking Lookup Route

**Layer:** API
**Files to modify:**
- `src/app/api/bookings/lookup/route.ts` — narrow union type before accessing `.email`

**Description:**
Line 74 accesses `booking?.email` on a union of `WithId<ServiceAppointment> | WithId<CarViewingBooking>`. Neither interface has a top-level `email` — it's always `customerInfo.email`. The `.email` fallback is dead code and causes a type error. Remove it — only use `booking?.customerInfo?.email`.

**Current (broken):**
```ts
const bookingEmail = booking?.customerInfo?.email || booking?.email;
```

**Fix:**
```ts
const bookingEmail = booking?.customerInfo?.email;
```

**Acceptance Criteria:**
- [ ] `npx tsc --noEmit` reports zero errors in `src/` files
- [ ] Existing booking lookup tests still pass
- [ ] No runtime behavior change (`.email` was never populated)

**Dependencies:** None
**Risk:** Low — removing dead code path
**Estimated Effort:** Small (< 15 min)
**Standards:** None

---

### Task 2: Fix CarShareCard Test — Missing `updatedAt`

**Layer:** Test
**Files to modify:**
- `__tests__/components/SEO/CarShareCard.test.tsx` — add `updatedAt: new Date()` to `mockCar` object (line ~37)

**Description:**
The `CarInterface` requires `updatedAt: Date` but the test's `mockCar` omits it — producing 9 identical TS2741 errors. Add the field.

**Acceptance Criteria:**
- [ ] `npx tsc --noEmit` reports zero errors in this file
- [ ] All CarShareCard tests pass

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small (< 10 min)
**Standards:** None

---

### Task 3: Fix filterCars Test — Missing `featured`

**Layer:** Test
**Files to modify:**
- `__tests__/utils/filterCars.test.ts` — add `featured: false` to all 5 `testCars` entries (lines ~18, 36, 54, 72, 90)

**Description:**
The `CarInterface` requires `featured: boolean` but all test car objects omit it — producing 5 TS2741 errors. Add `featured: false` to each.

**Acceptance Criteria:**
- [ ] `npx tsc --noEmit` reports zero errors in this file
- [ ] All filterCars tests pass

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small (< 10 min)
**Standards:** None

---

### Task 4: Fix auth Test — Read-only `NODE_ENV` Assignment

**Layer:** Test
**Files to modify:**
- `__tests__/utils/auth.test.ts` — replace direct `process.env.NODE_ENV = "production"` with `Object.defineProperty` or use a helper that works with TypeScript's read-only typing

**Description:**
Lines 309 and 317 assign to `process.env.NODE_ENV` which TypeScript marks as read-only (TS2540). The fix is to use `Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true })` or cast through `(process.env as any).NODE_ENV`.

**Acceptance Criteria:**
- [ ] `npx tsc --noEmit` reports zero errors in this file
- [ ] All auth tests pass (including the production guard test)

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small (< 15 min)
**Standards:** None

---

### Task 5: Fix businessInfo Test — Possibly Undefined + Assertion Failure

**Layer:** Test
**Files to modify:**
- `__tests__/utils/businessInfo.test.ts` — add non-null assertions or optional chaining where TypeScript flags possibly undefined; fix the tint options update test logic

**Description:**
Two separate issues:

**5a — Type errors (8 instances):** Properties `detailingPackages`, `tintOptions`, `serviceOverviews` are optional on `ShopInfo` (`?`), but the test accesses them directly (e.g., `result.detailingPackages.length`). Fix by adding `!` non-null assertions since the test knows they'll be seeded, or by using `expect(result.detailingPackages).toBeDefined()` first and then narrowing.

**5b — Assertion failure ("updates tint options"):** The test calls `updateBusinessInfo({ tintOptions: [] })` expecting the tint options to become empty (length 0), but `updateBusinessInfo` skips the insert when the array is empty — however it DOES delete all existing docs first. The issue is that `getBusinessInfo` re-seeds the tint options collection because it's now empty (the `seedIfEmpty` logic re-populates it). The test expectation is wrong given the re-seeding behavior. Fix: either (a) change the test to expect re-seeded length (3), or (b) update test to set tintOptions to a single-item array `[{ ... }]` and assert length 1, which correctly tests the update without triggering re-seeding.

**Acceptance Criteria:**
- [ ] `npx tsc --noEmit` reports zero errors in this file
- [ ] All businessInfo tests pass (including "updates tint options")
- [ ] No changes to source code — only test file fixes

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small (< 30 min)
**Standards:** None

---

### Task 6: Fix quote API Test — Mock Email Not Called

**Layer:** Test
**Files to modify:**
- `__tests__/api/bookings/quote.test.ts` — fix the `flushWaitUntil` mock or the email mock setup so that the background `waitUntil` callback actually resolves and triggers `sendEmail`

**Description:**
The test expects `mockSendEmail` to be called once after `flushWaitUntil()`, but it's called 0 times. This means the `waitUntil` mock isn't properly capturing and executing the callback from the route. Investigate the `flushWaitUntil` helper in `__tests__/utils/testUtils.ts` — ensure it captures the promise/callback passed to `waitUntil` from `@vercel/functions` and resolves it before the assertion runs. The mock for `@vercel/functions` must capture the callback and `flushWaitUntil` must await it.

**Acceptance Criteria:**
- [ ] The "should send a confirmation email" test passes
- [ ] All other quote API tests still pass
- [ ] No changes to source code

**Dependencies:** None
**Risk:** Low–Medium (mock plumbing can be tricky)
**Estimated Effort:** Medium (1–2 hr)
**Standards:** None

---

### Task 7: Fix Jest Transform for `bson` ESM Module

**Layer:** Config
**Files to modify:**
- `jest.config.js` and/or `jest.config.api.js` — update `transformIgnorePatterns` to NOT ignore `bson` (and possibly `mongodb`) so Jest can transform their ESM exports

**Description:**
Two test suites fail because `bson` uses ESM `export` syntax which Jest's default transform ignores for `node_modules`. The fix is:

```js
transformIgnorePatterns: [
  '/node_modules/(?!(bson|mongodb)/)',
],
```

This tells Jest to transform `bson` and `mongodb` packages instead of skipping them. The affected test files are `__tests__/utils/businessInfo.test.ts` (which imports from `src/lib/utils/businessInfo.ts` → `src/lib/models/index.ts` → `mongodb` → `bson`).

**Acceptance Criteria:**
- [ ] `npx jest --config jest.config.js --no-coverage` shows 0 failed suites
- [ ] `npx jest --config jest.config.api.js --no-coverage` shows 0 failed suites
- [ ] No regressions in other tests

**Dependencies:** None (but should be done before Task 5 since the businessInfo tests also fail at parse time)
**Risk:** Low–Medium (transform config changes can have side effects)
**Estimated Effort:** Small (< 30 min)
**Standards:** None

---

### Task 8: Remove Dead Shop/Collection Components

**Layer:** Component (cleanup)
**Files to delete:**
- `src/components/Shop/Collection/CarFleetShop.tsx`
- `src/components/Shop/Collection/Item.tsx`
- `src/components/Shop/Collection/ItemGrid.tsx`
- `src/components/Shop/Collection/CarBooking.tsx`
- `src/components/Shop/Collection/CarDisplay.tsx`
- `src/components/Shop/Collection/Filters/FilterBar.tsx`
- `src/components/Shop/Collection/Filters/FilterSection.tsx`
- `src/components/Shop/Collection/Filters/CustomDropdown.tsx`
- `src/components/UI/Skeleton/ShopItemSkeleton.tsx`

**Files to modify:**
- `src/components/UI/Skeleton/index.ts` — remove `ShopItemSkeleton` export

**Description:**
`CarFleetShop`, `Item`, `ItemGrid`, and related Shop components use a legacy `Car` interface with capitalized field names (`Name`, `Brand`, `Price`, etc.) that diverges from the standard `CarInterface`. Analysis confirms these components are **never imported or used** by any page or parent component — they are dead code. They also have a TODO about filter issues (`FilterBar.tsx`). Remove them entirely to eliminate interface inconsistency and dead code.

If there are any associated test files in `__tests__/components/Shop/`, also remove or update them.

**Acceptance Criteria:**
- [ ] No `Shop/Collection` directory remains (or is empty)
- [ ] `ShopItemSkeleton` removed from skeleton index
- [ ] `npx tsc --noEmit` passes
- [ ] All tests pass (no test was importing these components)
- [ ] No runtime regression (components were unused)

**Dependencies:** None
**Risk:** Low — dead code confirmed by grep analysis
**Estimated Effort:** Small (< 30 min)
**Standards:** None

---

### Task 9: Add `CarPart` Interface and MongoDB Model

**Layer:** Database
**Files to create:**
- (none — add to existing files)

**Files to modify:**
- `src/lib/interfaces.ts` — add `CarPartInterface`
- `src/lib/models/index.ts` — add `carPartsCollection`, `getCarPartsCollection()`, indexes

**Description:**
Define a proper `CarPartInterface` in the shared interfaces file, based on the existing `CarPart` type in `CarPartsGrid.tsx` but enhanced for MongoDB:

```ts
export interface CarPartInterface {
  _id?: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image?: string;
  condition: "New" | "Used" | "Refurbished";
  compatibility: string;
  description: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Add collection accessor in `src/lib/models/index.ts` with indexes on `category`, `brand`, `condition`, and `price`.

**Acceptance Criteria:**
- [ ] `CarPartInterface` exported from `src/lib/interfaces.ts`
- [ ] `getCarPartsCollection()` exported from `src/lib/models/index.ts`
- [ ] Indexes created on `category`, `brand`, `condition`, `price`
- [ ] `npx tsc --noEmit` passes

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small (< 30 min)
**Standards:** None

---

### Task 10: Create Car Parts Public API Route

**Layer:** API
**Files to create:**
- `src/app/api/carparts/route.ts` — GET endpoint returning all car parts from DB

**Description:**
Create a public GET endpoint that fetches car parts from the `carParts` collection. Supports optional query params for filtering: `?brand=BMW&category=Brakes&condition=New`. Returns `{ success: true, data: CarPartInterface[] }`.

Include seed data logic (similar to `businessInfo.ts`) that seeds the collection with the existing 8 mock parts from `CarParts/page.tsx` on first read, so the app has data out of the box.

**Acceptance Criteria:**
- [ ] `GET /api/carparts` returns all parts from DB
- [ ] Query params filter correctly: `brand`, `category`, `condition`
- [ ] Collection is seeded with initial data on first read
- [ ] Response shape: `{ success: boolean, data: CarPartInterface[] }`
- [ ] Rate limited (10 requests / 15 min window — reuse `createRateLimiter`)

**Dependencies:** Task 9
**Risk:** Low
**Estimated Effort:** Medium (1–2 hr)
**Standards:** SEO — ensure API returns proper cache headers for CDN

---

### Task 11: Create Admin Car Parts API Route

**Layer:** API
**Files to create:**
- `src/app/api/admin/carparts/route.ts` — CRUD endpoints for admin

**Description:**
Create admin-protected endpoints:
- `GET` — list all car parts (with `inStock` filter option)
- `POST` — create a new car part
- `PUT` — update an existing car part (by `_id`)
- `DELETE` — delete a car part (by `_id`)

All endpoints require `isAuthenticated()`. Input validation via Zod or manual checks. Follow the pattern in `src/app/api/admin/cars/route.ts`.

**Acceptance Criteria:**
- [ ] All 4 HTTP methods work correctly
- [ ] Auth check on all methods (401 if not authenticated)
- [ ] Input validation on POST/PUT (name, brand, category, price required)
- [ ] Returns `{ success: true }` on mutation, `{ success: true, data: [...] }` on GET
- [ ] Proper error responses with meaningful messages

**Dependencies:** Task 9
**Risk:** Low
**Estimated Effort:** Medium (2–3 hr)
**Standards:** None

---

### Task 12: Update Car Parts Page to Use DB Data

**Layer:** Page
**Files to modify:**
- `src/app/(main)/CarParts/page.tsx` — replace `mockCarParts` with server-side DB fetch
- `src/components/CarParts/CarPartsGrid.tsx` — update `CarPart` interface to use `CarPartInterface`, adjust field references
- `src/components/CarParts/FilterSection.tsx` — may need updates for dynamic filter options

**Description:**
Convert the Car Parts page from hardcoded mock data to a server component that fetches parts from MongoDB (via `getCarPartsCollection()`). Remove the `mockCarParts` array entirely. Update the `CarPartsGrid` component to accept `CarPartInterface[]` instead of the local `CarPart` type. The `handleReservePart` function should be updated to either (a) link to the contact/enquiry page with pre-filled part details, or (b) show a toast confirming the enquiry was noted.

**Acceptance Criteria:**
- [ ] No hardcoded mock data remains in the page
- [ ] Page fetches parts from MongoDB at request time (server component)
- [ ] `CarPartsGrid` uses `CarPartInterface` from `src/lib/interfaces.ts`
- [ ] Filters work with dynamic data (brands, categories, conditions derived from actual DB data)
- [ ] Reserve button links to enquiry or shows contact info (no `alert()`)
- [ ] Empty state shown when no parts in DB
- [ ] Page still has proper metadata and SEO

**Dependencies:** Tasks 9, 10
**Risk:** Medium — user-facing page change
**Estimated Effort:** Medium (2–3 hr)
**Standards:** UX/UI Standards (design.md), SEO Standards (metadata already exists)

---

### Task 13: Create Admin Car Parts Management Page

**Layer:** Page
**Files to create:**
- `src/app/(admin)/admin/dashboard/carparts/page.tsx` — admin page for managing car parts

**Files to modify:**
- `src/components/Admin/Navigation/AdminNavigationTabs.tsx` — add "Car Parts" tab

**Description:**
Create an admin page similar to the existing car management page at `admin/dashboard/cars`. Should display a table/grid of car parts with inline actions (edit, delete) and an "Add Part" form/modal. Follow the existing admin patterns (client component, fetch from `/api/admin/carparts`, toast notifications for actions).

**Acceptance Criteria:**
- [ ] Admin navigation includes "Car Parts" tab
- [ ] Page displays all car parts in a table with columns: Name, Brand, Category, Price, Condition, In Stock, Actions
- [ ] "Add Part" button opens a form (modal or inline)
- [ ] Edit and delete actions work via API calls
- [ ] Toast notifications on success/error
- [ ] Loading state with skeleton/spinner
- [ ] Auth-protected (redirects to login if not authenticated)

**Dependencies:** Tasks 9, 11
**Risk:** Medium
**Estimated Effort:** Large (4–6 hr)
**Standards:** UX/UI Standards

---

### Task 14: Add Accessibility Quick Wins

**Layer:** Component / Layout
**Files to modify:**
- `src/app/(main)/layout.tsx` — add skip-to-content link
- `src/components/Header.tsx` — add `id="main-content"` target anchor or ensure `<main>` has it

**Description:**
Add a visually-hidden skip-to-content link as the first focusable element in the main layout. This is a WCAG 2.1 AA requirement (Success Criterion 2.4.1 Bypass Blocks).

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-red-600 focus:px-4 focus:py-2 focus:text-white">
  Skip to main content
</a>
```

Also add `id="main-content"` to the `<main>` element in the main layout.

**Acceptance Criteria:**
- [ ] Skip link is present and visually hidden by default
- [ ] Skip link becomes visible on keyboard focus (Tab key)
- [ ] Skip link navigates focus to main content area
- [ ] Axe accessibility audit reports no "bypass blocks" violation

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small (< 30 min)
**Standards:** UX/UI Standards (WCAG 2.1 AA)

---

### Task 15: Add JSON-LD Structured Data to Service Pages

**Layer:** Page (SEO)
**Files to modify:**
- `src/app/(main)/Services/page.tsx` — add `Service` JSON-LD
- `src/app/(main)/Services/Detailing/page.tsx` — add `Service` JSON-LD
- `src/app/(main)/Services/Tints/page.tsx` — add `Service` JSON-LD
- `src/app/(main)/Services/Repairs/page.tsx` — add `Service` JSON-LD
- `src/app/(main)/Recoveries/page.tsx` — add `Service` JSON-LD

**Description:**
Add JSON-LD structured data (`@type: "Service"`) to each service page using the existing `<JsonLd>` component from `src/components/SEO/JsonLd.tsx`. Include service name, description, provider (AutoDealer), price range, and area served where applicable.

Example:
```tsx
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Car Detailing",
  description: "Professional interior & exterior car detailing services",
  provider: {
    "@type": "AutoDealer",
    name: businessName,
  },
  areaServed: { "@type": "City", name: "Leeds" },
  priceRange: "£150 – £500",
}} />
```

**Acceptance Criteria:**
- [ ] Each service page has a `<script type="application/ld+json">` tag
- [ ] JSON-LD is valid per Schema.org validator
- [ ] Business name and prices pulled from business info where available
- [ ] No duplicate JSON-LD on any page

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small (< 1 hr)
**Standards:** SEO Standards

---

### Task 16: Add Car Parts Page to Sitemap

**Layer:** Config (SEO)
**Files to modify:**
- `src/app/sitemap.ts` — Car Parts page already included, verify; also add FAQ, Contact, AboutUs, AccidentClaims, Enquiry, privacy, terms if missing

**Description:**
Audit the sitemap to ensure ALL public pages are included. Currently missing from the sitemap: `/AboutUs`, `/AccidentClaims`, `/contact`, `/Enquiry`, `/FAQ`, `/privacy`, `/terms`. Add them with appropriate `changeFrequency` and `priority`.

**Acceptance Criteria:**
- [ ] All public-facing pages appear in the sitemap
- [ ] Priority values are sensible (informational pages: 0.4–0.5)
- [ ] `changeFrequency` is appropriate (legal pages: yearly, FAQ: monthly)

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small (< 30 min)
**Standards:** SEO Standards

---

## Test Requirements

| Task | Test Type | Description |
|------|-----------|-------------|
| 1 | API (existing) | Run `__tests__/api/bookings/lookup.test.ts` — should still pass |
| 2 | Component (fix) | Fix `__tests__/components/SEO/CarShareCard.test.tsx` type errors |
| 3 | Utility (fix) | Fix `__tests__/utils/filterCars.test.ts` type errors |
| 4 | Utility (fix) | Fix `__tests__/utils/auth.test.ts` type errors |
| 5 | Utility (fix) | Fix `__tests__/utils/businessInfo.test.ts` type errors + assertion |
| 6 | API (fix) | Fix `__tests__/api/bookings/quote.test.ts` mock setup |
| 7 | Config | Verify all test suites run (0 failures) after transform fix |
| 8 | Cleanup | Verify no tests imported deleted Shop components; remove any Shop tests |
| 9 | None | Interface-only change, validated by tsc |
| 10 | API (new) | Write `__tests__/api/carparts.test.ts` — GET, filtering, seeding |
| 11 | API (new) | Write `__tests__/api/admin/carparts.test.ts` — CRUD, auth, validation |
| 12 | Component (new) | Write `__tests__/components/CarParts/CarPartsGrid.test.tsx` — rendering, filtering |
| 13 | Component (new) | Write `__tests__/components/Admin/CarPartsManagement.test.tsx` — basic rendering |
| 14 | Accessibility | Extend existing accessibility tests or add `__tests__/components/SkipLink.test.tsx` |
| 15 | SEO (new) | Add JSON-LD validation test or extend `__tests__/components/SEO/JsonLd.test.tsx` |
| 16 | SEO (existing) | Verify sitemap test exists or add one |

**Existing tests to watch for regressions:**
- All booking API tests (Tasks 1, 6)
- All component tests (Task 8 — deletion)
- Business info tests (Tasks 5, 7)

---

## Implementation Order

### Phase 1 — Test Debt & Health (No dependencies, fixes existing failures)

1. **Task 7:** Fix Jest transform for `bson` ESM module
2. **Task 1:** Fix source type error in booking lookup route
3. **Task 2:** Fix CarShareCard test — add `updatedAt`
4. **Task 3:** Fix filterCars test — add `featured`
5. **Task 4:** Fix auth test — read-only `NODE_ENV`
6. **Task 5:** Fix businessInfo test — undefined props + assertion
7. **Task 6:** Fix quote API test — mock email setup

**Exit gate:** `npx tsc --noEmit` = 0 errors, all tests pass (component + API)

### Phase 2 — Dead Code Cleanup (No dependencies)

8. **Task 8:** Remove dead Shop/Collection components

**Exit gate:** No dead code, build still passes

### Phase 3 — Car Parts Foundation (Database + API)

9. **Task 9:** Add `CarPartInterface` and MongoDB model
10. **Task 10:** Create public car parts API route
11. **Task 11:** Create admin car parts API route

**Exit gate:** API routes work, new tests pass

### Phase 4 — Car Parts UI (Depends on Phase 3)

12. **Task 12:** Update Car Parts page to use DB data
13. **Task 13:** Create admin car parts management page

**Exit gate:** Car Parts fully functional end-to-end

### Phase 5 — SEO & Accessibility Polish

14. **Task 14:** Add skip-to-content link (accessibility)
15. **Task 15:** Add JSON-LD to service pages (SEO)
16. **Task 16:** Complete sitemap coverage (SEO)

**Exit gate:** Full accessibility + SEO audit pass

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Jest transform change breaks other tests | Medium | Run full suite after config change; revert if regressions appear |
| businessInfo re-seeding makes update tests unreliable | Low | Fix test expectations to work WITH re-seeding, don't fight the pattern |
| Removing Shop components breaks something undiscovered | Low | Confirmed by grep: zero imports. Git history preserves code if needed |
| Car Parts DB model needs future schema changes | Low | Keep interface flexible; use MongoDB's schemaless nature |
| Admin car parts page is large effort | Medium | Reuse existing admin patterns (CarView, BookingsTab) as templates |

---

## Open Questions

None — all requirements are clear. The user confirmed the scope: complete missing features, improve quality/consistency, and fix test debt.
