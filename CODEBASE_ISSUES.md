# Carsales — Codebase Issues

**Repo:** `shahzar100/carsales` · **Audited:** 2026-05-10 · **State:** Days 1–5 of `DAY_PLAN.md` merged to `main`, `ci/github-actions` branch in flight.

This document catalogues defects, risks, and inconsistencies found across the codebase. It is the long, unvarnished version of the audit. Each finding cites `file:line`, names a severity, explains the impact, and proposes a fix. Findings are grouped by domain. A consolidated "fix me first" punch list lives at the very end.

Severities used:

| Severity | Meaning |
| --- | --- |
| **Critical** | Direct user/business risk now (data loss, money, secrets, privilege escalation). Fix before any further work. |
| **High** | Real bug or vulnerability with a realistic exploit path; or a build-breakage waiting to land. Fix before handover. |
| **Medium** | Latent bug, brittle design, or correctness hole that bites under load or edge cases. Fix opportunistically. |
| **Low** | Nuisance, cosmetic, or hypothetical. Fix when nearby. |

---

## A. Auth and identity

### A1. **Critical** — Privilege escalation via password reset endpoint
**Where:** `src/app/api/admin/users/password/route.ts:42-45`.
The route guards on `isAuthenticated()` only. A compromised low-privilege account (`staff`, `manager`) can `POST { action: "reset", username: "admin" }` and the response body contains the **plaintext** new password (`:98`). User creation correctly requires `hasMinimumRole("manager")` (`users/route.ts:68`); reset does not. No rate limit, no audit log.
**Fix:** require `hasMinimumRole("admin")` for resets affecting admin accounts; require `manager+` for any reset; rate-limit; never return plaintext (force email-link reset flow).

### A2. **Critical** — Plaintext passwords returned in HTTP responses
**Where:** `src/app/api/admin/users/route.ts:161` and `src/app/api/admin/users/password/route.ts:98`.
The user-create and password-reset routes both echo the new plaintext back to the caller "once so the admin can hand it off." That value lands in browser memory, devtools, BFCache, the React state of the admin UI, and any forward proxy buffer. Combined with A1, it's the top issue in the codebase.
**Fix:** never return plaintext. Send a single-use, time-bound token by email; force first-login change.

### A3. **Critical** — No admin bootstrap path
**Where:** `src/app/api/admin/login/route.ts:42-58`, `src/lib/utils/auth.ts:50-55`.
Login compares only against `bcrypt(passwordHash)` rows in the `adminUsers` MongoDB collection. There is no env-var fallback, no first-run seeder, no admin auto-create. `SETUP.md:88-94` instructs `node scripts/setup-admin.mjs` — that script does not exist. `ADMIN_PASSWORD` is referenced only in tests (`jest.env.setup.js:17`) and the new CI YAML; the production code never reads it.
**Effect:**
- Fresh clone + `.env.local` + `npm run dev` cannot log in.
- The CI E2E job spins up an empty `mongo:7` and every admin spec fails on "Invalid credentials."
**Fix:** create `scripts/setup-admin.mjs` (or `.ts` with `tsx`) that reads `ADMIN_PASSWORD` and bcrypts an `admin` row into `adminUsers`. Wire it into the E2E `globalSetup` and document in `SETUP.md`.

### A4. **High** — `session.destroy()` not awaited on logout
**Where:** `src/app/api/admin/logout/route.ts:7`.
`iron-session`'s `destroy()` returns a Promise that mutates and re-signs the cookie. Without `await`, the response can be returned before the `Set-Cookie` clear header is finalised. The browser keeps the old (still-decryptable) cookie until expiry.
**Fix:** `await session.destroy();`

### A5. **High** — NoSQL operator injection on `username`
**Where:** `src/app/api/admin/login/route.ts:33,43`.
`const { username, password } = await request.json(); ... findOne({ username })`. Sending `{"username":{"$gt":""},"password":"x"}` matches the first user in the collection. Bcrypt rejects so login fails, but it's a useful **enumeration + DoS amplifier** against the first admin row (forces a 12-round bcrypt per request).
**Fix:** `if (typeof username !== "string" || username.length > 64) return 400`.

### A6. **High** — Login rate-limiter resets on success
**Where:** `src/app/api/admin/login/route.ts:75`.
The limiter clears its counter on the first successful login. Combined with the in-memory store (A12), an attacker who occasionally lands a correct guess from a credential dump gets unlimited fresh attempts.
**Fix:** keep the counter; only clear on a genuine human-driven flow (password change, MFA accept).

### A7. **High** — Password-reset email links to a route that doesn't exist
**Where:** `src/emails/PasswordReset.tsx:19` (links to `/admin/reset-password?token=…`); no handler at `src/app/(admin)/admin/reset-password/` and no API at `src/app/api/admin/reset-password/`.
The token is generated, SHA-256-hashed, and stored in the DB with a 1h expiry that nothing consumes. Recipients click a 404. The dead-token rows accumulate forever.
**Fix:** build the route or remove the email + DB column. If you build it, use constant-time comparison and single-use semantics.

### A8. **High** — Username enumeration via timing
**Where:** `src/app/api/admin/login/route.ts:43-52`.
User-not-found returns immediately; user-found-but-wrong-password runs a 12-round bcrypt (~150ms). The latency difference reliably distinguishes valid usernames.
**Fix:** always run `bcrypt.compare` against a constant dummy hash on user-not-found.

### A9. **Medium** — `/api/admin/session` 500 forces logout in the UI
**Where:** `src/app/api/admin/session/route.ts:14`, consumed by `src/contexts/AuthContext.tsx:42-44`.
A transient DB blip returns 500; the AuthContext treats any non-OK as logged-out and force-redirects. Admins get bounced to login on every Mongo cold start.
**Fix:** distinguish "session unknown" from "session invalid"; back off and retry on 5xx instead of redirecting.

### A10. **Medium** — `/api/admin/users/lookup` is privilege-blind and returns role data
**Where:** `src/app/api/admin/users/lookup/route.ts`.
Auth-gated, but any authenticated user can enumerate admin usernames + roles. Role data ought to require `manager+`.

### A11. **Medium** — Admin route protection reimplemented per route
Every route in `src/app/api/admin/**/route.ts` calls `isAuthenticated()` independently. Middleware (`src/middleware.ts:11-53`) does CSRF only. Adding a new route and forgetting the gate silently exposes it. The cost is one missed line; the consequence is full data exfiltration.
**Fix:** move auth into middleware for `pathname.startsWith("/api/admin/")` minus `login`/`session`. Belt-and-braces with the per-route check.

### A12. **Medium** — Two rate limiters; both in-memory; both lie in production
**Where:** `src/lib/utils/rateLimit.ts` (modern) and `src/lib/utils/validation.ts:88-112` (legacy).
Both back onto in-process `Map`s. On Vercel each warm instance has its own counter; cold start = empty. The "5 attempts per 15 min" on login is closer to "5 per 15 min per warm instance" — easily ×N-bypassed by spreading attempts. The booking endpoints use the legacy version, login/user-create use the modern one. Two implementations diverge on `reset()` semantics.
**Fix:** delete the legacy. Back the modern one with Vercel KV / Upstash Redis. Same store across all routes.

### A13. **High** — Public POST routes with no rate limiting at all

| Route | Has limiter? |
| --- | --- |
| `/api/admin/users/password` | **No** (and see A1) |
| `/api/admin/upload` | No |
| `/api/admin/upload/delete` | No |
| `/api/admin/cars` (POST/PUT/DELETE) | No |
| `/api/admin/carparts` (POST/PUT/DELETE) | No |
| `/api/admin/bookings` (PUT) | No |
| `/api/admin/shop` (PUT) | No |

All are auth-gated, so the threat is internal (compromised account, malicious staff) — but the lack of any throttle on `upload` lets an authenticated user generate unlimited presigned URLs and run up S3 bills.

---

## B. Cookies, CSRF, headers

### B1. **High** — CSP allows `'unsafe-inline'` for scripts
**Where:** `next.config.ts:32`.
The only inline script is `src/components/SEO/JsonLd.tsx:5`, which already escapes `<` to `<`. Removing `'unsafe-inline'` from `script-src` is genuinely cheap — move JsonLd to `next/script` with a per-request nonce, or render the JSON via a `<script type="application/ld+json">` outside React's reconciliation.
DAY_PLAN flagged this as "non-trivial." It isn't.
**Fix:** add a nonce middleware (Next 16's `headers()` supports it cleanly), drop `'unsafe-inline'`. Keep it on `style-src` because Tailwind 4's runtime emits inline styles.

### B2. **High** — Same-origin iframe POST is allowed by CSRF middleware
**Where:** `src/middleware.ts:36-42`. The check is `originUrl.host === host`. CSP `frame-ancestors 'self'` lets the site embed itself. A stored XSS in any admin-rendered content can iframe `/admin/...`, ride the cookie, and POST to admin routes.
**Fix:** combine the Origin check with a per-form CSRF token (double-submit cookie). Or set `frame-ancestors 'none'` and accept that the admin can't be embedded anywhere.

### B3. **Medium** — `host` header is unverified
**Where:** `src/middleware.ts:20-21`. Trusts `request.headers.get("host")`. On Vercel this is fine (the platform sets it). If ever fronted by a proxy that passes `X-Forwarded-Host` differently, the comparison is attacker-controlled.
**Fix:** compare against an allow-list derived from `NEXT_PUBLIC_SITE_URL`.

### B4. **Medium** — `Permissions-Policy` is incomplete
**Where:** `next.config.ts:42`. Sets `camera=(), microphone=(), geolocation=()`. Missing: `interest-cohort=()`, `payment=()`, `usb=()`, `fullscreen=()`, `magnetometer=()`, `gyroscope=()`. None enable an exploit on this app, but the policy header is already there — no reason to leave gaps.

### B5. **Medium** — Missing cross-origin isolation headers
No `Cross-Origin-Opener-Policy: same-origin`, no `Cross-Origin-Embedder-Policy`, no `Cross-Origin-Resource-Policy: same-origin`. Means `window.opener` access is possible from any popup the admin opens.

### B6. **Low** — No CSP `report-uri` / `report-to`
You'll never know when the CSP is violated in the wild. A free reporting endpoint or even just `report-uri /api/csp-report` is cheap.

---

## C. Data layer (MongoDB)

### C1. **Critical** — Cron review-invite is not at-most-once
**Where:** `src/app/api/cron/review-invites/route.ts:64-82, 96-113`.
Order today: send email → mark `reviewInviteSentAt`. A network blip between the two means the next cron run picks the same booking and re-sends. Customers get duplicate review requests.
**Fix:** atomic claim-then-send.
```ts
const claimed = await collection.findOneAndUpdate(
  { _id, reviewInviteSentAt: { $exists: false } },
  { $set: { reviewInviteSentAt: new Date() } },
  { returnDocument: "after" }
);
if (!claimed) continue;          // someone else claimed
try { await sendReviewInviteEmail(claimed); }
catch { await collection.updateOne({ _id }, { $unset: { reviewInviteSentAt: "" } }); throw; }
```

### C2. **High** — Migration script writes to the wrong database
**Where:** `scripts/migrate-business-info.ts:38`.
Uses `client.db()` (the URI's default DB). The application uses `db("MMC")` (`src/lib/models/index.ts:78`). If `MONGODB_URI` doesn't include `/MMC`, the migration writes to a different database than the app reads. Silent: no error, no diff.
**Fix:** `client.db("MMC")`.

### C3. **High** — Booking creation has no slot-uniqueness constraint
**Where:** `src/app/api/bookings/viewing/route.ts`, `src/app/api/bookings/service/route.ts`.
Two users hitting POST simultaneously can both book the same `(carId, appointmentDate, appointmentTime)`. The model declares no partial-unique index for active bookings. The booking confirmation page promises a slot that may not exist.
**Fix:** partial unique index on `{ carId, appointmentDate, appointmentTime }` filtered by `status: { $in: ["pending", "confirmed"] }`. Catch `E11000` and return 409 with a "slot just taken, try another" message.

### C4. **High** — `updateBusinessInfo` is `deleteMany` + `insertMany`
**Where:** `src/lib/utils/businessInfo.ts:379-410`.
For `detailingPackages`, `tintOptions`, and `serviceOverviews`, two simultaneous "Save" clicks (or a network retry) interleave: A deleteMany, B deleteMany, A insertMany, B insertMany → duplicates. Partial failure between delete and insert wipes the collection.
**Fix:** `bulkWrite` with `replaceOne({ id }, doc, { upsert: true })` per package, plus a single `deleteMany({ id: { $nin: keepIds } })`. Or wrap in `withTransaction`.

### C5. **High** — `seedIfEmpty` race on cold start
**Where:** `src/lib/utils/businessInfo.ts:276-288`.
`countDocuments` then `insertMany`. Two cold starts both see `count===0` and both insert.
**Fix:** `findOneAndUpdate({}, { $setOnInsert: defaults }, { upsert: true })`.

### C6. **High** — Cancel/confirm race
**Where:** `src/app/api/bookings/cancel/route.ts:43-78` and `src/app/api/admin/bookings/route.ts:141`.
`findOne` → check status → `updateOne`. Two admins clicking "Cancel" or "Confirm" milliseconds apart both pass the check; the second overwrites the first's audit fields and triggers a duplicate email (the email isn't gated by `modifiedCount`).
**Fix:** include the expected current state in the filter: `updateOne({ bookingReference, status: { $ne: "cancelled" } }, …)` and only email if `modifiedCount === 1`.

### C7. **High** — Admin user creation lacks unique email index
**Where:** `src/lib/models/index.ts:223-226`. Only `username` is unique. Two simultaneous POSTs with the same email both succeed; password reset later targets the wrong row.
**Fix:** add `{ key: { email: 1 }, unique: true, sparse: true }`. Catch `E11000` and return 409.

### C8. **High** — Car / car-part deletion orphans S3 objects
**Where:** `src/app/api/admin/cars/route.ts:198-228`, `src/app/api/admin/carparts/route.ts:126-156`.
Delete the document; never delete `image`/`images` keys. Every deletion permanently orphans S3 bytes. Bills grow forever.
**Fix:** call `deleteS3Object` for each key after a successful Mongo delete; tolerate failures (orphans are recoverable, but the user-facing flow shouldn't fail).

### C9. **High** — Image edit-then-abandon also orphans
**Where:** `src/components/Admin/ImageUploader.tsx:157-180`.
"Remove" calls `/api/admin/upload/delete` immediately. If the admin removes an image, doesn't save the form, and navigates away, the DB still references the now-deleted S3 key — broken images on the public site.
**Fix:** stage removals client-side; reconcile S3 in the car PUT handler by diffing old vs new image lists.

### C10. **High** — Public dashboards / lists scan whole collections
**Where:** `src/components/Admin/Dashboard/getDashboardData.ts:84-90`, `src/app/(main)/BrowseFleet/page.tsx:26`, `src/app/(admin)/admin/dashboard/cars/page.tsx:13-19`, `src/app/api/carparts/route.ts:139`.
`find({}).toArray()` with no `limit`, no projection. The dashboard does this four times per render and filters in JavaScript. The Status widget (next pre-handover task) will hammer dashboard-shaped queries on every poll.
**Fix:** push date-range filters into Mongo (`$match` + `$group`); add `.limit(200)` and a `select`/projection on public fleet listings.

### C11. **High** — Date timezone defects in booking formatters
**Where:** `src/lib/utils/booking.ts:22-30`, `src/lib/utils/format.ts:71-79`, `src/lib/utils/validation.ts:66-77`.
`new Date("2026-03-25")` is parsed as UTC midnight. In a UK summer timezone, this renders as **24 March** in the customer's email. Same defect in every confirmation, cancellation, and review-invite template that calls `formatDate`. `validateFutureDate` rejects "today" near UTC midnight on UK summer evenings.
**Fix:** `formatDate(yyyymmdd)` should construct via `new Date(year, month-1, day)` (local) and format with explicit `timeZone: "Europe/London"`.

### C12. **High** — Quote email renders `NaN`
**Where:** `src/app/api/bookings/quote/route.ts:84` does `Number(body.vehicle.year)`. Without validation, non-numeric input becomes `NaN`, gets stored as `NaN`, and `QuoteConfirmation.tsx:68` renders the literal string `NaN` to the customer.
**Fix:** validate via Zod (`z.coerce.number().int().min(1900).max(currentYear+1)`).

### C13. **Medium** — `featured` cars have no uniqueness guarantee
**Where:** `src/lib/models/index.ts:83-91`, `src/app/api/admin/cars/route.ts`.
Multiple cars can have `featured: true`. `getFeaturedCar` returns the first. Cache TTL of 5 min hides the inconsistency further.
**Fix:** clear `featured` on all other cars when one is featured. Or: store `featuredCarId` on a singleton config doc.

### C14. **Medium** — Admin lookup collation index missing
**Where:** `src/app/api/admin/users/lookup/route.ts:29-34`.
Query uses `{ collation: { locale: "en", strength: 2 } }` for case-insensitive search. The indexes on `username`/`email` (`models/index.ts:223-226`) have **no collation**, so the strength-2 query falls back to a collection scan. Trivial today; matters when the collection is large.
**Fix:** rebuild the indexes with the same collation.

### C15. **Medium** — Cron `CRON_SECRET` open in non-production
**Where:** `src/app/api/cron/review-invites/route.ts:42`. The auth gate is `if (cronSecret && header !== bearer) return 401`. Empty `CRON_SECRET` in non-production = open route. A staging deploy without the secret is reachable from the internet.
**Fix:** require the secret unconditionally; the production-only fallback in `env.ts` should require it everywhere except `NODE_ENV === "test"`.

### C16. **Medium** — Money mixed as floats and integers
**Where:** `src/lib/interfaces.ts:7,214`. Cars use whole pounds (`number`). Parts use floats with pennies (`149.99`). Service packages use `priceInPence: number` AND a free-form `price: string` (`"£150"`, `"£300-£600"`). The admin can change one and not the other; nothing keeps them in sync.
**Fix:** integer pence everywhere; render via `formatPrice(p) = "£" + (p/100).toFixed(2)`. Drop free-form `price` strings; derive at render time.

### C17. **Medium** — Recovery `pricingTiers[].price` is freeform
**Where:** `src/lib/utils/businessInfo.ts:413-414`. Strings like `"From £60"` and `"Call Us"`. Not aggregable, not validated.
**Fix:** structured shape (`fromPence: number | null`, `displayLabel: string`) with validation in the admin form.

### C18. **Medium** — `_id?: string` interface lies about runtime type
**Where:** `src/lib/interfaces.ts:2,138,176,189,210`.
At runtime `_id` is `ObjectId`. The interface says `string`. Drives the `as unknown as Parameters<...>` casts at `src/app/api/admin/cars/route.ts:182-183, 213-215`, `src/app/api/admin/carparts/route.ts:111, 143`, `src/app/api/admin/bookings/route.ts:124-130`.
DAY_PLAN has carried this as "pre-existing tsc errors" through three days; **there are no compile errors today** — the casts hide a type hole, not a build break. 30-minute fix.
**Fix:** declare `_id?: string | ObjectId`; let route consumers pick the form they need; delete the casts.

### C19. **Medium** — Public `/api/carparts` GET self-seeds on empty collection
**Where:** `src/app/api/carparts/route.ts:122-126`.
Public unauthenticated GET runs `insertMany(seedCarParts)` if the collection is empty. Cute for dev; in prod it means anyone hitting the endpoint after a DB wipe forces seeding back in, possibly with stale defaults.
**Fix:** move seeding to the migration script; remove the public auto-seed.

### C20. **Medium** — `image` / `images` fields accept arbitrary strings
**Where:** `src/app/api/admin/cars/route.ts:33-36`. Zod schema is `z.string()` with no URL validation, no host allow-list, no length cap. An admin (or a compromised admin) can write hundreds of garbage strings.
**Fix:** `.url()` + allow-list of CloudFront/S3 hosts + `.array().max(20)`.

---

## D. Validation and types

### D1. **High** — Three booking POST routes have no Zod schema
**Where:** `src/app/api/bookings/viewing/route.ts:39`, `src/app/api/bookings/service/route.ts:39`, `src/app/api/bookings/quote/route.ts:34`.
All declare `let body: any` (with eslint-disable). `body.carDetails.year` flows directly into Mongo as whatever the client sent. Dates are `string`, prices may be `string`, optional fields are absent — and the email templates render whatever's there.
**Fix:** Zod schemas mirroring the existing (good) `cars/route.ts` pattern.

### D2. **Medium** — `request.json()` not wrapped in try/catch in several routes
Notably `src/app/api/admin/users/password/route.ts:47`. Malformed JSON → 500 instead of 400.

### D3. **Medium** — `decodeURIComponent` not guarded
**Where:** `src/app/api/admin/upload/delete/route.ts:38-39`. Throws on malformed input → 500 instead of 400.

### D4. **Medium** — Validation duplication and drift between client and server
`sanitizeInput` exists client-side in every booking form; `sanitizeName`/`sanitizeString` exist server-side. The two diverge on what they strip. Centralise into one utility module that runs server-side (authoritative) and is also imported client-side for previewing.

### D5. **Medium** — Loose email regex
`/^[^\s@]+@[^\s@]+\.[^\s@]+$/` everywhere. Accepts `a@b.c`. Use the WHATWG/Zod email validator; reject obviously bogus addresses earlier.

### D6. **Low** — Loose tsconfig
**Where:** `tsconfig.json:11`. `"strict": true` is set, but the four expensive guards are off: `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`.
**Fix:** turn them on, fix the fallout. The biggest win is `noUncheckedIndexedAccess`.

---

## E. File uploads and S3

### E1. **High** — No file size limit on presigned uploads
**Where:** `src/lib/utils/s3.ts:39-47`. The PUT URL has no `Content-Length` constraint. Authenticated user can upload arbitrarily large files.
**Fix:** use `createPresignedPost` with `Conditions: [["content-length-range", 0, 10*1024*1024]]` instead of `getSignedUrl(PutObjectCommand)`.

### E2. **Medium** — Content-Type is client-supplied
**Where:** `src/app/api/admin/upload/route.ts:38`. `contentType` comes from the request body. The presigned URL is bound to that type, but S3 doesn't MIME-sniff bytes. Mismatch = a `.html` file masquerading as `image/png`.
**Fix:** validate the file extension matches a known allow-list AND that the first bytes match (server-side, after upload — or client-side via `File.type` + a magic-bytes check).

### E3. **Medium** — `/api/admin/upload/delete` has no key-ownership check
**Where:** `src/app/api/admin/upload/delete/route.ts`.
Any authenticated admin can delete any `cars/*` or `parts/*` key, regardless of which document references it. Audit log absent.
**Fix:** require the caller to provide the document ID; verify the key belongs to that document before deletion.

### E4. **Low** — `ALLOWED_FOLDERS` and `ALLOWED_PREFIXES` duplicated
**Where:** `src/app/api/admin/upload/route.ts:12` vs `src/app/api/admin/upload/delete/route.ts:5`. Two sources of truth for the same list. Drift risk.

### E5. **Low** — Presigned URL TTL of 5 min
Reasonable. Worth knowing it's there.

---

## F. Logging, secrets, observability

### F1. **High** — Real production credentials sit in `.env.local`
**Where:** `/Users/shahzarali/Documents/ProgrammingLife/carsales/.env.local`.
Confirmed: **the file is gitignored and not tracked** (`git ls-files .env.local` returns empty). It is safe from a public-repo leak. However:
- It contains a live MongoDB Atlas password, a Resend API key, and a Vercel OIDC token.
- It was readable by audit agents during this investigation.
- Rotating these secrets is good hygiene whenever any third party (including coding agents) has touched the file.
**Fix:** rotate the three secrets at your convenience; document the rotation procedure in the dev handover docs.

### F2. **High** — No structured logging, no error reporting
The only telemetry is `console.log/warn/error` (40+ instances in `src/app/api/**`). On Vercel these land in the function logs UI — searchable but ephemeral, no alerting.
- Booking 500: `src/app/api/bookings/service/route.ts:130`. Customer hits a 500, admin never knows.
- Email send failure: `src/emails/send.ts:110`. Booking succeeds, email silently fails.
- Cron run: `src/app/api/cron/review-invites/route.ts:134`. No heartbeat outside the cron's own log.
**Fix:** wire Sentry (free tier covers this scale). 30-minute setup. Plus a heartbeat URL for the cron (DeadMansSnitch / BetterStack).

### F3. **Medium** — Customer PII in cron logs
**Where:** `src/lib/utils/reviewInvite.ts:173-175`. Customer name and email logged on every invocation. GDPR-relevant.
**Fix:** log the booking reference only; never the email/name.

### F4. **Medium** — Mongo connection error may include the URI
**Where:** `src/backend/mongodb.ts:38`. On initial connection failure, the error string from the driver can include the URI and (depending on parse) the password.
**Fix:** wrap and re-throw with a redacted message.

### F5. **Medium** — Email send chatter logs subject lines
**Where:** `src/emails/send.ts:80, 107`. Booking subjects contain references; refs are not secret but are bookings. Logs them on every send in production.

### F6. **High** — Junk file `src/hooks/# Code Citations.md` (16,448 lines, 405 KB)
A pasted bundle of env-validator snippets accidentally committed to a hooks directory. Pollutes grep, search, and editor file lists. Markdown isn't bundled so there's no runtime cost; it's purely a hygiene issue.
**Fix:** delete.

---

## G. Frontend correctness, hydration, motion

### G1. **High** — `framer-motion` imported but only `motion` is in `package.json`
**Where, confirmed by grep:**
- `src/components/UI/PageLoader.tsx:7`
- `src/components/UI/Skeleton/Skeleton.tsx:3`
- `src/components/UI/Skeleton/PackageCardSkeleton.tsx:3`
- `src/components/UI/Skeleton/CarDetailSkeleton.tsx:3`
- `src/components/UI/Skeleton/HeroFeaturedCarSkeleton.tsx:3`
- `src/components/UI/Skeleton/CarListCardSkeleton.tsx:3`
- `src/components/UI/Skeleton/CarCardSkeleton.tsx:3`

`package.json:30` declares `motion ^12.23.12`. `framer-motion` is only in the lockfile as a transitive dep. The build works **today** because `motion@12` re-exports from `framer-motion`, but a lockfile bump can drop the transitive and the build breaks.
**Fix:** rewrite imports to `from "motion/react"`. Or add `framer-motion` as a direct dep and pin it.

### G2. **High** — Hydration mismatch from `window.location.href` read during render
**Where:** `src/components/Car/CarDetailView.tsx:142`, `src/components/SEO/ShareButton.tsx:143-145`, `src/components/SEO/CarShareCard.tsx:40`.
Server renders the relative path or empty string; client renders the absolute URL. React 19 logs a hydration warning and may swap subtrees.
**Fix:** initialise via `useState("")` then `useEffect(() => setUrl(window.location.href), [])`. Or compute from `NEXT_PUBLIC_SITE_URL` server-side.

### G3. **High** — No focus trap or focus restoration in `Modal`
**Where:** `src/components/Helpful/Buttons/Modal.tsx:25-101`.
Once a modal opens, Tab walks back into the page underneath. ConfirmDialog manually focuses Cancel (`UI/ConfirmDialog.tsx:96-98`) but the trap is missing. Affects every dialog in the app.
**Fix:** small focus-trap util (e.g. inline `focus-trap-react` pattern, ~30 lines) plus saving/restoring `document.activeElement`.

### G4. **High** — Form labels not associated with inputs
**Where:** `src/components/Form/FormPrimitives.tsx:298-341`.
`FormInput` and `FormTextarea` wrap an `<input>` inside a `<label>` but never set `htmlFor`/`id`. Most screen readers handle nested labels but not all; Voice Control on iOS fails. `required` is shown visually but never set on the underlying input or as `aria-required`.
**Affected forms:** every public booking form, every admin form, every password form.
**Fix (15 min):** `useId()` + `htmlFor={id}` + `id={id}`. Forward `required` and add `aria-required`.

### G5. **High** — Dropdown is not WAI-ARIA listbox-compliant
**Where:** `src/components/Form/Dropdown.tsx`.
- Focus stays on trigger; listbox is not focusable.
- No type-ahead (letter typing).
- No Home/End/PageUp/PageDown.
- Document-level `keydown` listener is fragile (any `stopPropagation` upstream breaks it).
- No `aria-labelledby` on the listbox.
- Focus not restored to trigger on close.

Used in every booking form's time-slot picker.

### G6. **High** — Toast accessibility is contradictory
**Where:** `src/components/Toast/Toast.tsx:101`, `src/components/Toast/ToastContainer.tsx:23`.
Each toast carries `role="alert"` (assertive) inside a container with `aria-live="polite"`. Screen readers may double-announce or pick the wrong policy. Errors should be assertive, success polite — currently mixed and inconsistent.
**Fix:** drop `role="alert"` per-toast; set `aria-live` on the container based on the most-severe toast in the queue.

### G7. **High** — `Helpful/Buttons/Button.tsx` has no focus-visible styles
Legacy button still in 30+ call sites. Keyboard users see nothing when focus lands on a primary action.
**Fix:** add `focus-visible:outline-2 focus-visible:outline-red-600 focus-visible:outline-offset-2`. Or migrate the call sites to `UI/Button.tsx`.

### G8. **High** — Booking forms silently truncate input
**Where:** `src/components/Main/Form/CarViewingForm.tsx:32-38`, `src/components/Main/Form/ServiceBookingForm.tsx:38-44`.
`sanitizeInput` truncates at 500/1000 chars and strips `<` `>` characters. A user typing "I have <3 years experience" loses the `<3`. A user pasting a long note gets cut off without warning.
**Fix:** use the truncation as a server-side guard only; client-side, show a character counter and warn at 90%.

### G9. **High** — Mobile nav menu has no focus trap, no Escape, no `aria-expanded` on toggle
**Where:** `src/components/Dropdown/NavMenu.tsx:33-72`. Once open, keyboard users can't dismiss it without clicking the close button. The desktop submenu (`NavLink.tsx:42-65`) opens on hover only — keyboard inaccessible — yet leaves its links in the tab order, hidden but reachable.

### G10. **High** — Double-submit not protected on booking forms
**Where:** `src/components/Form/Form.tsx:80-89` plus the form's `setTimeout(..., 2000)` redirect (`CarViewingForm.tsx:309-314`).
After `setIsSubmitting(false)` fires in `finally`, the 2-second window before redirect leaves the submit button enabled. A fast click before redirect submits twice.
**Fix:** keep `isSubmitting=true` until redirect; or check `submitted` flag before re-firing.

### G11. **High** — `getCar` / `getCars` swallow errors silently
**Where:** `src/app/(main)/BrowseFleet/[_id]/page.tsx:64-76`, `BrowseFleet/page.tsx:23-32`.
DB error → caught → returns `null`/`[]`. User sees an empty list with no error message. No telemetry to know it happened.
**Fix:** throw to the route's `error.tsx`; render a "We couldn't load this — try again" state with a retry button.

### G12. **High** — `/tesla.webp` ships as a fallback for any car missing an image
**Where:** `src/components/Car/CarListCard.tsx:63`, `CarDetailView.tsx:42, 193`, `HeroSection.tsx:80`.
A real BMW with no images uploaded would render with a stock Tesla photo. The Day 1 audit fixed the *hardcoded* Tesla on the detail page; the fallback survived.
**Fix:** generic placeholder per body style (or a styled empty-state with the make/model in text).

### G13. **Medium** — Hover-only desktop submenus
**Where:** `src/components/Dropdown/NavLink.tsx:42-65`. `lg:group-hover:block`. No `aria-haspopup`, no `aria-expanded`, no Enter handler. Touch users on hybrid devices and keyboard users can't reach it.

### G14. **Medium** — Unmemoised context providers
**Where:** `src/contexts/FilterContext.tsx:111`, `src/contexts/ToastContext.tsx:106-115`, `src/backend/ViewingContext.tsx:64-72`.
Provider value object is recreated every render. Every consumer re-renders on every reducer action.
**Fix:** `useMemo` the value object; or split into two contexts (state + dispatch).

### G15. **Medium** — Stale `viewType` closure in `CarView` resize handler
**Where:** `src/components/Car/CarView.tsx:26-38`. `useEffect(..., [])` with empty deps; `handleResize` reads `viewType` from closure → always sees the initial value.
**Fix:** include `viewType` in the deps, or use a ref.

### G16. **Medium** — `useMemo` defeated on multi-step forms
**Where:** `src/components/Main/Form/CarViewingForm.tsx:95-263`, `ServiceBookingForm.tsx:191-580`.
Memo deps include the `data` object, recreated on every keystroke. Memo invalidates every keystroke, rebuilding the steps array and re-binding `validate()` closures. The memo is doing nothing.
**Fix:** drop the `useMemo` (it's not buying anything) or memoise around step *content* only.

### G17. **Medium** — `<Image priority>` without `sizes` on the hero
**Where:** `src/components/HeroSection.tsx:79-85`. Loads the largest variant on mobile.

### G18. **Medium** — `text-gray-300` / `text-gray-400` contrast failures
Used liberally for placeholder, helper, and disabled text. Fails WCAG 2.1 AA at 14px / non-bold. Show up in `Form.tsx:142`, `FormPrimitives.tsx:312`, the disabled-text class on the legacy Button.

### G19. **Medium** — No route-segment `error.tsx`
**Where:** `src/app/(admin)/`, `src/app/(main)/BrowseFleet/`, `src/app/(main)/Booking/`. A failure inside the dashboard tears down to root error.tsx.
**Fix:** add segment-level `error.tsx` files.

### G20. **Medium** — Bookings touchpoints render `AM/PM` and `en-US` in one place
**Where:** `src/app/(main)/AboutUs/page.tsx:565`. `toLocaleDateString("en-US", { weekday: "long" })`. Day 5 missed it. Cosmetic (weekday strings are the same in en-GB/en-US for Monday–Sunday) but it should be normalised for consistency.

### G21. **Low** — Contact info pulls `priceMaxInPence: 80000` hardcoded
Search shop config; verify the integer-pence values match the displayed strings in `BusinessInfoForm.tsx`.

---

## H. Build, CI, deployment

### H1. **High** — `npm run type-check` is documented but doesn't exist
**Where:** `SETUP.md:285` and `.github/copilot-instructions.md:219` reference `npm run type-check`. `package.json:5-19` has no such script. CI also has no type-check job — the only path to compile errors is `next build` (slow) or `ts-jest` per file (file-scoped).
**Fix:** add `"type-check": "tsc --noEmit"` to scripts; add a parallel CI job that runs it.

### H2. **High** — Documented `.env.example` doesn't exist
**Where:** `SETUP.md:23` instructs `cp .env.example .env.local`. There is no `.env.example`. New-developer onboarding fails on step one.
**Fix:** create `.env.example` covering every env var (see H3).

### H3. **High** — `src/lib/env.ts` schema is incomplete
**Where:** `src/lib/env.ts:11-45`. Missing from validation:
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `CLOUDFRONT_DOMAIN` (all read in `src/lib/utils/s3.ts`).
- `CRON_SECRET` (read in `src/app/api/cron/review-invites/route.ts:31`).
- `NEXT_PUBLIC_BASE_URL` (read in `src/lib/utils/reviewInvite.ts:79`).
- `EMAIL_FROM_NAME`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (read in `src/emails/send.ts`).
- All `NEXT_BUSINESS_*` vars referenced from `jest.env.setup.js`.

The "fail-fast at boot" promise of `instrumentation.ts` is broken for image upload, cron, and email.
**Fix:** add the missing fields with appropriate defaults. Make `EMAIL_FROM` required in production (not defaulted to `noreply@yourdomain.com`).

### H4. **High** — `RESEND_API_KEY` is vestigial
**Where:** `jest.env.setup.js:18`, `SETUP.md`. Codebase uses **nodemailer**, not Resend (`src/emails/send.ts:34-67`). Stale from a prior iteration.
**Fix:** remove the env var from setup files and docs; rename CI placeholder.

### H5. **High** — README.md / DAY_PLAN.md / design.md / AGENTS.md don't exist (or are renamed)
**Where:** `.github/copilot-instructions.md` references `design.md` repeatedly (`:151,160,233`); `SETUP.md:265` references `tailwind.config.js` which doesn't exist (Tailwind 4 uses CSS, not JS config). DAY_PLAN.md *does* exist (we've been editing it). README.md state needs verification — the audit reported it missing; the repo's `package.json` doesn't reference it.
**Fix:** treat as part of the "developer handover docs" pre-handover task.

### H6. **High** — CI redundantly runs `npm ci` five times
**Where:** `.github/workflows/ci.yml:28, 42, 56, 86, 123`. Each job installs from scratch. With `cache: npm` you save the tarball download but not the install. ~30s × 5 = 2.5 min wasted per CI run.
**Fix:** one setup job that installs and uploads `node_modules` as an artifact (or use a reusable workflow).

### H7. **Medium** — CI E2E port-up check is too weak
**Where:** `.github/workflows/ci.yml:135-140`. `curl http://localhost:3000` returns 200 even on a server that's still JIT-compiling and may 500 on the first real request.
**Fix:** poll a known endpoint (`/api/admin/session` returns 401 quickly) and check the status code is in `{200, 401, 405}`.

### H8. **Medium** — CI has no coverage threshold
Coverage is collected but never asserted. The DAY_PLAN aspires to 80%; nothing enforces it.

### H9. **Medium** — No `engines` field in `package.json`
CI pins Node 20; contributors and Vercel get whatever they have. `SETUP.md:16` says "Node.js 18+" — drifted from CI.
**Fix:** `"engines": { "node": ">=20" }`.

### H10. **Medium** — `.gitignore` redundancy
**Where:** `.gitignore:34` (`.env*`) and `:42` (`.env*.local`). Both target the same files. If you ever add `.env.example`, the `.env*` rule will hide it.
**Fix:** `.env*\n!.env.example`.

### H11. **Medium** — `tools/` excluded but doesn't exist
**Where:** `tsconfig.json:40`, `eslint.config.mjs:21`. Dead config from a long-since deleted directory.

### H12. **Medium** — Hardcoded `localhost:3000` fallbacks
**Where:** `src/app/sitemap.ts:5`, `src/app/robots.ts:4`, `src/app/layout.tsx:14`, `src/lib/utils/reviewInvite.ts:79`. Production deploy without `NEXT_PUBLIC_SITE_URL` advertises localhost in the sitemap and review invites.
**Fix:** make `NEXT_PUBLIC_SITE_URL` required in production (already in env.ts schema, but not enforced in production via the `optional()` chain).

### H13. **Low** — Lockfile health
`package-lock.json` is `lockfileVersion: 3`. No major drift detected. `motion` and `framer-motion` both present (G1).

### H14. **Low** — `^` on 0.x packages
`lucide-react: ^0.542.0`, `server-only: ^0.0.1`, `prettier-plugin-tailwindcss: ^0.7.1`. Per semver convention, 0.x minor bumps are breaking. Pin these.

### H15. **Low** — Multi-purpose commits
`feat: Day 4 — shared primitives (format, apiResponse, Button, ConfirmDialog, StatusBadge, EmptyState, useApi, useScrollLock)` is 8 features in one commit. Fine for personal tracking; harder to revert.

---

## I. Tests

### I1. **High** — Brittle Tailwind class assertions
40+ instances. Examples:
- `__tests__/components/UI/Button.test.tsx:51,57,58,63,65,70,77,82`
- `__tests__/components/UI/StatusBadge.test.tsx:22,27,37,38,43,48,60`
- `__tests__/components/Services/Common/ContactSection.strict.test.tsx:212–378`

Renaming a Tailwind token (`bg-red-600` → `bg-primary`) breaks every test.
**Fix:** test behaviour, not class names. Where you must test styles, abstract via `data-state` attributes.

### I2. **High** — Mock-the-world tests prove nothing
- `__tests__/components/Header.test.tsx:6-39` mocks `NavMenu` and `NavLink`, then asserts the mocks rendered. Real header bugs invisible.
- `__tests__/components/Admin/CarPartsManagement.test.tsx:33-170` mocks Button, Modal, Toast, router, every Lucide icon. Tests the test setup.
- `__tests__/api/admin/health.test.ts:9-11, 51` mocks `getHealthData`, then asserts the mock's return value flows through. The route is 13 lines of pass-through.
**Fix:** mock the boundary (network/DB), not the unit under test.

### I3. **High** — `jest-axe` runs in 2 of 50+ component test files
Installed and listed as a tech-stack pillar in `.github/copilot-instructions.md:19`. Used in `ServiceHero.test.tsx` and `ServiceHero.strict.test.tsx` only.
**Fix:** add axe assertions to AdminForm, FormPrimitives, Modal, Dropdown, ConfirmDialog, Toast at minimum.

### I4. **Medium** — Tests with `querySelector('[class*="…"]')`
**Where:** `__tests__/components/Services/Common/ServiceHero.test.tsx:49,68`. Rebuilds break the assertion.

### I5. **Medium** — `Simple.test.tsx` is a smoke artefact
**Where:** `__tests__/components/Simple.test.tsx`. Six lines testing nothing. Delete.

### I6. **Medium** — Two competing env-restoration patterns in one file
**Where:** `__tests__/utils/auth.test.ts:155, 311-316`. `Object.defineProperty(process.env, …)` in one block, `afterEach` cleanup with a different mechanism.
**Fix:** consolidate into a single helper.

### I7. **Medium** — Coverage shape is misleading
`jest.config.js:23-27` collects coverage from all of `src/`. Render-only server pages inflate the line-coverage number; real assertions concentrate in pure utilities (`format.test.ts`, `auth.test.ts`).
**Fix:** exclude server-page paths from coverage; report on `lib/`, `components/`, `app/api/` separately.

### I8. **Medium** — `jest.useFakeTimers()` in Toast tests' beforeEach
**Where:** `__tests__/components/Toast.test.tsx:57`. Every test runs with fake timers — slows debug, hides real time bugs.

### I9. **Low** — Critical-path coverage gaps
Multi-step forms tested in pieces but not as flows. AuthContext redirect race not reproduced. Middleware CSRF not tested. The new Playwright suite plugs most of this.

---

## J. E2E suite (newly added)

### J1. **Critical** — E2E suite cannot pass as-shipped
The 10 new specs in `e2e/` were committed as ✅ Done in DAY_PLAN.md but cannot have been run end-to-end. Specific issues:

- **No admin user seeding** — every admin spec (5 of 10) hits "Invalid credentials" (see A3).
- **Wrong collection name** — `e2e/fixtures/db.ts:104` writes to `bookings`. The app reads from `carViewingBookings` (`src/lib/models/index.ts:142`). Booking lookup spec fails.
- **Wrong field shape** — same fixture writes `customerEmail` flat. The lookup route reads `booking.customerInfo.email` (`bookings/lookup/route.ts:71`).
- **Multi-step form selectors are loose** — I wrote `getByRole("button", { name: /next|continue/i })` patterns from reading source, not running the app. Expect 2–4 selector mismatches on first headed run.

**Fix order (under 1 hour):**
1. Add `seedAdminUser()` to `e2e/fixtures/db.ts` (bcrypt rounds=12 to match `src/lib/utils/auth.ts:46`); wire into a `globalSetup` referenced from `playwright.config.ts`.
2. Change `seedViewingBooking` to write to `carViewingBookings` and to use the `customerInfo: { email, name, phone }` shape.
3. Run `npm run test:e2e:headed` locally; fix selectors as the browser walks through.

---

## K. Dead code, drift, hygiene

### K1. **High** — `src/hooks/# Code Citations.md` (16,448 lines, 405 KB) accidentally committed
Pasted env-validator snippets. Junk.
**Fix:** delete.

### K2. **High** — Two parallel Button implementations
`Helpful/Buttons/Button.tsx` (legacy, no focus-visible) + `UI/Button.tsx` (modern, recommended). Migration is half-done.
**Fix:** scripted migration of the 30+ legacy call sites; delete the legacy file.

### K3. **Medium** — Documentation references commands that don't exist
- `npm run type-check` (H1).
- `node scripts/setup-admin.mjs` (A3).
- `cp .env.example .env.local` (H2).
- `tailwind.config.js` referenced in `SETUP.md:265` (Tailwind 4 has no JS config).

### K4. **Medium** — `plans/` directory items are done but the files persist
`plans/aws-s3-image-upload.plan.md` and `plans/quality-consistency-test-debt.plan.md` are both implemented. Worth archiving (move to `plans/done/` or delete).

### K5. **Low** — Hardcoded Tesla photos (G12 above) and "2023 BMW X5" fallback string in `HeroSection.tsx:103`
Dead branches; ternary already guarantees `featuredCar` exists.

### K6. **Low** — `BookingDetailsModal.tsx:121` misuses `customWidth`
Passes background classes through a sizing prop. Works because it's appended; symptom of the legacy Button's lax API.

---

## L. The "fix me first" punch list

Ordered for impact-per-hour. Status reflects fixes landed on the
`ci/github-actions` branch (which also carries the original CI work and
will need a rename to something like `fix/codebase-issues` before push).

| # | Severity | Issue | Effort | Status |
| --- | --- | --- | --- | --- |
| 1 | Critical | A1 — gate `users/password` POST behind `hasMinimumRole("admin")` for admin resets | 15 min | ✅ Done |
| 2 | Critical | A2 — stop returning plaintext passwords in HTTP responses; use email-link reset | 2 hr | ⚠️ Partial — endpoint hardened (rate limit, role gate, audit log); plaintext-in-response left as a TODO(security) comment because building the email-link flow needs product/infra decisions |
| 3 | Critical | A3 — create `scripts/setup-admin.mjs`; wire into E2E `globalSetup`; document in SETUP.md | 30 min | ✅ Done |
| 4 | Critical | C1 — fix cron at-most-once via `findOneAndUpdate` claim-then-send | 30 min | ✅ Done |
| 5 | Critical | J1 — fix the E2E fixtures (collection name, field shape, admin seeding) | 30 min | ✅ Done |
| 6 | High | A4 — `await session.destroy()` in logout | 2 min | ✅ Done |
| 7 | High | A5 — type-guard `username`/`password` on login | 5 min | ✅ Done |
| 8 | High | C2 — migration script `client.db("MMC")` | 1 min | ✅ Done |
| 9 | High | C3 — partial-unique index on booking slot triple; catch `E11000` | 1 hr | ✅ Done |
| 10 | High | C8 — delete S3 keys when cars/parts are deleted | 30 min | ✅ Done |
| 11 | High | G1 — rewrite `framer-motion` imports to `motion/react` | 10 min | ✅ Done (7 files) |
| 12 | High | G4 — `useId` + `htmlFor` on FormInput/FormTextarea | 15 min | ✅ Done |
| 13 | High | G3 — focus trap + restoration in Modal | 1 hr | ✅ Done |
| 14 | High | C11 — fix date timezone (`new Date("YYYY-MM-DD")` parsing) in formatters | 1 hr | ✅ Done (format.ts, booking.ts, validation.ts) |
| 15 | High | F1 — rotate the three secrets in `.env.local`; document the procedure | 30 min | ⚠️ User-only — sandbox cannot rotate dashboard secrets |
| 16 | High | F2 — wire Sentry; add a cron heartbeat | 1 hr | ⚠️ Shim only — added `src/lib/utils/observability.ts:logError`/`logEvent`; Sentry wiring left as a TODO(infra) because it needs a Sentry account + DSN |
| 17 | High | K1 — delete `src/hooks/# Code Citations.md` | 1 min | ⚠️ User-only — sandbox cannot `rm` inside the workspace mount; run `rm "src/hooks/# Code Citations.md"` locally |
| 18 | High | H1 — add `type-check` script + CI job | 15 min | ✅ Done |
| 19 | High | H2 — create `.env.example` | 15 min | ✅ Done |
| 20 | High | H3 — add missing env vars to `lib/env.ts` schema | 30 min | ✅ Done |
| 21 | High | C18 — fix `_id?: string \| ObjectId`; delete the `as unknown as` casts | 45 min | ✅ Done |
| 22 | High | A12 — consolidate to one rate limiter; back with KV/Upstash | 3 hr | ⚠️ Partial — `validation.ts:checkRateLimit` is now a thin wrapper around `rateLimit.ts:createRateLimiter` (one store). KV/Upstash backing left as a TODO(infra) |
| — | Medium | C6 — cancel/confirm compare-and-set | 30 min | ✅ Done |
| — | Medium | C7 — unique sparse index on adminUsers.email | 5 min | ✅ Done |
| — | Medium | C12 — Zod-validate booking POSTs | 1 hr | ✅ Done (viewing, service, quote) |
| — | Medium | A6 — keep login limiter on success | 1 min | ✅ Done |
| — | Medium | A8 — constant-time login | 10 min | ✅ Done |
| — | Medium | F3 — strip PII from cron logs | 5 min | ✅ Done |
| — | Medium | G2 — fix hydration mismatch on share URL | 30 min | ✅ Done (CarDetailView, ShareButton, CarShareCard) |
| — | Medium | H4 — remove vestigial RESEND_API_KEY | 5 min | ✅ Done |
| 23 | Medium | All the rest as time allows | | |

The first five Criticals are landed (with A2 partial — see above). Items 6–14 are all landed. The four `⚠️` items are blocked on either infra decisions or sandbox limitations and need 5 minutes of you locally.

**Verification on the branch:**
- `npm run lint` → 0 errors, 58 warnings (all pre-existing in email templates and tests)
- `npx tsc --noEmit` → clean
- `npm run test:e2e` → still needs `npm install` to pull `@playwright/test` (sandbox can't reach the registry)
- `npm test` → not run locally; needs `npm install` first because `motion@12` was rewired

---

## M. What this audit deliberately didn't cover

- Performance under load (no profiling done).
- Visual regression (no screenshot baseline).
- Browser-compatibility matrix.
- Internationalisation beyond en-GB/en-US drift.
- Mobile-app integration (none exists).
- Payment processing (none exists; if added, all rate-limit and fraud-detection gaps become Critical).
- A fresh dependency vulnerability scan (`npm audit` not run from the audit sandbox).

---

*Generated 2026-05-10 from a deep multi-domain investigation. Update as items are fixed; tag completed entries with the commit SHA.*
