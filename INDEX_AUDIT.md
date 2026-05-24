# MongoDB Index Audit — 2026-05-24

This document is the result of a full audit of every MongoDB query in the
`carsales` codebase, the indexes those queries rely on, and the gaps that
were closed in this PR. Scope: collections accessed through
`src/lib/models/*.ts` and the API routes / server components that consume
them. The Auth.js adapter collections (`accounts`, `sessions`,
`verification_tokens`) are managed by the adapter itself and are
intentionally out of scope.

## Methodology

1. Walked every accessor in `src/lib/models/index.ts` and recorded its
   existing `createIndex(es)` calls.
2. Grepped for every Mongo query operator (`find`, `findOne`,
   `findOneAndUpdate`, `updateOne`, `updateMany`, `deleteOne`,
   `deleteMany`, `countDocuments`, `distinct`, `aggregate`) across
   `src/app/**`, `src/auth.ts`, and `src/lib/utils/**`. ~114 query sites
   in total.
3. For each query, classified the filter + sort shape, then mapped it to
   the index it ought to use (single-field for equality; compound in
   `{ equality, sort }` order for filter+sort; sparse where the filter
   field only exists on a subset of documents; partial-unique already in
   place where slot uniqueness applies).
4. Annotated each row as **exists / added in this PR / not needed (and
   why)**. "Not needed" usually means the query is hot-on-`_id`,
   admin-only over a tiny collection, or already served by a compound
   index whose prefix matches the query.

## Per-collection findings

### `cars`

| Query (file:line) | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `lib/models/index.ts:105` `findOne({ featured: true })` | `featured` | — | `{ featured: 1 }` | exists |
| `lib/models/index.ts:120` latest-cars | `status: "available"` | `createdAt: -1` | `{ status: 1, createdAt: -1 }` | exists |
| `api/cars/route.ts:45` saved-cars batch | `_id $in, status` | — | `_id` (default) + status filter | not needed (`_id` covers the `$in`; status is a final pass) |
| `api/admin/cars/route.ts:98,102` admin list | optional `status` | `createdAt: -1` | `{ status: 1, createdAt: -1 }` | exists |
| `api/admin/cars/route.ts:225,275,277` update/find/delete by id | `_id` | — | `_id` (default) | exists |
| `api/admin/cars/export/route.ts:71` CSV export | `{}` | `createdAt: -1` | `{ createdAt: -1 }` — but admin-only, low rps, full scan acceptable | not needed (cold path; collection bounded by stock count) |
| `api/about/route.ts:15–18` counts + distinct | `{}`, `{ status }`, `distinct("make", { status: "available" })` | — | `{ status: 1 }` | exists |
| `(main)/AboutUs/page.tsx:52–54` ditto | as above | — | `{ status: 1 }` | exists |
| `(main)/BrowseFleet/page.tsx:52` facets | `{ status: "available" }` projection | — | `{ status: 1 }` | exists |
| `(main)/BrowseFleet/page.tsx:106,111,113` filter + paginate | varying eq filters (status, make, colour, doors, price/year/mileage ranges, features `$all`, optional regex `$or`) | one of `price`, `mileage`, `year`, `createdAt` | compound `{ status, <sort key> }` for each sort option | **added** `{ status: 1, mileage: 1 }` and `{ status: 1, year: -1 }`; existing `{ status: 1, price: 1 }` and `{ status: 1, createdAt: -1 }` cover the other two |
| `(main)/BrowseFleet/[_id]/page.tsx:86` car detail | `_id` | — | `_id` | exists |
| `(main)/BrowseFleet/[_id]/page.tsx:107` similar by fuel | `_id $ne, status, fuel` | — (limit 4) | `{ status: 1, fuel: 1 }` | **added** |
| `(main)/BrowseFleet/[_id]/page.tsx:118` similar fallback | `_id $ne, status` | — (limit 4) | `{ status: 1 }` | exists |
| `(main)/Booking/[_id]/page.tsx:38` | `_id` | — | `_id` | exists |
| `(admin)/admin/dashboard/cars/page.tsx:13` | `{}` | — | none (full scan, admin-only) | not needed |
| `(admin)/admin/dashboard/cars/edit/[_id]/page.tsx:19` | `_id` | — | `_id` | exists |
| `sitemap.ts:94` | `{ status: "available" }` projection | — | `{ status: 1 }` | exists |
| `api/bookings/reservation/route.ts:116,176` car-by-id read + update | `_id` | — | `_id` | exists |
| `components/Admin/Dashboard/getDashboardData.ts:445` aggregate `$facet` | `{}` (point-in-time inventory) | — | full scan acceptable for dashboard cardinality | not needed |

### `serviceAppointments`

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `api/bookings/lookup/route.ts:91` | `bookingReference` | — | unique `bookingReference` | exists |
| `api/bookings/cancel/route.ts:79,118` | `bookingReference` (+ `status $ne`) | — | unique `bookingReference` | exists |
| `api/bookings/service/route.ts:135` insert | uniqueness on `appointmentDate + appointmentTime` partial | — | `uniq_active_service_slot` partial unique | exists |
| `api/admin/bookings/route.ts:40,51` list + count | `{}` | `createdAt: -1` | `{ createdAt: -1 }` — but moot vs. small admin volume; `{ status: 1, createdAt: -1 }` serves status-filtered variants | not needed for the `{}` form (cold path) |
| `api/admin/bookings/route.ts:148,162` update + read by `_id` | `_id` | — | `_id` | exists |
| `api/admin/bookings/cancel/route.ts:74,96` | `bookingReference` | — | unique `bookingReference` | exists |
| `api/admin/bookings/export/route.ts:74` CSV | `{}` | `createdAt: -1` | not needed | cold path |
| `api/account/bookings/route.ts:67` | `customerInfo.email` (anchored regex, case-insensitive) | `createdAt: -1` | `{ "customerInfo.email": 1, createdAt: -1 }` | **added** |
| `api/cron/review-invites/route.ts:138,67,82` claim + roll-back + scan | `status: "completed", completedAt: $lte, reviewInviteSentAt: $exists:false` | — | `{ status: 1, completedAt: 1, reviewInviteSentAt: 1 }` | exists |
| `(admin)/admin/dashboard/service/page.tsx:25` | `{}` | `createdAt: -1` | not needed | cold |
| `getDashboardData.ts` aggregate + upcoming `appointmentDate $gte/$lte, status $ne` sort `appointmentDate, appointmentTime` | — | — | `{ appointmentDate: 1, status: 1 }` | exists |
| `getDashboardData.ts` recent `createdAt $gte/$lte` sort `createdAt: -1` | — | — | admin-only, bounded by date window | not needed |

### `carViewingBookings`

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `api/bookings/lookup/route.ts:94` | `bookingReference` | — | unique | exists |
| `api/bookings/cancel/route.ts:82,118` | `bookingReference` (+ `status $ne`) | — | unique | exists |
| `api/bookings/viewing/route.ts:172` insert | partial-unique slot per `carId + appointmentDate + appointmentTime` | — | `uniq_active_viewing_slot` | exists |
| `api/admin/bookings/route.ts:46,52,148,162` list/count/update | `{}` / `_id` | `createdAt: -1` | not needed for `{}` (cold); `_id` for update | exists |
| `api/admin/bookings/cancel/route.ts:77,96` | `bookingReference` | — | unique | exists |
| `api/admin/bookings/export/route.ts:75` CSV | `{}` | `createdAt: -1` | cold | not needed |
| `api/account/bookings/route.ts:68` | `customerInfo.email` regex | `createdAt: -1` | `{ "customerInfo.email": 1, createdAt: -1 }` | **added** |
| `api/cron/review-invites/route.ts:161,67,82` | same as service version | — | `{ status: 1, completedAt: 1, reviewInviteSentAt: 1 }` | exists |
| `(admin)/admin/dashboard/viewing/page.tsx:25` | `{}` | `createdAt: -1` | cold | not needed |
| `(admin)/admin/dashboard/cars/page.tsx:19` | `{}` | — | cold | not needed |
| `getDashboardData.ts` upcoming/recent | as for service | — | `{ appointmentDate: 1, status: 1 }` | exists |

### `reservations`

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `api/bookings/reservation/route.ts:159` insert | partial-unique `carId` when status pending/confirmed | — | `uniq_active_reservation_per_car` | exists |
| `api/admin/reservations/route.ts:60,65,107` list/count/update | optional `status` / `_id` | `createdAt: -1` | `{ status: 1, createdAt: -1 }` | exists |
| `api/account/bookings/route.ts:70` | `customerInfo.email` regex | `createdAt: -1` | `{ "customerInfo.email": 1, createdAt: -1 }` | **added** |
| `(admin)/admin/dashboard/reservations/page.tsx:37,41` list | optional `status` | `createdAt: -1` | `{ status: 1, createdAt: -1 }` | exists |
| TTL `expiresAt` for auto-expiry | `expiresAt` | — | `{ expiresAt: 1 } expireAfterSeconds: 0` | exists |

### `partExchanges`

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `api/bookings/part-exchange/route.ts:133` insert | uniqueness on `enquiryReference` | — | unique `enquiryReference` | exists |
| `api/admin/part-exchange/route.ts:60,65,99` list/count/update | optional `status` / `_id` | `createdAt: -1` | `{ status: 1, createdAt: -1 }` | exists |
| `(admin)/admin/dashboard/part-exchange/page.tsx:37,41` | optional `status` | `createdAt: -1` | `{ status: 1, createdAt: -1 }` | exists |

### `quotes`

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `api/bookings/lookup/route.ts:78` | `quoteReference` | — | unique | exists |
| `api/bookings/quote/route.ts:131` insert | uniqueness on `quoteReference` | — | unique | exists |
| `api/admin/quotes/route.ts:55,60,94` list/count/update | optional `status` / `_id` | `createdAt: -1` | `{ status: 1, createdAt: -1 }` | **added** |
| `(admin)/admin/dashboard/quotes/page.tsx:32,36` | optional `status` | `createdAt: -1` | `{ status: 1, createdAt: -1 }` | covered by the same new index |

### `carParts`

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `api/carparts/route.ts:31` public list | optional `brand`/`category`/`condition` | — | `{ category: 1 }`, `{ brand: 1 }`, `{ condition: 1 }` | exists |
| `api/admin/carparts/route.ts:52` admin list | `{}` | `createdAt: -1` | `{ createdAt: -1 }` | **added** |
| `api/admin/carparts/route.ts:102,169,216,218` insert/update/findOne/delete | `_id` | — | `_id` | exists |
| `(admin)/admin/dashboard/carparts/page.tsx:21` | `{}` | — | cold | not needed |
| `(main)/CarParts/page.tsx:29` public listing | `{}` | — | full scan acceptable; faceted reads dominate | not needed |

### `adminUsers`

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `api/admin/login/route.ts:91,124` login + last-login | `username` / `_id` | — | unique `username` | exists |
| `api/admin/users/route.ts:102,132` register | `$or: [username, email]` | — | unique `username` + `{ email: 1 } unique sparse` | exists |
| `api/admin/users/lookup/route.ts:38` | `$or: [username, email]` w/ collation | — | unique `username` + `email` | exists |
| `api/admin/users/password/route.ts:103,139` mint reset | `username` | — | unique `username` | exists |
| `api/admin/users/reset-password/route.ts:86,99` consume reset | `resetToken, resetTokenExpiry: $gt` | — | `{ resetToken: 1 } sparse` | **added** |
| `api/admin/2fa/{enroll,verify,disable}` | `username` | — | unique `username` | exists |
| `(admin)/admin/dashboard/account/page.tsx:17` | `username` | — | unique `username` | exists |
| `getDashboardData.ts` `estimatedDocumentCount()` | — | — | metadata, no index needed | not needed |

### `users` (customer accounts)

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `auth.ts:143` login | `email` | — | unique `email` | exists |
| `api/auth/register/route.ts:77,84` register | `email` | — | unique `email` | exists |
| `api/auth/forgot-password/route.ts:68,76` mint reset | `email` / `_id` | — | unique `email` + `_id` | exists |
| `api/auth/reset-password/route.ts:69,79` consume reset | `resetToken, resetTokenExpiry: $gt` | — | `{ resetToken: 1 } sparse` | **added** |
| `api/auth/verify-email/route.ts:43,52,82` | `verifyToken, verifyTokenExpiry: $gt` / `_id` / `email` | — | `{ verifyToken: 1 } sparse` | **added** |
| `lib/utils/emailVerification.ts:30,34` send | `email` / `_id` | — | unique `email` | exists |
| `api/account/route.ts:31,36` delete | `email` / `_id` | — | unique `email` | exists |
| `api/account/profile/route.ts:38,75` | `email` | — | unique `email` | exists |
| `api/account/saved/route.ts:42,77` | `email` | — | unique `email` | exists |
| `api/account/password/route.ts:75,90` | `email` / `_id` | — | unique `email` | exists |

### `auditLogs`

| Query | Filter | Sort | Required index | Status |
|---|---|---|---|---|
| `lib/utils/audit.ts:30` insert | — | — | n/a | n/a |
| `(admin)/admin/dashboard/audit/page.tsx:60` paginated read | optional `actor` / `action` / `targetType` / `createdAt: $lt cursor` | `createdAt: -1` | `{ createdAt: -1 }` + `{ actor: 1, createdAt: -1 }` + `{ targetType: 1, targetId: 1 }` | exists |
| `(admin)/admin/dashboard/audit/page.tsx:78,79` distinct | `actor`, `action` | — | distinct over the existing single-prefix indexes; `action` distinct walks the index but cardinality is small | not needed (admin-only) |

### `businessInfo` / `detailingPackages` / `tintOptions` / `serviceOverviews` / `recoveryInfo`

All of these are single-row or single-digit-row collections seeded once
and read on every request through the per-request `getBusinessInfo()`
cache. No indexes are required; queries are `findOne({})` /
`find({}).toArray()` over ≤ ~10 documents. Status: **not needed.**

## Summary of indexes added in this PR

Total: **10 new `createIndex` entries** across **8 collections.** All are
added through the existing accessor functions in `src/lib/models/index.ts`,
so they run idempotently on first cold-start DB access (Mongo no-ops if a
matching index already exists).

- `cars` (×3):
  - `{ status: 1, mileage: 1 }`
  - `{ status: 1, year: -1 }`
  - `{ status: 1, fuel: 1 }`
- `serviceAppointments`:
  - `{ "customerInfo.email": 1, createdAt: -1 }`
- `carViewingBookings`:
  - `{ "customerInfo.email": 1, createdAt: -1 }`
- `reservations`:
  - `{ "customerInfo.email": 1, createdAt: -1 }`
- `quotes`:
  - `{ status: 1, createdAt: -1 }`
- `carParts`:
  - `{ createdAt: -1 }`
- `adminUsers`:
  - `{ resetToken: 1 }` (sparse)
- `users`:
  - `{ resetToken: 1 }` (sparse)
  - `{ verifyToken: 1 }` (sparse)

## Biggest perf-risk findings

1. **BrowseFleet sort options.** The public fleet listing exposes four
   sort orders (`newest`, `priceAsc/Desc`, `mileageAsc`, `yearDesc`) but
   only two of them had a matching `{ status, sortKey }` compound index.
   The `mileage` and `year` sorts previously degraded to an in-memory
   sort over every "available" car — fine at hundreds of listings, bad
   at thousands. Added compounds restore index-driven sort for all four.
2. **`/account/bookings` was scanning customer history.** Three
   collections (services, viewings, reservations) had a single-field
   index on `customerInfo.email` for case-insensitive lookups, but the
   route also sorted by `createdAt: -1`. Without the compound, the email
   match found the rows, then the engine sorted them in memory. For an
   active customer with dozens of bookings this is cheap; for a power
   user (or an attacker probing the email regex) it isn't.
3. **Reset-password / verify-email token lookups were full collection
   scans.** Every consume-side request did
   `findOne({ resetToken, resetTokenExpiry: $gt })` with no index on
   either token field, so every reset link click and every
   email-verification click was an O(n) scan over the entire `users`
   (and `adminUsers`) collection. Sparse indexes on the token fields
   close this.

## Recommendations for future queries

A compact rule-of-thumb checklist when adding a new Mongo query:

1. **Equality + sort?** Compound index with the equality field first
   and the sort field last:
   `{ <equalityField>: 1, <sortField>: <-1 or 1> }`.
2. **Multiple equality fields + sort?** Same shape, with the
   highest-cardinality equality field first to maximise pruning:
   `{ <highCardinality>: 1, <lowCardinality>: 1, <sortField>: -1 }`.
3. **Range filter + sort?** Put the range field after equality fields
   and before the sort field; if range and sort are on the same field,
   the index direction must match the sort direction.
4. **Sparse fields (token, optional field set only on a subset of
   rows)?** Use `{ field: 1 }` with `{ sparse: true }` so the index
   doesn't index `null` for every row.
5. **Partial uniqueness (e.g. "one active reservation per car")?** Use
   `{ unique: true, partialFilterExpression: { status: { $in: [...] } } }`
   so terminal states don't lock the slot forever.
6. **TTL (auto-expire pending rows)?** Use `{ expireAfterSeconds: 0 }`
   on a `Date` field set to the desired expiry timestamp.
7. **Text search (`$text`)?** Only add a `$text` index if there's a
   real `$text` query — they're large and write-heavy. The current
   BrowseFleet "search" uses an indexed-field regex on
   `make / model / colour`, which is fine at this dataset size.
8. **Skip the index** when the query runs on a tiny collection
   (≤ 1–2k rows), is admin-only, and is on a cold path. Index churn
   has a write cost; don't pay it for a once-an-hour CSV export.
9. **`_id` lookups are always free** — Mongo always indexes `_id`. Don't
   add `{ _id: 1 }` manually.
10. **Always add the index in the accessor function** in
    `src/lib/models/index.ts`, alongside the existing `createIndexes`
    call for that collection. `createIndex` is idempotent, so this is
    safe to run on every cold start and replaces the need for a
    separate migration step.

When the time comes to deprecate an index (e.g. a query is rewritten
and the old compound is no longer used), drop it explicitly with
`collection.dropIndex(...)` in a one-off migration — never just delete
the `createIndex` line, since the index will still live on in
production.
