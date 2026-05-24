# API Rate-Limit Audit

**Date:** 2026-05-24
**Branch:** `claude/api-rate-limit-audit`
**Scope:** every route under `src/app/api/**/route.ts`.

## Methodology

1. Inventoried every `route.ts` under `src/app/api/`, recording the
   exported HTTP methods, whether the route is public or auth-gated
   (iron-session admin / NextAuth customer / cron bearer), and whether
   it currently calls `createRateLimiter` / `.check(...)` (directly or
   via the `checkRateLimit` legacy shim in
   `src/lib/utils/validation.ts`).
2. Flagged every public write, every auth-gated write, every full-
   collection scan, and every route that fires an email or pays for an
   external service (S3, SES) as a candidate for limiting.
3. For each candidate, picked a limiter name, max / window, and
   `failClosed` posture — `failClosed: true` only on credential-grade
   routes, default `false` for anti-abuse caps so a KV outage doesn't
   take legitimate traffic down with it.
4. Added the limiter at the top of the route as a module-level
   constant, then `await <limiter>.check(ip)` immediately after auth /
   role checks. Matches the style of `src/app/api/admin/login/route.ts`.

The route identifier is always `ipAddress(request) ?? "unknown"`. The
existing limiters elsewhere in the codebase also bucket per-IP and the
KV backend (Vercel KV / Upstash) is the cross-instance counter when
configured.

## Per-route table

Legend:
- **Public?** — `pub` = unauthenticated callers accepted; `cust` = NextAuth
  customer session required; `admin` = iron-session admin required;
  `cron` = bearer-token; `mgr+`/`admin+` = role-gated within `admin`.
- **Current** — limiter present *before* this audit.
- **Recommended** — what should be in place after.
- **Action** — what this PR did.

| Path | Method | Public? | Current | Recommended | Action |
|---|---|---|---|---|---|
| `/api/about` | GET | pub | none | none (heavily cached, light DB) | none |
| `/api/account` | DELETE | cust | none | `accountDelete` 3 / 15m | **added** |
| `/api/account/bookings` | GET | cust | none | none (read-only, auth-gated, 3 indexed lookups) | none |
| `/api/account/password` | POST | cust | `customerPasswordChange` 5 / 15m, failClosed | ✓ | already |
| `/api/account/profile` | GET | cust | none | none (read-only, auth-gated) | none |
| `/api/account/profile` | PATCH | cust | none | `customerProfileUpdate` 20 / 15m | **added** |
| `/api/account/saved` | GET | cust | none | none (read-only, auth-gated) | none |
| `/api/account/saved` | PUT | cust | none | `customerSavedUpdate` 60 / 5m | **added** |
| `/api/admin/2fa/disable` | POST | admin | `admin-2fa-disable` 5 / 15m, failClosed | ✓ | already |
| `/api/admin/2fa/enroll` | POST | admin | none | `admin-2fa-enroll` 5 / 15m, failClosed | **added** |
| `/api/admin/2fa/verify` | POST | admin | `admin-2fa-verify` 5 / 15m, failClosed | ✓ | already |
| `/api/admin/bookings` | GET | admin | none | none (pagination caps at 200) | none |
| `/api/admin/bookings` | PUT | mgr+ | none | `admin-booking-write` 60 / 1m | **added** |
| `/api/admin/bookings/cancel` | POST | mgr+ | none | `admin-booking-cancel` 30 / 5m (sends email) | **added** |
| `/api/admin/bookings/export` | GET | mgr+ | none | `admin-bookings-export` 10 / 1m (full scan) | **added** |
| `/api/admin/carparts` | GET | admin | none | none (admin read, no pagination but small set) | none |
| `/api/admin/carparts` | POST | mgr+ | none | `admin-carparts-write` 60 / 1m | **added** |
| `/api/admin/carparts` | PUT | mgr+ | none | `admin-carparts-write` 60 / 1m | **added** |
| `/api/admin/carparts` | DELETE | mgr+ | none | `admin-carparts-write` 60 / 1m | **added** |
| `/api/admin/cars` | GET | admin | none | none (pagination caps at 100) | none |
| `/api/admin/cars` | POST | mgr+ | none | `admin-cars-write` 60 / 1m | **added** |
| `/api/admin/cars` | PUT | mgr+ | none | `admin-cars-write` 60 / 1m | **added** |
| `/api/admin/cars` | DELETE | mgr+ | none | `admin-cars-write` 60 / 1m | **added** |
| `/api/admin/cars/export` | GET | mgr+ | none | `admin-cars-export` 10 / 1m (full scan) | **added** |
| `/api/admin/health` | GET | admin | none | none (read-only, admin-gated diagnostics) | none |
| `/api/admin/login` | POST | pub | `login` 5 / 15m, failClosed | ✓ | already |
| `/api/admin/logout` | POST | admin | none | none (session destroy, no work, no email) | none |
| `/api/admin/part-exchange` | GET | admin | none | none (paginated read, capped at 200) | none |
| `/api/admin/part-exchange` | PATCH | mgr+ | none | `admin-part-exchange-write` 60 / 1m | **added** |
| `/api/admin/quotes` | GET | admin | none | none (paginated read, capped at 200) | none |
| `/api/admin/quotes` | PATCH | mgr+ | none | `admin-quotes-write` 60 / 1m | **added** |
| `/api/admin/reservations` | GET | admin | none | none (paginated read, capped at 200) | none |
| `/api/admin/reservations` | PATCH | mgr+ | none | `admin-reservations-write` 60 / 1m | **added** |
| `/api/admin/session` | GET | pub | none | none (returns cookie-derived state only) | none |
| `/api/admin/shop` | GET | admin | none | none (read of cached business info) | none |
| `/api/admin/shop` | PUT | mgr+ | none | `admin-shop-write` 20 / 1m | **added** |
| `/api/admin/upload` | POST | mgr+ | none | `admin-upload` 60 / 1m (S3 presign) | **added** |
| `/api/admin/upload/delete` | POST | mgr+ | none | `admin-upload-delete` 60 / 1m (S3 delete) | **added** |
| `/api/admin/users` | POST | mgr+ | `admin-user-create` 10 / 1h | ✓ | already |
| `/api/admin/users/lookup` | GET | mgr+ | none | none (single indexed read, role-gated) | none |
| `/api/admin/users/password` | POST | admin (admin-role) | `admin-password-action` 10 / 1h, failClosed | ✓ | already |
| `/api/admin/users/reset-password` | POST | pub (token) | `password-reset-consume` 3 / 15m, failClosed | ✓ | already |
| `/api/auth/[...nextauth]` | GET / POST | pub | `customerLogin` + `customerMagicLink` in `src/auth.ts` | ✓ | already |
| `/api/auth/forgot-password` | POST | pub | `customerPasswordReset` 3 / 15m, failClosed | ✓ | already |
| `/api/auth/register` | POST | pub | `customerRegister` 5 / 1h | ✓ | already |
| `/api/auth/reset-password` | POST | pub | `customerPasswordResetConsume` 5 / 15m, failClosed | ✓ | already |
| `/api/auth/verify-email` | GET | pub | none | none (token brute-force resistant; 32-byte tokens) | none |
| `/api/auth/verify-email` | POST | cust | `customerVerifyResend` 3 / 15m | ✓ | already |
| `/api/bookings/cancel` | POST | cust | none | none (scoped to booking owner email; 6-char ref guess space) — see below | none |
| `/api/bookings/lookup` | GET | pub | `bookingLookup` 10 / 15m | ✓ | already |
| `/api/bookings/part-exchange` | POST | cust | `part-exchange:<ip>` 3 / 5m (legacy shim) | ✓ | already |
| `/api/bookings/quote` | POST | cust | `quote:<ip>` 3 / 1m (legacy shim) | ✓ | already |
| `/api/bookings/reservation` | POST | cust | `reservation:<ip>` 3 / 5m (legacy shim) | ✓ | already |
| `/api/bookings/service` | POST | cust | `service-booking:<ip>` 5 / 1m (legacy shim) | ✓ | already |
| `/api/bookings/viewing` | POST | cust | `viewing-booking:<ip>` 5 / 1m (legacy shim) | ✓ | already |
| `/api/businessinfo` | GET | pub | none | none (cached, edge-friendly, no DB hit per request) | none |
| `/api/carparts` | GET | pub | none | `public-carparts-list` 120 / 1m | **added** |
| `/api/cars` | GET | pub | none | `public-cars-lookup` 120 / 1m | **added** |
| `/api/cron/review-invites` | GET | cron | none | none (bearer-token + Vercel-cron-only origin) | none |
| `/api/csp-report` | POST | pub | none | none (edge runtime, 64KB body cap, telemetry-only) | none |
| `/api/health` | GET | pub | `health` 60 / 1m | ✓ (PR #78) | already |

### Note on `/api/bookings/cancel`

Public — but only callable by the booking's account-owner (matched on
`customerInfo.email` against the NextAuth session). The `BK-XXXXXX`
reference space is `6^36 ≈ 2.1B`, and a hostile caller would still need
the matching email. Leaving this unlimited is judgement-call territory;
the parent route flows that *create* bookings are all rate-limited, so
the worst-case cost of someone hammering the cancel endpoint is wasted
DB lookups. Flagged for future review but not changed here.

### Note on `/api/bookings/*` legacy limiters

`POST /api/bookings/service`, `…/viewing`, `…/quote`, `…/reservation`,
and `…/part-exchange` use the legacy `checkRateLimit(...)` shim in
`src/lib/utils/validation.ts`. That shim ultimately calls
`createRateLimiter` under the hood, so the limits *are* KV-backed in
production — they just don't show up in a naive `grep
createRateLimiter src/app/api`. New code should call
`createRateLimiter` directly; the legacy shim is retained for
existing callers only.

## Summary of limiters added in this PR

| Name | Window | Cap | failClosed | Route(s) |
|---|---|---|---|---|
| `accountDelete` | 15m | 3 | false | `DELETE /api/account` |
| `customerProfileUpdate` | 15m | 20 | false | `PATCH /api/account/profile` |
| `customerSavedUpdate` | 5m | 60 | false | `PUT /api/account/saved` |
| `admin-2fa-enroll` | 15m | 5 | true | `POST /api/admin/2fa/enroll` |
| `admin-booking-write` | 1m | 60 | false | `PUT /api/admin/bookings` |
| `admin-booking-cancel` | 5m | 30 | false | `POST /api/admin/bookings/cancel` |
| `admin-bookings-export` | 1m | 10 | false | `GET /api/admin/bookings/export` |
| `admin-carparts-write` | 1m | 60 | false | POST/PUT/DELETE `/api/admin/carparts` |
| `admin-cars-write` | 1m | 60 | false | POST/PUT/DELETE `/api/admin/cars` |
| `admin-cars-export` | 1m | 10 | false | `GET /api/admin/cars/export` |
| `admin-part-exchange-write` | 1m | 60 | false | `PATCH /api/admin/part-exchange` |
| `admin-quotes-write` | 1m | 60 | false | `PATCH /api/admin/quotes` |
| `admin-reservations-write` | 1m | 60 | false | `PATCH /api/admin/reservations` |
| `admin-shop-write` | 1m | 20 | false | `PUT /api/admin/shop` |
| `admin-upload` | 1m | 60 | false | `POST /api/admin/upload` |
| `admin-upload-delete` | 1m | 60 | false | `POST /api/admin/upload/delete` |
| `public-cars-lookup` | 1m | 120 | false | `GET /api/cars` |
| `public-carparts-list` | 1m | 120 | false | `GET /api/carparts` |

**18 new limiters across 17 route files.** No existing limiter was
modified.

## Highest-risk gaps before this PR

- `POST /api/admin/upload` minted a fresh S3 presigned URL per call
  with no per-IP cap behind the manager role. A compromised manager
  session could be looped against this to burn AWS SigV4 quota and
  pre-stage uploads. Now capped at 60 / minute.
- `POST /api/admin/bookings/cancel` fires a customer email per call and
  was unlimited. A compromised admin session could weaponise the route
  as a transactional-email cannon. Now capped at 30 / 5m.
- `GET /api/admin/bookings/export` and `GET /api/admin/cars/export`
  scan the full collections without pagination. A stuck or hostile
  admin client could hammer Atlas IOPS. Now capped at 10 / minute each.
- `GET /api/carparts` and `GET /api/cars` were public and uncapped.
  Either could be used as a cheap scraping target. Now capped at
  120 / minute / IP.

## Recommendations for future routes

1. **Default to rate-limiting on every new `route.ts` that mutates
   state or scans a full collection.** Even auth-gated routes benefit —
   one compromised session shouldn't be able to scrape, batch-cancel,
   or DOS the platform.
2. **Limiter naming.** Use kebab-case, prefix with audience (`admin-`,
   `customer-`, `public-`), and end with the action verb. Examples:
   `admin-cars-write`, `customer-saved-update`, `public-cars-lookup`.
3. **`failClosed: true` criteria.** Set it iff the route guards a
   credential or other secret: login, password reset, 2FA enroll /
   verify / disable, magic-link issuance. For everything else leave it
   default `false` — a KV blip becoming a feature outage is worse than
   one hostile minute leaking through.
4. **Identifier.** `ipAddress(request) ?? "unknown"` is the right
   default. For auth-gated routes where the legitimate-user vs
   abusive-user distinction matters (admin password actions,
   per-account email sends), consider keying on `${ip}:${username}` so
   one bad actor can't lock another out from a shared NAT.
5. **Cap shapes.** A round number per minute is fine for most write
   endpoints (`60 / 1m` is the working-template for "shouldn't ever
   trip during normal use"). Drop to `10 / 1m` for full-collection
   scans, `5 / 15m` for credential-bearing flows, and `3 / 15m` for
   irreversible actions (account delete, password reset request).
6. **Place the check after auth + role, before any DB / external
   call.** If a 429 fires, it should happen with zero data leakage and
   minimal work — same pattern as `src/app/api/admin/login/route.ts`.
7. **Always return `Retry-After` (seconds).** It's both client-friendly
   and lets monitoring systems back off correctly.
8. **Don't `.reset()` on success for credential limiters.** The
   `admin/login` route documents this — resetting on success lets a
   credential-dump attack get unlimited fresh attempts after the first
   correct guess. (CODEBASE_ISSUES A6.)
