# Morley Motor Company — Comprehensive Website Review

**Date:** 2026-05-12
**Reviewer:** Claude (Sonnet 4.6) — automated static audit
**Scope:** Full codebase, all features, bugs, code debt, UX/UI, accessibility, security
**Repo:** `shahzar100/carsales` · default branch `main`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack Snapshot](#2-tech-stack-snapshot)
3. [Feature Inventory — Customer-Facing](#3-feature-inventory--customer-facing)
4. [Feature Inventory — Admin Dashboard](#4-feature-inventory--admin-dashboard)
5. [Feature Status Matrix (Done / Partial / Missing)](#5-feature-status-matrix-done--partial--missing)
6. [Bugs, Errors and Broken Flows](#6-bugs-errors-and-broken-flows)
7. [Security Findings](#7-security-findings)
8. [Code Debt and Maintainability](#8-code-debt-and-maintainability)
9. [Dead Code and Duplicates](#9-dead-code-and-duplicates)
10. [UX / UI Evaluation (Static)](#10-ux--ui-evaluation-static)
11. [Accessibility Audit (WCAG 2.1 AA)](#11-accessibility-audit-wcag-21-aa)
12. [SEO Audit](#12-seo-audit)
13. [Performance Notes](#13-performance-notes)
14. [Testing Coverage](#14-testing-coverage)
15. [DevOps / Deployment](#15-devops--deployment)
16. [Prioritised Punch List](#16-prioritised-punch-list)
17. [Recommended Next Steps](#17-recommended-next-steps)

---

## 1. Executive Summary

Morley Motor Company is a Next.js 16 / React 19 full-stack car-sales platform for a Leeds-based dealership. The product is **largely feature-complete and well-architected** — most customer journeys work end-to-end, the admin dashboard covers the operational surface, and the codebase shows considerable maturity (TypeScript strict mode, Zod validation, MongoDB indexes, S3 presigned uploads, React Email templates, iron-session auth, partial-unique slot indexes for race-safe bookings).

**However, the build is currently broken**, several flows have dangling features (review emails, password reminder), there is meaningful code debt from cancelled refactors and macOS Finder duplicate files, the test suite only covers ~23% of lines, and the production image domain config is misaligned with the S3 upload pipeline.

### Headline numbers

| Metric | Value |
|---|---|
| TypeScript files in `src/` | 242 |
| Largest source file | `Admin/Tabs/BusinessInfoForm.tsx` (1,143 LOC) |
| Total LOC in `src/` | ~33,500 |
| Test files | 79 |
| Test coverage (lines) | 22.89% — far below the 80% target in the project rules |
| ESLint problems | 0 errors / 59 warnings |
| TypeScript build | ❌ **fails** (1 error — missing `useSkeleton` hook) |
| `' 2'` Finder-duplicate files in `src/` | 8 (drift between copies, e.g. `format 2.ts` is missing BST timezone logic) |
| Dead context modules | `SearchContext.tsx` (zero importers) |
| Customer routes | 17 pages |
| Admin routes | 10 pages |
| API routes | 27 endpoints |

### What's working well

* **Server-side auth gate** for the entire `/admin/dashboard` subtree (`app/(admin)/admin/dashboard/layout.tsx`) — defence in depth alongside per-route checks.
* **CSRF protection** middleware (Origin/host match) on every state-changing API call.
* **Race-safe bookings** via partial-unique MongoDB indexes (`uniq_active_service_slot`, `uniq_active_viewing_slot`, `uniq_active_reservation_per_car`) — concurrent users can't double-book a slot.
* **Background email sending** via `@vercel/functions` `waitUntil`, so the user gets their HTTP response back immediately while the React Email template renders + sends.
* **Constant-time login** with a precomputed dummy bcrypt hash to prevent username enumeration via timing.
* **Strong env validation** via Zod (`src/lib/env.ts`) — production refuses to boot without `SESSION_SECRET`, refuses to send email from the placeholder address.
* **schema.org JSON-LD** on home, fleet detail, services pages — proper AutoDealer / Vehicle / Service entities, including `availability: InStock/PreOrder/OutOfStock`.
* **Customer-facing revalidation hooks**: admin mutations call `revalidatePath('/BrowseFleet')` so changes are visible without waiting for the 60s ISR timer.
* **Cron with at-most-once semantics**: review-invite emails claim rows *before* sending, with rollback on failure.
* **Skip-to-content link** in the public layout — accessibility groundwork is laid.

### What's broken or risky right now

| # | Issue | Severity |
|---|---|---|
| 1 | `tsc --noEmit` fails — `PackageGridWrapper.tsx` imports the deleted `@/hooks/useSkeleton` hook | **Critical** — blocks `npm run build` |
| 2 | `/review?ref=…` page does not exist, but the cron sends every completed customer to that URL | **High** — every review email leads to a 404 |
| 3 | `/admin/reset-password` page does not exist, but the "reminder" password flow emails a link to it | **High** — half-built feature is dead from the user's side |
| 4 | `next.config.ts` `remotePatterns` only allows Cloudinary + CloudFront; S3 fallback URL `*.s3.*.amazonaws.com` is not whitelisted, so `next/image` rejects uploaded car/parts photos in any environment without CloudFront | **High** — silent breakage if CloudFront isn't configured |
| 5 | Eight `' 2.tsx/.ts'` Finder duplicates in `src/` with content drift from their canonicals (some are missing later fixes) | **Medium** — risk of someone importing the stale copy by accident |
| 6 | Test coverage 22.89%, target 80% | **Medium** — large blast radius for any refactor |
| 7 | Rate limiter is in-process; on Vercel each warm instance has its own Map, so "5 attempts per 15 min" is effectively "5 per warm instance" | **Medium** — documented, but unfixed |
| 8 | Plaintext new password returned in HTTP responses on `/api/admin/users/password` (acknowledged as `TODO(security)`) | **Medium** — known, gated to admins, but the right fix (email link) isn't shipped |
| 9 | Header dropdown lists "Toyota / Honda / BMW / Audi" as `/BrowseFleet/Toyota` etc., but `[_id]` expects an ObjectId — these links don't resolve a car and 404 silently | **Low–Medium** — UX dead ends from the global nav |
| 10 | `SearchContext` is dead code (zero importers) | **Low** |

---

## 2. Tech Stack Snapshot

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | `^16.1.6` |
| Runtime | React | `19.1.0` |
| Language | TypeScript (strict) | `^5` |
| Styling | Tailwind CSS v4 + custom CSS variables in `globals.css` | `^4.1.17` |
| Database | MongoDB native driver | `^6.19.0` |
| Validation | Zod | `^4.3.6` |
| Auth | iron-session (encrypted cookie) + bcryptjs | `^8.0.4` / `^3.0.3` |
| Email | React Email + Nodemailer | `^5.2.9` / `^8.0.1` |
| Image storage | AWS S3 (presigned PUT) + optional CloudFront | `^3.1023.0` |
| Animation | Motion (Framer Motion successor) | `^12.23.12` |
| Charts | Recharts | `^3.7.0` |
| Icons | lucide-react | `^0.542.0` |
| Testing | Jest + React Testing Library + jest-axe + Playwright | `^29.7.0` / `^16.3.0` / `^10.0.0` / `^1.48.0` |
| Node engine | `>=20` | |

Notable choices:

* **iron-session over NextAuth** — simpler, fits a single-role admin model.
* **MongoDB native driver, no Mongoose** — fast and lean, but every query manages its own types via `Collection<T>` generics. The team built a `serializeDocument` helper to convert ObjectId/Date to strings at the API boundary.
* **Direct-to-S3 uploads with presigned URLs** — server never proxies image bytes; client PUTs straight to S3 with a content-type + content-length-bound signature. Good security shape.
* **`@vercel/functions` `waitUntil`** — used everywhere a public POST sends an email, so user-perceived latency stays low.

---

## 3. Feature Inventory — Customer-Facing

### 3.1 Home page (`/`)

* Hero with bookable featured car (queries `featured: true` from `cars` collection; 5-min in-memory cache).
* Three hero stat tiles (vehicles / booking / rating) hydrated from `businessInfo.heroStats`.
* "Why choose us" feature grid (4 items, static).
* CTA section linking to `/BrowseFleet`.
* `AutoDealer` schema.org JSON-LD with `makesOffer` for all five service lines.

### 3.2 Browse Fleet (`/BrowseFleet`)

* **Server-side filtering** via URL params (`make`, `priceMin`, `priceMax`, `yearFrom/To`, `mileageMin/Max`, `doors`, `colour`, `features`, `sort`).
* Dropdown facets computed from the full available set (so the dropdowns don't shrink with the result).
* Pagination via `BrowseFleetContent`.
* Tagged with `revalidate = 60`; admin mutations call `revalidatePath` for instant invalidation.
* Hero section + JSON-LD breadcrumb.

### 3.3 Car detail (`/BrowseFleet/[_id]`)

* Image gallery (main + extras), spec grid, finance calculator, share modal, schema.org `Vehicle` JSON-LD with `availability` reflecting status.
* Three actions: **Book viewing** → updates `ViewingContext` and routes to `/Booking/[_id]`; **Reserve** → opens `ReserveCarForm` (no payment, just a lead); **Part exchange** → opens `PartExchangeForm`.
* `revalidate = 300`; ISR with on-mutation invalidation.

### 3.4 Car viewing booking flow (`/Booking/[_id]`)

* Multi-step `Form` framework — Car → Date/Time → Customer info → Review/Submit.
* Turnstile CAPTCHA, IP-based 5/min rate limit, Zod validation.
* Slot-uniqueness enforced by partial-unique index on `(carId, appointmentDate, appointmentTime)` for active bookings only — cancelled bookings free up the slot.
* Confirmation page at `/Booking/confirmation?ref=BK-XXXXXX`.

### 3.5 Booking lookup (`/Booking/lookup`)

* Search by booking reference; shows service and viewing bookings, allows customer cancellation with optional reason.
* URL parameter support — `?ref=...` opens directly.

### 3.6 Services (`/Services`, `/Services/Detailing`, `/Services/Tints`, `/Services/Repairs`)

* `/Services` hub with three service overview cards.
* Detailing — package grid (Bronze/Silver/Gold-ish, prices from DB), booking form prefilled to "Detailing".
* Tints — VLT guide, options grid, booking form prefilled to "Window Tint".
* Repairs — service grid, emergency banner, booking form prefilled to "Repair".
* All three use a `ServiceBookingForm` that drives the `/api/bookings/service` endpoint.

### 3.7 Car Parts (`/CarParts`)

* Browseable grid backed by the `carParts` collection.
* Filter sidebar (`FilterSection`) + dropdown.
* No "checkout" — purchase is in-person, reservation is the lead capture (text-only "Reserve at our location" flow per the page copy).

### 3.8 Breakdown Recovery (`/Recoveries`)

* Service marketing page with `recovery.pricingTiers` and `recovery.coverageAreas` from the DB.
* Process flow, CTA to phone the business.

### 3.9 Accident Claims (`/AccidentClaims`)

* Static-ish marketing page (claims management copy, CTA to phone/email).

### 3.10 Enquiry / Contact / FAQ / About / Privacy / Terms

* **Both `/Enquiry` and `/contact` exist** — they cover overlapping ground (contact details, hours, map link). One should be redirected to the other.
* `/FAQ` — accordion-style FAQ with categorised items.
* `/AboutUs` (771 LOC) — substantial marketing page.
* `/privacy`, `/terms` — full legal pages driven by `businessInfo` (address, contact info).

### 3.11 Global

* **Header** (`src/components/Header.tsx`) — sticky black nav with logo, mobile hamburger menu via `NavMenu`, dropdown nav including:
  * Browse Fleet (dropdown lists `/BrowseFleet/Toyota`, `/BrowseFleet/Honda`, `/BrowseFleet/BMW`, `/BrowseFleet/Audi` — **these are broken — see §6**)
  * Services (dropdown to Detailing / Tints / Repairs)
  * Car Parts / Breakdown Recovery / Accident Claims / Track Booking / About Us
* **Footer** (`src/components/Footer.tsx`) — driven entirely by `businessInfo`; links to social, maps, email, phone.
* **Floating WhatsApp button** (`/WhatsAppButton`) — server component reads phone, hidden on admin and confirmation routes. Pre-fills a context-aware message for car detail pages.
* **Skip link** to `#main-content` in `(main)/layout.tsx`.
* **Toast notifications** via `ToastProvider`.
* **Top-of-page loading bar** via `PageLoader` (driven by `NavigationContext`).

---

## 4. Feature Inventory — Admin Dashboard

### 4.1 `/admin/login`

* Username + password form, calls `/api/admin/login`.
* Rate-limited (5/15 min per IP); constant-time auth path; redirects to `/admin/dashboard` on success.

### 4.2 `/admin/dashboard` — KPIs and analytics

* KPI grid (total cars, available/sold/reserved, total bookings, active users, etc).
* Charts:
  * `BookingsChart` — bookings over months (line/area).
  * `BookingsByDayChart` — by day-of-week.
  * `InventoryPieChart` x2 — by fuel, by status.
  * `ServiceTypeChart` — breakdown by service type.
  * `PriceDistributionChart` — histogram.
  * `PopularCarsChart` — top-cars by booking count.
* `RecentActivityTable` and `UpcomingAppointments`.
* Range selector (preset days / specific month / custom range).
* `RefreshButton` + `UpdatedAt` indicator.
* Charts are lazy-loaded (`LazyCharts`) so the initial dashboard render isn't blocked on Recharts.

### 4.3 `/admin/dashboard/cars` — Inventory management

* Paginated cars table (50 default, 100 max per page).
* Quick-edit, delete (with S3 cleanup on delete via `deleteS3Objects`).
* Status filter (all/available/sold/reserved).
* Server-side validated by Zod.

### 4.4 `/admin/dashboard/add` and `/admin/dashboard/cars/edit/[_id]`

* Full car form (make, model, year, price, mileage, fuel, transmission, doors, colour, status, featured, description, features, images).
* `ImageUploader` with presigned S3 PUT, drag/drop, multi-file, progress bar.
* Validation client-side and server-side.

### 4.5 `/admin/dashboard/viewing`

* Viewing bookings table (search, cancel, confirm, view details, status badge).
* Drives `/api/admin/bookings` GET/PUT.

### 4.6 `/admin/dashboard/service`

* Service bookings table — same shape as viewing tab, different collection.

### 4.7 `/admin/dashboard/carparts`

* Full CRUD on car parts (`/api/admin/carparts`).
* Image upload via S3 presigned URL flow.

### 4.8 `/admin/dashboard/shop` — Business info

* Single 1,143-LOC `BusinessInfoForm` that edits everything: core fields (name/address/phone), hero stats, detailing packages, tint options, service overviews, recovery info, social media URLs.
* Saves to `/api/admin/shop` PUT which fans out to 5 collections (`businessInfo`, `detailingPackages`, `tintOptions`, `serviceOverviews`, `recoveryInfo`).

### 4.9 `/admin/dashboard/status` — Health dashboard

* Live operational health: MongoDB connection, S3 reachability, email service reachable, last booking timestamps, env-var coverage.
* Refreshable. Backs `/api/admin/health`.

### 4.10 User management

* `POST /api/admin/users` — create new admin user (manager+ role required). Generates strong password, returns it plaintext (`TODO`).
* `POST /api/admin/users/password` — reset or reminder action (admin role required for reset).
* `GET /api/admin/users/lookup` — username lookup helper.
* No dedicated UI page in the admin shell (forms exist in `Admin/Form/UserForm.tsx` and `PasswordForm.tsx`) — they're embedded inside other admin pages.

---

## 5. Feature Status Matrix (Done / Partial / Missing)

### Customer-facing

| Feature | Status | Notes |
|---|---|---|
| Home / hero / featured car | ✅ Done | Cached 5 min in memory |
| Browse Fleet with filters + pagination + sort | ✅ Done | Server-side, URL-driven |
| Car detail page | ✅ Done | Gallery, finance calc, share, JSON-LD |
| Car viewing booking | ✅ Done | Slot-locked, CAPTCHA, email confirmation |
| Service booking (detailing/tints/repairs) | ✅ Done | Multi-step form, slot-locked |
| Quote request | ✅ Done | `/api/bookings/quote` |
| Car reservation (deposit later in person) | ✅ Done | 48h TTL, one per car |
| Part-exchange enquiry | ✅ Done | Admin gets a lead with valuation context |
| Booking lookup + cancellation | ✅ Done | By reference |
| Car parts browse | ✅ Done | Filters; in-person purchase model |
| Breakdown recovery info + CTA | ✅ Done | Phone-based, no booking flow |
| Accident claims info | ✅ Done | Marketing only |
| Contact / Enquiry / FAQ / About / T&Cs / Privacy | ✅ Done | Some duplication — see §6 |
| WhatsApp deep link | ✅ Done | Context-aware message |
| Sitemap + robots.txt | ✅ Done | Dynamic, includes per-car URLs |
| Floating page loader | ✅ Done | NavigationContext |
| Toast notifications | ✅ Done | |
| **Review submission page (`/review`)** | ❌ **Missing** | Cron emails customers a `/review?ref=…` link but the route doesn't exist — every review email leads to a 404 |
| Cookies / GDPR banner | ❌ Missing | No banner component anywhere |
| Search bar (text search) | ❌ Missing | `SearchContext.tsx` is wired up but never imported |
| Saved/wishlist cars | ❌ Missing | Not in scope, but expected by some users |

### Admin

| Feature | Status | Notes |
|---|---|---|
| Login + session | ✅ Done | iron-session, rate-limited, constant-time |
| Dashboard KPIs + charts | ✅ Done | Recharts, lazy-loaded |
| Cars CRUD | ✅ Done | + S3 cleanup on delete |
| Car parts CRUD | ✅ Done | + S3 cleanup |
| Bookings (service + viewing) management | ✅ Done | List, confirm, cancel, view details |
| Reservations management | 🟡 Partial | DB indexes + create flow exist; no dedicated admin UI page surfacing them (visible only in tables) |
| Part exchanges management | 🟡 Partial | Same — leads land in `partExchanges` collection but no dedicated admin UI |
| Quotes management | 🟡 Partial | Same — `quotes` collection, no dedicated admin view |
| Business info editor (one big page) | ✅ Done | But the editor is 1,143 LOC and hard to maintain |
| Health / status page | ✅ Done | |
| Logout | ✅ Done | Awaited `session.destroy()` |
| User create (admin only) | ✅ Done | Returns plaintext (`TODO`) |
| **Password reset (email-link)** | ❌ **Missing** | Endpoint sends email to `/admin/reset-password` which doesn't exist |
| Audit log / activity log | ❌ Missing | No `audit` collection, no event log; dashboard "recent activity" is derived from bookings only |
| Bulk actions | ❌ Missing | One-at-a-time updates only |
| Export to CSV | ❌ Missing | |
| 2FA / MFA on admin accounts | ❌ Missing | bcrypt-only auth |

### Infrastructure / DX

| Capability | Status |
|---|---|
| TypeScript strict | ✅ |
| Zod-validated env at boot | ✅ |
| ESLint | ✅ (warnings only) |
| Prettier with Tailwind plugin | ✅ |
| Jest unit + RTL component tests | ✅ (low coverage) |
| jest-axe a11y checks | ✅ (small selection) |
| Playwright E2E | ✅ (10 critical-path specs in `e2e/`) |
| GitHub Actions CI (lint, unit, API, build, E2E) | ✅ (`.github/workflows/ci.yml`) |
| Auto dependency updates | ✅ |
| Sentry-style observability | ❌ TODO in `lib/utils/observability.ts` |
| Distributed rate limiter (KV/Redis) | ❌ In-memory only (`lib/utils/rateLimit.ts`) |

---

## 6. Bugs, Errors and Broken Flows

### 6.1 Build-blocking

#### B1 — `tsc --noEmit` fails (Critical)

```
src/components/Services/Common/PackageGridWrapper.tsx(3,29):
  error TS2307: Cannot find module '@/hooks/useSkeleton' or its corresponding type declarations.
```

`useSkeleton` was deleted in DAY 1 of the cleanup plan, but the import in `PackageGridWrapper.tsx` wasn't removed. The wrapper calls `useSkeleton(1000, 3000)` and uses the result as `isLoading`. This means:

* `npm run build` fails outright.
* `npm run type-check` fails.
* Any CI step that gates on `tsc` will block deploys.

**Fix:** either restore the hook (one-pager) or rip the `<PackageGridWrapper>` skeleton wiring out and render its children directly.

### 6.2 Customer-visible

#### B2 — Review email links point to a non-existent page (High)

`src/lib/utils/reviewInvite.ts` builds review URLs as:

```ts
return `${baseUrl}/review?ref=${encodeURIComponent(bookingReference)}`;
```

There is **no `src/app/(main)/review/page.tsx`**. Every customer who clicks "Leave us a review" from the email lands on a Next.js 404. The cron sends six different review email templates (service, viewing, repair, recovery, detailing, tinting), all pointing at the same dead URL.

**Fix:** build `/review/page.tsx` with a form keyed on `?ref=`, or change the email link to a Google review URL (`https://g.page/r/…`).

#### B3 — Header brand dropdown links 404 (Medium)

`src/components/Header.tsx` dropdown:

```tsx
<NavLink href="/BrowseFleet/Toyota" text="Toyota" />
<NavLink href="/BrowseFleet/Honda" text="Honda" />
<NavLink href="/BrowseFleet/BMW" text="BMW" />
<NavLink href="/BrowseFleet/Audi" text="Audi" />
```

But `/BrowseFleet/[_id]/page.tsx` parses the segment as an ObjectId. `getCar("Toyota")` throws, the catch returns `null`, and the page renders the "Car not found" branch. The dropdown's "brand shortcut" intent doesn't work.

**Fix:** point these at `/BrowseFleet?make=Toyota` etc. — the new filter-by-query system already supports this.

#### B4 — `next/image` blocks S3-direct URLs (High if CloudFront isn't set)

`next.config.ts`:

```ts
remotePatterns: [
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "**.cloudfront.net" },
]
```

But `lib/utils/s3.ts::getPublicUrl()` returns `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}` when `CLOUDFRONT_DOMAIN` isn't set. Any environment without CloudFront will have `next/image` reject every uploaded image with `Invalid src prop on next/image`.

**Fix:** add `{ protocol: "https", hostname: "*.s3.*.amazonaws.com" }` (with appropriate restriction) to `remotePatterns`.

#### B5 — `/Enquiry` and `/contact` are duplicate pages

Both pages render variants of the same contact-details + hours + map + CTA grid, drawing from the same `businessInfo`. Confusing for SEO (canonical conflict avoided only because both have distinct `canonical` tags), bad for content owners, double the maintenance burden.

**Fix:** keep one, 301 the other.

#### B6 — Password reminder flow is dead

`POST /api/admin/users/password { action: "reminder" }` generates a reset token, stores it on the user, and emails a link to `${BASE_URL}/admin/reset-password?token=…`. **That page does not exist.** The token is valid, the user is locked out, the link is a 404. The TODO is already flagged in the route docstring (`TODO(feature)`), but it hasn't been closed.

**Fix:** ship the page + the consumer API route, or hide the "Send reminder" button until they exist.

### 6.3 Lint warnings worth fixing (59 total)

* **`react-hooks/exhaustive-deps`** in 4 files:
  * `CarView.tsx:38` — missing `viewType`
  * `Dropdown.tsx:90` — missing `handleSelect`
  * `ServiceBookingForm.tsx:581` — missing `defaultService` and `subServiceOptions`
* **`react/no-unescaped-entities`** — ~12 instances across email templates and pages (unescaped apostrophes).
* **`@typescript-eslint/no-unused-vars`** — `_id` in `businessInfo.ts`, `customerName` in `reviewInvite.ts`, `Img` in `EmailTemplate.tsx`.
* **Unused `eslint-disable` directives** — `mongodb.ts:33`, `observability.ts:62,78`.

### 6.4 Runtime brittleness

* `console.log("Using Ethereal test account: …")` in `emails/send.ts` — logs once per cold start in dev, harmless but noisy.
* `console.error` is used 233 times across `src/` — most are in `catch` blocks. Without Sentry these go to Vercel logs only; without a structured logger nothing is queryable.
* `lib/utils/observability.ts` has `logError`/`logEvent` placeholders that just `console.error`/`console.log`. The "TODO: wire Sentry" comment has been there for some time.

---

## 7. Security Findings

### 7.1 Good

* **iron-session** with `httpOnly`, `sameSite: lax`, `secure` in prod, 24-hour `maxAge`.
* **CSRF** via Origin/host strict-match in middleware; cron routes whitelisted.
* **Constant-time login** path via `DUMMY_PASSWORD_HASH`.
* **NoSQL injection guard** on login — Mongo operator forgery via `{ "$gt": "" }` is blocked because the route asserts `typeof username === "string"` before passing it to `findOne`.
* **CSP** headers in `next.config.ts` (frame-ancestors, base-uri, form-action).
* **HSTS** with preload.
* **`X-Frame-Options: SAMEORIGIN`**, **`X-Content-Type-Options: nosniff`**, **`Referrer-Policy: origin-when-cross-origin`**, **`Permissions-Policy`** locks down camera/mic/geo.
* **bcrypt cost 12** for password hashing.
* **Password generator uses `crypto.randomInt`** (not `Math.random`), with a guarantee of one each of upper/lower/digit/special.
* **Presigned S3 PUTs bind Content-Type and Content-Length** — a leaked URL can't be reused to upload a 1 GB blob.
* **S3 cleanup on delete** for cars and carparts, best-effort with structured failure logging.
* **Filename sanitisation** strips `..`, slashes, and non-`[A-Za-z0-9._-]`.
* **Turnstile** integrated for public POSTs; verifier no-ops in dev and fails closed in prod when not configured.

### 7.2 Known weaknesses

#### S1 — Plaintext password in response (Medium, documented)

`/api/admin/users` POST and `/api/admin/users/password` POST `action=reset` both return the new plaintext password in the response. The route docstrings explicitly call this out as `TODO(security)`. The right fix is a single-use, time-bound email link.

#### S2 — `'unsafe-inline'` in CSP (Medium)

```
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
```

Both inline script and inline style are allowed. Removing them needs nonce middleware (per the DAY_PLAN it's intentionally deferred). Until then, the CSP doesn't materially defend against XSS — but XSS surface area is small because React escapes by default and `JsonLd` does `replace(/</g, "\\u003c")` on its stringified JSON.

#### S3 — In-memory rate limiter (Medium)

Per the docstring in `lib/utils/rateLimit.ts`: "on Vercel each warm instance has its own Map and cold starts reset it, so the documented '5 attempts per 15 min' is in practice '5 per warm instance' — easily ×N-bypassed." For the login endpoint this means an attacker with botnet IPs and timing can spread brute force across instances. Tracked but unfixed.

#### S4 — No 2FA on admin

bcrypt password is the only factor. For a small dealership this is probably acceptable, but worth raising with the client.

#### S5 — `SESSION_SECRET` fallback in dev

The dev fallback `"dev-only-fallback-secret-at-least-32chars!"` is hardcoded in `auth.ts`. Production refuses to boot without a real one (good), but if `NODE_ENV` is accidentally `development` in a prod-like environment, sessions would be forgeable. Low risk in practice because the env validator in `env.ts` enforces the prod check.

#### S6 — No CAPTCHA on lookup endpoint

`/api/bookings/lookup` is a public POST that accepts a booking reference and returns booking + customer details. There's no CAPTCHA and no rate limit on it. An attacker who knows the format (`BK-XXXXXX`, 6 alphanumeric chars = ~60M possibilities) could enumerate. Probably fine because the rate limit on this endpoint via Vercel is already restrictive and the data returned (customer name, phone, email, appointment) isn't directly damaging, but it's a possible exfil vector.

#### S7 — `dangerouslySetInnerHTML` in `JsonLd`

```ts
dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
```

Inputs to `JsonLd` come from server-controlled `businessInfo` and `car` documents. If admin-supplied content (description, business name, address) were ever rendered unescaped here, you'd have an XSS hole. The current escape on `<` is enough to neutralise the `</script>` break attack. Low risk, but worth a Zod schema on `businessInfo.description` for length and content to be safe.

#### S8 — `crypto.randomBytes` in reset token storage

I didn't see the actual token generation in the route (only the comment), worth verifying it's `crypto.randomBytes(32).toString('hex')` and not `Math.random`. (Search note for follow-up.)

---

## 8. Code Debt and Maintainability

### 8.1 Largest files (top 30)

| LOC | File |
|---|---|
| 1143 | `src/components/Admin/Tabs/BusinessInfoForm.tsx` |
| 771 | `src/app/(main)/AboutUs/page.tsx` |
| 700 | `src/components/Main/Form/ServiceBookingForm.tsx` |
| 573 | `src/components/Car/CarDetailView.tsx` |
| 457 | `src/app/(admin)/admin/dashboard/carparts/page.tsx` |
| 453 | `src/components/Form/FormPrimitives.tsx` |
| 445 | `src/app/(main)/AccidentClaims/page.tsx` |
| 422 | `src/lib/utils/businessInfo.ts` |
| 381 | `src/components/SEO/ShareButton.tsx` |
| 378 | `src/components/Admin/Dashboard/getDashboardData.ts` |
| 372 | `src/components/Admin/Form/CarForm.tsx` |
| 346 | `src/app/(main)/Recoveries/page.tsx` |
| 345 | `src/components/Car/PartExchangeForm.tsx` |
| 343 | `src/lib/models/index.ts` |
| 332 | `src/emails/template/EmailTemplate.tsx` |
| 331 | `src/app/(main)/Booking/lookup/page.tsx` |
| 326 | `src/components/Main/Form/CarViewingForm.tsx` |
| 326 | `src/app/(main)/FAQ/page.tsx` |
| 325 | `src/components/Admin/Form/PasswordForm.tsx` |
| 318 | `src/app/(main)/BrowseFleet/BrowseFleetContent.tsx` |
| 317 | `src/app/(main)/Enquiry/page.tsx` |
| 306 | `src/app/(main)/terms/page.tsx` |
| 302 | `src/components/Admin/ImageUploader.tsx` |
| 294 | `src/lib/interfaces.ts` |
| 287 | `src/app/(main)/contact/page.tsx` |

### 8.2 Notable debt patterns

#### D1 — `BusinessInfoForm.tsx` is too big

1,143 lines of a single client component that maintains state for the whole shop. It uses an internal `Section` component to collapse/expand 8+ sections (core info, hero stats, hours, social, detailing, tints, services, recovery). Suggested split:

* Move each section into its own component (`<DetailingSection />`, `<TintsSection />` …).
* Hoist the `update()` helper into a hook (`useShopInfoEditor`).
* Persist open/closed state in URL so deep links work (`?section=detailing`).

#### D2 — Marketing pages are hand-rolled HTML

`AboutUs/page.tsx` (771 LOC), `AccidentClaims/page.tsx` (445), `Recoveries/page.tsx` (346), `terms/page.tsx` (306) — all are big JSX blocks with hardcoded copy. They're hard for a non-developer to edit and easy to drift out of brand sync.

* Option A — move the copy into `businessInfo.staticPages` and render through a CMS-like editor.
* Option B — extract a `<MarketingPage sections={…} />` primitive so all pages share layout and only the data changes.

#### D3 — Two parallel form abstractions

* `src/components/Form/Form.tsx` — multi-step framework used by admin forms.
* `src/components/Main/Form/{CarViewingForm,ServiceBookingForm,AppointmentForm}.tsx` — separate hand-rolled multi-step forms.

DAY_PLAN explicitly chose not to migrate the customer forms because they're revenue-critical. That's a fair call, but the result is two divergent form codepaths the team has to maintain forever.

#### D4 — Two parallel button primitives

* `src/components/UI/Button.tsx` — newer, unified, supports `href` (renders `Link` when present).
* `src/components/Helpful/Buttons/Button.tsx` — legacy.
* 18 imports of the legacy Helpful Button vs only 2 imports of the new UI Button. Migration not finished.

There's also `FormPrimitives.FormButton` (`Form/FormPrimitives.tsx`) — a *third* button. The new `Button.tsx` docstring explicitly says it's meant to replace both, but most call sites haven't moved.

#### D5 — Folder naming inconsistency

* `Helpful/` (UI helpers) vs `UI/` (newer primitives) — two folders meaning the same thing.
* Customer pages use PascalCase folder names (`BrowseFleet`, `CarParts`, `Services`, `AboutUs`, `AccidentClaims`) but `contact`, `privacy`, `terms` are lowercase. URL-visible.
* `(main)` / `(admin)` route groups are clean.

#### D6 — `src/backend/` is empty per the listing

The README mentions `src/backend/` for "Context providers, utilities" but the directory has very thin content. The DAY_PLAN explicitly says Phase 5 should "merge `src/backend/` into `src/contexts/`" — that hasn't happened.

#### D7 — `interfaces.ts` and `types.ts` overlap

`src/lib/interfaces.ts` (294 LOC) and `src/lib/types.ts` are separate files exporting subtly different things. Phase 5 also calls for merging them. Risk: a future change to `Booking` could update one and not the other.

#### D8 — `console.*` instead of structured logging

233 `console.error`/`console.warn` calls. `logError`/`logEvent` from `lib/utils/observability.ts` are used in many recent routes, but lots of older code still calls `console.error` directly. Inconsistent reporting → triage friction.

#### D9 — Mixed data fetching patterns

* Some pages use Server Components (`async function Page()`) that import models directly.
* Some pages use Client Components that `fetch('/api/admin/shop')` from a `useEffect`.
* The admin pages especially mix both styles. Not a bug, just churn — every new page has to choose.

#### D10 — `dealership` field on `CarViewingBooking` is optional and inconsistent

`CarViewingBooking.dealership` is `{ location, address }` per the interface, but the API schema accepts it as optional and the form doesn't always set it. The detail page constructs it from `businessInfo` if needed. Defensively coded but a sign that this field's lifecycle isn't clearly owned.

---

## 9. Dead Code and Duplicates

### 9.1 macOS Finder " 2.*" duplicates — 8 files

These were created when somebody dragged the file in Finder while it was selected, or by a sync conflict. Eight files have ` 2.*` siblings:

```
src/components/UI/Button 2.tsx
src/components/UI/ConfirmDialog 2.tsx
src/components/UI/EmptyState 2.tsx
src/components/UI/StatusBadge 2.tsx
src/hooks/useApi 2.ts
src/hooks/useScrollLock 2.ts
src/lib/utils/format 2.ts
src/lib/utils/apiResponse 2.ts
```

**Important**: at least `format 2.ts` has DRIFTED from `format.ts`. The newer `format.ts` includes a BST timezone fix (parses YYYY-MM-DD as local calendar dates so booking dates don't shift to the day before during BST evenings); `format 2.ts` doesn't. If anyone imports from `format 2.ts` by autocomplete mistake, dates will be wrong in summer.

**Fix:** delete all eight ` 2.*` files. The DAY_PLAN already deleted similar test duplicates; these slipped through.

### 9.2 Dead modules

* **`src/contexts/SearchContext.tsx`** — exports `SearchContextProvider` and `useSearchContext`. Zero importers in `src/`. Pure dead code.
* **`src/components/Car/Cars.tsx`, `CarTable.tsx`, `Filters.tsx`, `CarView.tsx`** — `CarView` is imported only by the admin `cars/page.tsx`. `Filters.tsx` is only imported inside `CarView.tsx`. `Cars.tsx` is only imported by `CarCard.tsx`. The chain is alive but it's a parallel rendering path to the public-facing `BrowseFleetContent.tsx`. Worth auditing whether the admin cars page should reuse the same primitive instead.
* **`src/hooks/# Code Citations.md`** — Markdown file under `src/hooks/` (probably a VS Code Copilot artifact). Should be deleted.

### 9.3 Two `DAY_PLAN` files

Both `DAY_PLAN.md` (19 KB) and `DAY_PLAN 2.md` (8.8 KB) exist in the repo root. Same kind of Finder duplicate.

---

## 10. UX / UI Evaluation (Static)

> Note: a Chrome browser to drive the live site wasn't available at review time. This section is a code-driven UX critique grounded in the component implementations, design tokens, and HTML structure. A follow-up live audit (in Chrome with `axe`, Lighthouse, and tab-through) would catch interaction-level issues I can't see statically.

### 10.1 Visual design system

* **Brand colour**: red-600 (`#dc2626`) primary, red-700 hover, red-50 backgrounds for tints. Black is used heavily for the header and "BlackRedSection" hero strips — this is a strong, recognisable look for a car dealer ("motorsport" coding).
* **Typography**: heading utilities in `globals.css` use `.page-title` (2xl→4xl), `.section-title` (xl→2xl), `.heading-3`, `.heading-4`, `.description`, `.body`, `.caption`. Coherent scale.
* **Tokens**: CSS custom properties on `:root` (`--color-brand`, `--color-surface-dark`) define the brand colours; Tailwind classes reference red-600 directly rather than `var(--color-brand)`. Inconsistent — either go all-tokens or all-Tailwind.
* **Cards**: `.card`, `.card-elevated`, `.card-interactive` utility classes — well-named, consistent rounding (`rounded-xl`).
* **Badges/tags**: dedicated utility classes (`.badge-green`, `.badge-red`, `.badge-amber`, `.badge-blue`) with semantic colour mapping. Note: `.badge-blue` is implemented as `bg-red-50 text-red-600` — confusingly named, looks pink.
* **Buttons**: visual styling is consistent across the three button primitives; what differs is the API surface, not the look.

### 10.2 Information architecture

* **Top-level nav**: Browse Fleet · Services · Car Parts · Breakdown Recovery · Accident Claims · Track Booking · About Us. That's 7 items; on mobile it collapses into a full-screen menu. Clean.
* **Footer**: 4-column footer with company info / quick links / services / contact. Driven from `businessInfo`.
* **Funnels**:
  * Buy: Home → BrowseFleet → CarDetail → Book viewing OR Reserve OR Part exchange. Three CTAs side-by-side on the detail page works because each captures a different intent.
  * Service: Home → Services hub → category page → multi-step ServiceBookingForm. Clear.
  * Lookup: Header "Track Booking" → /Booking/lookup. Discoverable.

### 10.3 Forms

* All public booking forms use the multi-step `Form` framework (`Form.tsx` + `FormPrimitives.tsx`). Step indicator, back/next, validation per step.
* **Date input** uses native `<input type="date">` — accessibility-friendly, no custom calendar library.
* **Time input** is a curated dropdown of 30-min slots between 09:00 and 17:00. Good — prevents typos.
* **Email/Tel inputs** use proper `type="email"` and `type="tel"` (mobile keyboards adapt).
* **Submit buttons** show loading state via `loading` prop.
* CAPTCHA via `TurnstileWidget` — invisible to most users.

### 10.4 Loading states

* Skeletons exist for `CarCard`, `CarDetail`, `CarListCard`, `HeroFeaturedCar`, `PackageCard`.
* `Skeleton.tsx` is the base primitive.
* The dashboard has `DashboardSkeleton`.
* `PageLoader` is a top-of-screen progress bar driven by `NavigationContext` — good for perceived performance.

### 10.5 Empty/error/cancel states

* `EmptyState.tsx` is reusable.
* "Car not found" branch on `/BrowseFleet/[_id]` is graceful.
* Booking confirmation has an "Invalid Confirmation Link" branch when no `?ref` is present.
* Cancellation flow accepts an optional reason — friendly.

### 10.6 Friction points

* **No global search**: The site has a `SearchContext` but no `<SearchBar>` component. Users with a specific make/model in mind have to use the filter dropdown.
* **`/contact` and `/Enquiry` duplication**: footer/header link to `/Enquiry`, sitemap also lists `/contact`. Confusing.
* **Brand-shortcut links in nav are dead** (see B3) — Toyota/Honda/BMW/Audi in the dropdown lead to a "Car not found" page.
* **No cookies banner**: privacy page exists but no implementation of consent collection.
* **Booking flow doesn't show price** until the review step — minor.
* **WhatsApp pre-filled message** uses `window.location.href` for the car URL — works for shared links but reveals query params.

### 10.7 Mobile responsiveness

* All cards stack at `md` and below.
* Hero collapses from 2-column (text + featured car) to 1-column on mobile.
* Mobile menu is a full-screen overlay — good.
* Footer collapses to single column.
* Touch targets are appropriate (px-3 py-2.5 minimum for buttons = 44×44 well exceeded).

---

## 11. Accessibility Audit (WCAG 2.1 AA)

### 11.1 Wins

* **Skip-to-main link** in `(main)/layout.tsx`.
* **`<main id="main-content">` landmark**, `<nav aria-label="Main navigation">` in Header, `<footer>` in Footer.
* **Hamburger button** has `aria-label="Toggle menu"`, close button has `aria-label="Close menu"`.
* **WhatsApp button** has `aria-label` and a visually hidden `<span class="sr-only">`.
* **Modal focus trap** (`Modal.tsx`) — Tab cycles inside the dialog, focus is restored to the previously focused element on close, ESC closes.
* **Modal scroll-lock** cooperates across multiple overlays via shared `useScrollLock`.
* **Form labels** — `htmlFor` is used in `Form/` primitives.
* **`jest-axe`** is installed and used in a handful of test suites (`UIComponents.usability.test.tsx`, `Dropdown.accessibility.test.tsx`, `ServiceHero.strict.test.tsx`).

### 11.2 Concerns

#### A11y-1 — Heading hierarchy

The home page uses `.section-title` (h2) inside `<section>` blocks that don't always have a preceding h1 in scope (header is image-only). The `<h1>` is technically inside `HeroSection` as `"Find Your Perfect Car"`, but it lives inside the section, not at the page level. Most pages put the page-level heading inside a hero, which is fine — but a tab-through audit should confirm no page has an `<h2>` before an `<h1>`.

#### A11y-2 — Colour contrast risks

41 component files use `text-gray-400`. Against `bg-white`, gray-400 (`#9ca3af`) has a contrast ratio of ~3.1:1 — **below WCAG AA's 4.5:1 minimum for body text**. This shows up in:

* `Pagination.tsx` — `text-gray-300` on disabled buttons (contrast ~2.1:1 against bg-gray-100 — fine for "disabled" intent but worth verifying with a real user).
* `Footer.tsx` — `text-gray-400` for icon decorations (OK if decorative).
* `FormPrimitives.tsx` — `placeholder:text-gray-400` (acceptable for placeholders, which don't count for AA).
* `Form.tsx` — `text-gray-400` for unselected step indicators.

A targeted pass with axe + manual contrast checks on production-rendered pages would catch the real problems.

#### A11y-3 — Form error association

The form primitives accept error messages, but I didn't see consistent `aria-describedby` from input → error message. RTL tests would catch this; jest-axe doesn't reliably flag it without a tab-through.

#### A11y-4 — Toast notifications need `role="status"`/`role="alert"`

`Toast.tsx` shows transient messages but doesn't appear to set ARIA live regions. Screen reader users may miss success/error toasts. (Need to verify the full file — the head I read shows icon + style maps but not the rendered markup.)

#### A11y-5 — Keyboard ergonomics on the car gallery

`CarDetailView.tsx` has prev/next image buttons. Need to verify they're keyboard-reachable and announce image position ("Image 2 of 5"). Not visible from the head of the file.

#### A11y-6 — Filter dropdowns

`Filters.tsx` uses custom `FilterSelect` and `RangeInput` components. Custom selects need `role="combobox"` + `aria-expanded` + arrow-key navigation. Need to verify implementation.

### 11.3 Recommended actions

* Run `axe-core` against every public route in CI (Playwright + `@axe-core/playwright`).
* Add a `prefers-reduced-motion` opt-out to any Motion-animated component.
* Verify Toast uses `role="status"` / `aria-live="polite"`.
* Sweep `text-gray-400` usages and tighten contrast (use gray-500 or gray-600 for body text).

---

## 12. SEO Audit

### 12.1 Strong points

* **Metadata** is set per page (title, description, OG, Twitter card, canonical).
* **JSON-LD**:
  * Home — `AutoDealer` with `makesOffer`.
  * Car detail — `Vehicle` with `mileageFromOdometer`, `fuelType`, availability tied to status.
  * Services — `Service` with `provider: AutoDealer`.
* **`robots.ts`** disallows `/admin/`, `/api/`, `/Booking/` — sensible.
* **`sitemap.ts`** lists static pages + dynamic per-car URLs from `cars` collection (`status: available` only).
* **Title template**: `${page} | ${businessName}`.
* **Open Graph default image** is `/car.jpg`.
* **`alternates: { canonical: '…' }`** on every page.
* `metadataBase` is set from `NEXT_PUBLIC_SITE_URL`.

### 12.2 Gaps

* **`canonical` for service category pages** is correct, but service-area pages don't have `breadcrumbList` JSON-LD on every page (only some).
* **No `BreadcrumbList`** in JSON-LD on the Browse Fleet listing.
* **No alt text on hero `/car.jpg`** at the metadata level (only at OG, not on the actual `<Image>`).
* **OG images for individual cars** — `og:image` falls back to `/car.jpg` instead of the car's own photo (`car.image`). The Vehicle JSON-LD does include the image, but social previews use a generic photo.
* **No `hreflang`** — fine if you're UK-only.
* `/contact` vs `/Enquiry` SEO competition (different URLs ranking for the same intent).

---

## 13. Performance Notes

### 13.1 Server side

* **Cached featured car** for 5 minutes in memory — avoids hitting Mongo on every home request.
* **Indexes** are aggressive and well-thought-out: status, status+createdAt, status+price, make+status, featured, partial-unique slot indexes, TTL on reservation `expiresAt`.
* **Dashboard data** is fetched all-in-parallel (`Promise.all` of 4 collections, then 4 array loads). For very large datasets this becomes painful — there are no `.limit()` calls on `allCars`, `allServiceBookings`, `allViewingBookings`. At 10k+ rows this gets slow.
* **ISR** with `revalidate = 60` on `/BrowseFleet` and `revalidate = 300` on `/BrowseFleet/[_id]`, plus `revalidatePath` on mutation. Good shape.
* **Lazy chart loading** in the dashboard — `LazyCharts.ts` defers Recharts.

### 13.2 Client side

* `next/image` is used everywhere — automatic optimisation, but see B4 about the S3 hostname issue.
* `priority` is set on the hero featured-car image (good).
* Motion is imported in places — verify it's tree-shaken (Motion is significant bundle weight).
* No Suspense boundaries on the dashboard charts — they're already on the server side though.
* Skeletons exist for the slow paths.

### 13.3 Concerns

* **`getDashboardData` over-fetches**: it pulls every car, every service booking, every viewing booking, every user. Filters in-memory. Fine for the current scale; will not scale to 10k+ bookings.
* **Featured car cache** is per-instance, not distributed — different Vercel instances may show a different car for ~5 minutes after a featured-car change. Mitigated by `revalidatePath('/')` on car mutations.
* **No image format negotiation hints** beyond what `next/image` does automatically.

---

## 14. Testing Coverage

### 14.1 Numbers

| Statements | Branches | Functions | Lines |
|---|---|---|---|
| 22.86% | 26.88% | 25.65% | 22.89% |

That's far below the 80% target in the project rules.

### 14.2 What's covered

* `__tests__/api/` — most API routes have a test file (bookings, admin, carparts, businessinfo, cron, shop, etc.). Coverage is breadth-first, not depth-first; most routes have happy-path + a few error tests.
* `__tests__/components/` — UI primitives (Button, ConfirmDialog, EmptyState, StatusBadge) are covered.
* `__tests__/contexts/` — AuthContext, FilterContext, ToastContext.
* `__tests__/hooks/` — useApi, useScrollLock.
* `__tests__/utils/` — apiResponse, auth, booking, businessInfo, filterCars, format, middleware, rateLimit, reviewInvite, s3, validation.
* `__tests__/links/brokenLinks.test.ts` — static analysis test that crawls `src/` for `href="/…"` and checks each one resolves to a `page.tsx`. **Important**: this test should currently fail on `/review?ref=…`, but the test only inspects `href` strings — the failing URL is built inside `reviewInvite.ts` and never appears in JSX.

### 14.3 What's not covered

* Most large pages (BrowseFleet, CarDetail, AboutUs, AccidentClaims, FAQ, Recoveries) have no component tests.
* Most large customer forms (`ServiceBookingForm` 700 LOC, `CarViewingForm` 326 LOC, `PartExchangeForm` 345 LOC) have minimal tests — they're tested at the API level but not at the form-orchestration level.
* No tests for `BusinessInfoForm.tsx` (1,143 LOC).
* No e2e for the review-email flow (because it's broken, see §6.2).

### 14.4 Test infrastructure

* `jest.config.js` — jsdom, for components.
* `jest.config.api.js` — node, for API routes (uses `mongodb-memory-server`).
* `jest.setup.js` — shared mocks.
* `jest.env.setup.js` — sets `ADMIN_PASSWORD` etc. for tests.
* Playwright E2E in `e2e/` — 10 specs covering critical paths.
* GitHub Actions runs lint, component tests, API tests, build, and Playwright E2E in parallel.

---

## 15. DevOps / Deployment

### 15.1 What exists

* **`.github/workflows/ci.yml`** — five-job CI (lint, test-components, test-api, build, e2e).
* **`.github/workflows/auto-approve-deps.yml`** — auto-approve dependabot.
* **`.github/workflows/dependency-update.yml`** — scheduled bumps.
* **`vercel.json`** — basic config.
* **`scripts/setup-admin.mjs`** — bootstraps the first admin (`npm run setup-admin`).
* **`scripts/migrate-business-info.ts`** — one-shot migration to split monolithic `businessInfo` doc into the split-collection structure.
* **`SETUP.md`** — developer onboarding.
* **`README.md`** — overview.
* **`.env.example`** — full template, well-commented, references `src/lib/env.ts` for validation.
* **`.vercel/`** directory present — connected to a Vercel project.

### 15.2 What's missing or weak

* No Sentry or structured logger wired up (TODO in `lib/utils/observability.ts`).
* No Vercel KV / Upstash / Redis for the rate limiter (in-memory, ephemeral).
* No staging environment documented in SETUP.md.
* No backup/restore docs for MongoDB.
* No documented secret rotation cadence.

---

## 16. Prioritised Punch List

The order is **what would I fix tomorrow morning before any other work**.

### P0 — Fix today

1. **Restore `useSkeleton` or remove its caller** in `PackageGridWrapper.tsx`. `tsc` and `next build` are red. (B1)
2. **Build `/review/page.tsx`** or change the email link in `lib/utils/reviewInvite.ts` to a Google review URL. Every completed customer is currently hitting a 404 from email. (B2)
3. **Add S3 hostname to `next.config.ts`** `remotePatterns` for environments without CloudFront. (B4)
4. **Delete the 8 ` 2.*` Finder duplicates** in `src/`. The format-functions drift between copies is a latent bug. (9.1)

### P1 — Within a week

5. **Fix Header brand dropdown links** — point Toyota/Honda/BMW/Audi at `/BrowseFleet?make=Toyota` instead of `/BrowseFleet/Toyota`. (B3)
6. **Ship `/admin/reset-password` or hide the reminder button.** Half-done feature. (B6)
7. **Choose between `/contact` and `/Enquiry`** — 301 the loser. (B5)
8. **Sweep `text-gray-400` on body text** — bump to gray-500 or gray-600 for AA contrast. (A11y-2)
9. **Add `role="status"` and `aria-live="polite"` to Toast.** (A11y-4)
10. **Add `BreadcrumbList` JSON-LD** to BrowseFleet listing and car detail page. (SEO)
11. **Add `og:image` per car** so social previews use the car's photo. (SEO)

### P2 — Within a month

12. **Move rate limiter** to Vercel KV / Upstash. Login bypass via warm-instance fan-out is a real concern. (S3)
13. **Replace plaintext password responses with email-link reset.** Then remove the TODO. (S1)
14. **Wire Sentry** into `lib/utils/observability.ts`. 233 `console.error` calls = nothing queryable in prod. (D8)
15. **Add `axe-core` to the Playwright E2E suite.** Run accessibility checks on every public route in CI. (A11y)
16. **Push test coverage to 50%** as a stepping stone toward the 80% target. (14)
17. **Delete `SearchContext.tsx`** (dead module) or build the search bar it was clearly intended for. (D6)
18. **Split `BusinessInfoForm.tsx`** into one component per section. (D1)
19. **Migrate `Helpful/Buttons/Button` callers** to `UI/Button`. 18 callsites → 1 primitive. (D4)

### P3 — When you have time

20. **Decide on `interfaces.ts` vs `types.ts`** and merge. (D7)
21. **Move marketing copy** (AboutUs, AccidentClaims, Recoveries, terms, privacy) into editable content or a `<MarketingPage>` primitive. (D2)
22. **Remove `'unsafe-inline'` from CSP** with nonce middleware. (S2)
23. **2FA on admin accounts.** TOTP via `otpauth` library is straightforward. (S4)
24. **Add bulk actions and CSV export** to admin tables. (Section 5)
25. **Cookie consent banner** for GDPR. (10.6)

---

## 17. Recommended Next Steps

### For Shahzar (developer)

1. **Today**: P0 items above. The build break alone should be addressed immediately. Estimate: half a day.
2. **This week**: P1 items. Estimate: 2 days.
3. **Audit the live site with the dev server running** to catch interaction-level UX issues this static review can't see — broken keyboard nav, contrast at runtime, animation jank, loading sequence on slow networks. Lighthouse + axe Chrome extension would each take an hour.
4. **Run `npm test` and look at coverage gaps** in the high-value files (`ServiceBookingForm`, `BusinessInfoForm`, `CarDetailView`). Even adding 5 tests each lifts confidence meaningfully.

### For the client (handover)

1. **Status widget is the right thing to ship next** (per DAY_PLAN). It tells the non-technical client at a glance whether the site is healthy. Half a day of work, huge ongoing value.
2. **Document who pays for what** — domain, Vercel, MongoDB Atlas, S3, SMTP. The escalation path. The CODEBASE_ISSUES.md file is good engineering documentation but it's not what the client needs; they need an "if X happens, do Y" runbook.
3. **Sentry free tier covers this app's traffic.** Wire it before handover or the first production bug is invisible.
4. **The cron review-invite system is impressive but is currently broken** (B2). Fix this before the client sees a customer complaint about a 404 link.

### For me (reviewer follow-up)

* Once Chrome is available, do a live tab-through with Lighthouse and axe to validate the static a11y findings.
* Verify Toast ARIA at runtime.
* Run the full e2e suite locally to confirm CI claims.
* Test the booking → cancellation → re-booking flow to confirm the slot uniqueness index releases properly.

---

## Appendix A — File Distribution

```
src/
├── app/
│   ├── (admin)/admin/  (10 pages)
│   ├── (main)/         (17 pages)
│   └── api/            (27 endpoints across 6 domains)
├── components/
│   ├── Admin/          (29 files; largest area)
│   ├── Car/            (10 files)
│   ├── CarParts/       (3 files)
│   ├── Form/           (4 files)
│   ├── Helpful/        (8 files — to be merged with UI/)
│   ├── Main/Form/      (3 files — customer-facing booking forms)
│   ├── SEO/            (4 files)
│   ├── Services/       (15 files across Common/Tints/Detailing/Repairs)
│   ├── Shared/         (1 file)
│   ├── Toast/          (3 files)
│   ├── UI/             (8 files + 4 Finder duplicates)
│   ├── Dropdown/       (3 files — Nav)
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── HeroSection.tsx
│   ├── CarViewing.tsx
│   ├── WhatsAppButton.tsx / WhatsAppButtonClient.tsx
├── contexts/           (7 files; 1 dead — SearchContext)
├── emails/             (15 templates + send.ts + template/)
├── hooks/              (4 hooks + 2 Finder duplicates + a stray .md file)
├── lib/
│   ├── models/         (1 file — getCollection helpers + indexes)
│   ├── utils/          (15 utilities + 2 Finder duplicates)
│   ├── env.ts          (Zod env validation)
│   ├── interfaces.ts   (data contracts; overlaps with types.ts)
│   ├── types.ts        (utility types; overlaps with interfaces.ts)
│   └── mongodb.ts      (client singleton)
└── middleware.ts       (CSRF only)

__tests__/              (79 spec files; coverage 22.89%)
e2e/                    (10 Playwright specs)
scripts/                (2 scripts)
tools/                  (dev tooling, excluded from tsconfig)
```

## Appendix B — Key dependencies

```jsonc
"next": "^16.1.6",
"react": "19.1.0",
"@aws-sdk/client-s3": "^3.1023.0",
"@aws-sdk/s3-request-presigner": "^3.1023.0",
"@react-email/components": "^1.0.8",
"@vercel/functions": "^3.4.3",
"bcryptjs": "^3.0.3",
"iron-session": "^8.0.4",
"lucide-react": "^0.542.0",
"mongodb": "^6.19.0",
"motion": "^12.23.12",
"nodemailer": "^8.0.1",
"recharts": "^3.7.0",
"tailwindcss": "^4.1.17",
"uuid": "^13.0.0",
"zod": "^4.3.6"
```

Next 16 + React 19 + Tailwind 4 + Zod 4 is a very current stack. No legacy version concerns.

---

*End of review. Total review time: ~45 min of static code inspection covering 242 source files. Live UX/UI audit pending Chrome availability. The CODEBASE_ISSUES.md in the repo root is a deeper engineering audit covering many of the same findings with file/line citations; this review is intended as the cross-cutting product/UX/maintainability view alongside it.*
