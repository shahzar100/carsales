# Morley Motor Company — Deep-Dive Handover Report

**Date:** 2026-05-20 (Wed) → handover this Saturday
**Branch reviewed:** `main` @ `9e83e38` (working tree on `fix/e2e-regressions` has 3 unrelated dashboard/index edits)
**Scope:** UX/UI · CTAs · code debt · security · performance · customer-flow bugs · handover readiness
**Method:** Static analysis at HEAD + verification against `HANDOVER_REVIEW_2026-05-20.md`. Three specialist sub-audits (security, perf, UX/CTA/a11y) run in parallel; every claim below cites file:line and was re-checked against source. No live browser walkthrough — see *§9 Caveats*.

> This complements (not replaces) `HANDOVER_REVIEW_2026-05-20.md`. That file's punch-list is the **starting** menu; this file **verifies** what's still open and adds **~40 new findings** the previous report missed, several of them Sev-1.

---

## TL;DR — what's actually critical for Saturday

Two new findings deserve to leapfrog the previous report's P0 list:

| Rank | New finding | File:line | Effort | Why |
|---:|---|---|---|---|
| 🔥 1 | **`/api/carparts` GET silently writes mock seed data to prod Mongo when empty** | `src/app/api/carparts/route.ts:124-127` | 5 min | A public, unauthenticated GET *inserts* a hardcoded list of BMW/Honda/Toyota mock parts on the first request after the collection is empty. Anyone (or any robot) hitting the endpoint can repopulate junk inventory. |
| 🔥 2 | **Admin PUT routes have mass-assignment / NoSQL operator injection** | `src/app/api/admin/carparts/route.ts:107-123` and `src/app/api/admin/bookings/route.ts:80-91` | 30 min | `const { _id, ...updateData } = body; ... $set: updateData` with no zod and no `$`-prefix strip. Any authenticated admin/staff can send `{price: {$inc: 999}, $rename: {name: "x"}}` and corrupt every part / booking. Combine with the staff role-gating gap (prior report §2b.3) — a stolen `staff` cookie compromises the whole catalog. |
| 🔥 3 | **Header "Book a Viewing" CTA is `hidden sm:inline-flex`** | `src/components/Header.tsx:332` | 30 sec | Not just routed wrong (per prior §3.4) — it's *invisible* on phones <640px. The single most-clicked CTA on the site doesn't exist on the most common viewport. |
| 🔥 4 | **Every rate-limiter reads `x-forwarded-for` and trusts the first hop** | 9 auth/account routes | 15 min sweep | Spoofable header → all rate limits bypassed by header rotation. Already on Vercel `@vercel/functions` which exposes `ipAddress(request)`; bookings routes use it, auth/account routes don't. |
| 🔥 5 | **KV rate-limiter fails OPEN on errors** | `src/lib/utils/rateLimit.ts:155-165` | 15 min | One KV blip removes every limiter. Login brute-force window opens silently. |
| 🔥 6 | **Hero section z-index clashes with WhatsApp button** | `src/components/HeroSection.tsx:25` + `src/components/WhatsAppButtonClient.tsx:72` | 1 min | Both `z-50`. On any page with the hero, decorative gradient blobs render OVER the WhatsApp CTA. Trivial fix, visible mobile bug. |
| 🔥 7 | **NextAuth Credentials provider is a timing oracle** | `src/auth.ts:128-156` | 5 min | Returns `null` immediately on unknown email without running bcrypt — response-time distinguishes "no account" from "wrong password" → account enumeration. The admin login route already mitigates this with a dummy hash; mirror it. |

If you do nothing else from this report, add the above seven to the prior report's existing P0 punch list.

---

## 1. Verification of prior `HANDOVER_REVIEW_2026-05-20.md` findings

The earlier report had several findings labeled "STILL OPEN". I re-read every file before writing this. Results:

### 1a. Security (§2)

| # | Prior finding | Status as of 2026-05-20 |
|---|---|---|
| 2b.1 | CRON_SECRET string `!==` (timing oracle) | **VERIFIED OPEN** — `src/app/api/cron/review-invites/route.ts:108` unchanged |
| 2b.2 | `SESSION_SECRET \|\| FALLBACK_SECRET` empty-string bypass in prod | **ALREADY FIXED** — `src/lib/env.ts:101-105` throws in prod (`!isBuildPhase && !SESSION_SECRET`). The prior report missed this; it's a bug in that report, not a remaining task. |
| 2b.3 | Admin write routes use `isAuthenticated()` not `hasMinimumRole` | **VERIFIED OPEN** across 10 routes (full list below). Material risk because §2b.4-6 mass-assignment bugs are reachable from `staff` role. |
| 2b.4 | TOTP secret stored as plaintext base32 | **VERIFIED OPEN** — `src/lib/utils/twoFactor.ts:42` (`secret: secret.base32`), persisted at `verify/route.ts:101` |
| 2b.5 | `/api/admin/carparts` POST validation loose | **VERIFIED OPEN** and **worse** — PUT (L107-123) has actively-exploitable mass-assignment, see new finding §2.1 below |
| 2b.6 | `admin/shop` `as ShopInfo` casts | **VERIFIED OPEN** — L168-174 casts `socialMedia`, `heroStats`, `detailingPackages`, `tintOptions`, `serviceOverviews`, `recovery` straight from body |
| 2b.7 | Admin cookie missing `__Host-` prefix | **VERIFIED OPEN** — `auth.ts:41` still `carsales_admin_session` |
| 2b.8 | Register account enumeration | **VERIFIED OPEN** — `auth/register/route.ts:81,102` both return `"An account with that email already exists"` |
| 2b.9 | `/api/admin/2fa/enroll` no rate limit | **VERIFIED OPEN** — file has no limiter call |
| 2b.10 | `/api/csp-report` no rate limit | **VERIFIED OPEN** — `csp-report/route.ts` no limiter |

### 1b. Customer-flow bugs (§3)

| # | Prior bug | Status |
|---|---|---|
| 3.1 | Half-hour booking slots rejected by API | **VERIFIED OPEN** — `validation.ts:101-114` still only on-the-hour times; `BookingFlow.tsx:51-67` still offers `:30` slots |
| 3.2 | `/Booking/[_id]` loses car on refresh | **VERIFIED OPEN** — `ViewingContext.tsx:40` is `useState({})` with zero persistence |
| 3.3 | Saved cars page 401s every customer | **VERIFIED OPEN** — `SavedCarsPage.tsx:46` still hits `/api/admin/cars` |
| 3.4 | Header "Book a Viewing" → wrong page | **VERIFIED OPEN** — `Header.tsx:333` still `href="/Book"` (and see new finding 5.2 below: same CTA hidden on mobile) |
| 3.5 | "Vehicle Not Found" returns 200 not 404 | **VERIFIED OPEN** — `BrowseFleet/[_id]/page.tsx:169` still inline JSX, no `notFound()` |
| 3.6 | `today()` UTC vs local timezone | **VERIFIED OPEN** — `BookingFlow.tsx:43`, `CarViewingForm.tsx:27` both use `toISOString().split("T")[0]` |
| 3.7 | Slot-conflict returns 429 not 409 | **VERIFIED OPEN** — viewing/route.ts:177-185 + service/route.ts:139-146 |
| 3.8 | "Brands We Carry" links route to `/BrowseFleet/${make}` (the car-detail dynamic) → 404 | **VERIFIED OPEN** — `AboutUs/page.tsx:527` |
| 3.9 | `/Recoveries` says "London" 6 times | **VERIFIED OPEN** — `Recoveries/page.tsx:31, 36, 128, 137, 156, 239` |
| 3.10 | "Reserve Part" → `/contact?partId=…` but contact reads nothing | **VERIFIED OPEN** — `contact/page.tsx` doesn't reference `searchParams` anywhere |
| 3.11 | Hard-coded "Open now · 7pm · 7 days a week" | **VERIFIED OPEN** — `CarDetailView.tsx:582` |
| 3.13 | "Track booking" link omits `email` | **VERIFIED OPEN** + new sub-bug at confirmation page (see §5.6 below) |
| 3.15 | `password.min(8)` accepts "12345678" | **VERIFIED OPEN** — `register/route.ts:40-43` |

### 1c. Performance (§4)

| # | Prior item | Status |
|---|---|---|
| 4.1 | 66 files import `motion/react` (no `LazyMotion`) | **VERIFIED OPEN** — actually 68 files; zero `LazyMotion` imports anywhere |
| 4.2 | Duplicate `BusinessInfoContext` client fetch | **VERIFIED OPEN** — `BusinessInfoContext.tsx:34, 47-49` |
| 4.3 | `generateMetadata` re-fetches the car | **VERIFIED OPEN** — `BrowseFleet/[_id]/page.tsx:131` & `:166` both call `getCar(_id)`; no `React.cache` |
| 4.4 | Missing `sizes` on `<Image fill>` | **VERIFIED OPEN** — `HeroSection.tsx:91-97`, `Car/Cars.tsx:109-115`, `Car/CarCard.tsx:75-80`, `Car/CarTable.tsx:94-99`, `Shared/VehicleDetails.tsx:41` |
| 4.5 | `optimizePackageImports` not configured | **VERIFIED OPEN** — `next.config.ts` has no `experimental` block |
| 4.6 | `CookieBanner` not lazy | **VERIFIED OPEN** — `(main)/layout.tsx:49` static-imports it, pulling motion into shared chunk |
| 4.7 | `priority` on admin carousel | **VERIFIED OPEN** — `Car/Cars.tsx:114` |
| 4.8 | `{brand, category}` compound on `carParts` | **VERIFIED OPEN** — `src/lib/models/index.ts:336-341` only has single-field indexes |
| 4.9 | `force-dynamic` on `(main)/layout.tsx` | **FIXED** (PR #49) |
| 4.10 | `getBusinessInfo` uses `Promise.all` | **FIXED** |

### 1d. Operational (§7)

- **CI workflow:** still none. `.github/workflows/` contains only `auto-approve-deps.yml` and `dependency-update.yml`. **VERIFIED OPEN.**
- **`RUNBOOK.md` ownership table:** still entirely placeholders (lines 8-21). **VERIFIED OPEN.**
- **Sentry:** still not in `package.json`; `SENTRY_DSN` optional. **VERIFIED OPEN.**
- **Stale branches on origin:** ~30 unmerged. **VERIFIED OPEN.** (`git branch -a | wc -l` returns 50+ entries; ~30 are unmerged feature branches.)

**Net:** the previous report is broadly accurate. One finding (2b.2 SESSION_SECRET) is already fixed in `env.ts`; everything else listed as OPEN is genuinely OPEN.

---

## 2. NEW security findings (not in prior reports)

| Sev | File:line | Issue | Fix sketch |
|---|---|---|---|
| **🔥 CRITICAL** | `src/app/api/carparts/route.ts:124-127` | Public unauthenticated GET silently *writes* a hardcoded `seedCarParts` list (8 mock BMW/Honda/Toyota/etc. parts) into the prod Mongo collection when count is zero. No auth, no role check, no idempotency token. Curl-able by anyone. If staff ever empty the collection to re-import, the next page-load reseeds the fake data. | Remove the seed block. Move it to `scripts/seed-carparts.ts` and call manually. |
| **🔥 CRITICAL** | `src/app/api/admin/carparts/route.ts:107-123` (PUT) | `const { _id, ...updateData } = body; await coll.updateOne({_id}, {$set: {...updateData, updatedAt}})`. **No zod, no `$`-prefix strip.** Attacker (any authenticated session that satisfies `isAuthenticated()` — i.e. `staff+`) sends `{_id, name: "X", price: {$inc: 9999}, $rename: {price: "name"}}` — Mongo's update parser treats nested operator-shaped values as ordinary values *inside `$set`*, so `price` becomes a literal `{$inc:…}` object → app-side reads crash. But the *real* exploit is field-spraying: any field not on the legitimate schema lands in the document and persists. | `carPartSchema.partial().strict().safeParse(updateData)`. Reject keys starting with `$`. |
| **🔥 CRITICAL** | `src/app/api/admin/bookings/route.ts:80-91` (PUT) | Same shape — `body.bookingId`, `body.status`, `body.type` consumed and `status` is allow-listed but `type` is `validTypes.includes(type)`. Combined with §1a 2b.3 (`isAuthenticated` only, not `hasMinimumRole("manager")`), **any staff session can mark any booking `completed`**, triggering the review-invite cron path to email arbitrary customers from your domain. Reputation hit. | `hasMinimumRole("manager")` + zod. |
| **HIGH** | `src/app/api/admin/upload/route.ts:103-105` | `sanitizeFileName` strips `..` and slashes but doesn't lowercase, normalize unicode, or cap length. **No rate limit on the upload-URL signing endpoint.** A stolen staff session can mint thousands of presigned PUTs (5 min validity, 10 MB each) → arbitrary S3 storage cost. | Cap to 80 chars + lowercase + NFKD; add `createRateLimiter("adminUploadSign", {maxRequests: 60, windowMs: 60_000})`. |
| **HIGH** | All 9 auth/account rate-limit sites (`auth/forgot-password`, `auth/reset-password`, `auth/register`, `auth/verify-email`, `admin/login`, `admin/2fa/verify`, `admin/2fa/disable`, `admin/users/password`, `admin/users/reset-password`, `account/password`, `bookings/lookup`) | Every limiter keys on `request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()` — **client-controlled** first hop. Attacker rotates header (`X-Forwarded-For: 1.1.1.<n>`) and burns every limiter unlimited. The booking routes (`bookings/service`, `bookings/viewing`, `bookings/quote`) correctly use `ipAddress(request)` from `@vercel/functions`; auth routes do not. | Replace every `x-forwarded-for` read with `ipAddress(request)`. |
| **HIGH** | `src/lib/utils/rateLimit.ts:155-165` (kvLimiter `check` catch) | On any KV outage / network blip the limiter **fails open** (`return {allowed: true}`). Combined with the spoofable-IP issue above, one Upstash blip removes every limiter site-wide. Login brute-force in particular: KV down for 30 s → 5/15 min cap gone. | Fail closed for `login`, `admin-2fa-*`, `password-action` limiters; allow open only for non-security limiters. Or back with in-memory fallback. |
| **HIGH** | `src/app/api/admin/bookings/cancel/route.ts:30` | `isAuthenticated()` only — **no audit log call** (compare `admin/bookings/route.ts:158-164` which audits status changes). Staff can mass-cancel every booking and only the booking row's `cancelledAt` records it. | `recordAudit({actor, action: "booking.cancel", …})` + `hasMinimumRole("manager")`. |
| **HIGH** | `src/app/api/account/route.ts:24-45` (DELETE — GDPR) | (1) No rate limit. (2) No re-auth / password confirmation. (3) **Bookings are not anonymised** per GDPR Right to Erasure (Art. 17) — bookings keyed by `customerInfo.email` survive, retaining PII without lawful basis. (4) Leaves `sessions` rows orphaned. 0% test coverage (per prior report). | 3/hour limiter + require recent re-auth or password; UPDATE bookings `customerInfo.{email,name,phone}` → tombstones; delete `sessions` too. |
| **HIGH** | `src/app/api/admin/users/reset-password/route.ts:35` | Per-IP rate limit on `x-forwarded-for` only. Attacker with a captured token rotates XFF to burn the 3/15-min cap, then brute-forces the 64-hex token space against the 1-hour expiry. Combine with the KV fail-open and this becomes brute-forceable. | `ipAddress(request)`; add per-token limiter `rl:reset-token:<token-prefix>`. |
| **HIGH** | `src/app/api/account/bookings/route.ts:53-58` | Case-insensitive `$regex` on `customerInfo.email` across 3 collections per dashboard load. No `customerEmailLc` field/index → COLLSCAN × 3. **DoS amplification via the authenticated account dashboard.** | Store `customerEmailLc` on each booking write, exact-match it; or `collation: {locale: "en", strength: 2}` with index. |
| **MED** | `src/auth.ts:128-156` (NextAuth Credentials `authorize`) | **No constant-time dummy verify** for unknown emails — returns `null` immediately. Response-time oracle = account enumeration. `admin/login/route.ts:95` does this correctly with `DUMMY_PASSWORD_HASH`; mirror here. | `const hash = user?.password ?? DUMMY_PASSWORD_HASH; await verifyPassword(password, hash);` then check `user && valid`. |
| **MED** | `src/app/api/admin/bookings/route.ts:33-52` | `find({}).limit(200)` returns **entire booking docs** including `customerInfo.{email, phone}`, `cancellationReason`, `notes` — no projection. Pair with §1a 2b.3 staff role gap → staff exfiltrates the entire customer PII set in one request. | Add projection; restrict full PII to `manager+`. |
| **MED** | `src/app/api/auth/verify-email/route.ts:37` | `findOne({verifyToken: hashVerifyToken(token), …})` on every well-formed token — **no IP rate limit**. Token space is 256 bits so brute force is impractical, but unbounded scraper QPS is. | Add a `verifyTokenLookup` limiter. |
| **MED** | `src/app/api/admin/upload/delete/route.ts:31-45` | Path-traversal check `key.includes("..")` doesn't catch double-encoded (`%252e%252e`) or unicode-equivalent dot characters. Mitigated by `key.startsWith("cars/")` allow-list. Still: combined with no rate limit, staff can mass-delete prod images. | `hasMinimumRole("manager")` + rate limit + regex key validation. |
| **MED** | `src/proxy.ts:71-94` (CSRF bypass on cron) | `isCronRoute = pathname.startsWith("/api/cron/")` skips the same-origin CSRF check for **every method** on cron paths. If any cron route ever grows a new verb without auth, it ships CSRF-exempt by default. | `if (isCronRoute && request.method === "GET") {/* allow */}` — narrow to GET. |
| **MED** | `src/app/api/auth/forgot-password/route.ts:71-86` | Generic-success response is correct, but the limiter is per-IP only — attacker can issue 3 reset emails to one inbox per IP, scaling to email-bomb the target by rotating IPs. | Add per-recipient `recipientLimiter.check(email.toLowerCase())` mirroring the magicLinkLimiter pattern in `src/auth.ts:54`. |
| **MED** | `src/app/api/admin/users/route.ts:104-117` | Username/email existence check returns differentiated errors (`"…that username already exists"` vs `"…that email already exists"`). **Admin user enumeration** by anyone with `manager+`. | Single generic 409. |
| **LOW** | `src/lib/utils/auth.ts:42-47` | Session cookie `maxAge: 24h` with no rolling renewal, no idle timeout. Loss of laptop = 24h of admin access. | `rolling: true`, or 8h + renew on every authed request. |
| **LOW** | `src/app/api/csp-report/route.ts` | No body-size cap before `request.text()` — Node buffers up to Vercel's ~4.5 MB body limit per request, multiplied by no rate limit. Wastes ingress + log lines. | Early `content-length > 65536 → 413`. |
| **LOW** | `src/app/api/admin/cars/route.ts:191` (PUT) | `_id` taken from `body._id` not URL — combined with §1a 2b.3 staff role gap, staff editing arbitrary cars is unaudited at the row level. zod is `.partial()` not `.strict()` so silent extra keys pass through. | `.strict()`; move `_id` to URL. |

### Notable defenses that ARE correct (don't break them)

- `admin/login/route.ts:95` uses dummy bcrypt hash for constant-time path ✓
- `bookings/cancel/route.ts:118-128` uses CAS to prevent double-email ✓
- `cron/review-invites/route.ts:51-54` claims atomically before send ✓
- `s3.ts:65-70` signs `ContentLength` — leak-resistant presigned URLs ✓
- `env.ts:101-127` hard-throws in prod on missing `SESSION_SECRET`, `AUTH_SECRET`, `EMAIL_FROM` default, `CRON_SECRET` ✓
- `bookings/{service,viewing,quote}/route.ts` correctly use `ipAddress(request)` from `@vercel/functions` ✓

---

## 3. NEW performance findings

| Sev | File:line | Issue | Impact | Fix sketch |
|---|---|---|---|---|
| **HIGH** | `src/components/Header.tsx:270-277` | `priority` set on the 100×100 logo on every page — logo is never LCP, browser de-prioritises real LCP image | +50-150 ms LCP on slow 3G | Drop `priority`; eager-load is default |
| **HIGH** | `src/app/(main)/CarParts/page.tsx:29` | Server page does unbounded `find({}).toArray()` — same DoS surface as `/api/carparts` | TTFB linear in catalog size | `.find({inStock:true}).limit(60).project({…})` |
| **HIGH** | `src/app/api/admin/carparts/route.ts:28-31` | Unbounded `find({}).sort({createdAt:-1})` — not in prior report's list of four | Linear admin scan | `.limit(100)` + paginate; create `{createdAt:-1}` index |
| **HIGH** | `src/app/api/admin/bookings/route.ts:39-49` | Service + viewing collections sorted by `createdAt:-1` when filter is `{}` — no compound index | COLLSCAN + SORT per call | Add `{createdAt:-1}` index on both collections |
| **HIGH** | `src/app/(main)/BrowseFleet/page.tsx:49-73` | `getFacets()` does a full available-cars projection scan + JS dedup on every request, in parallel with the paginated query | Doubles cars-collection read cost per BrowseFleet hit | `distinct("make"|"colour"|"doors"|"features")` + `unstable_cache` (revalidate=300) |
| **MED** | `src/app/api/bookings/lookup/route.ts:75-80` | Two sequential `findOne` calls instead of `Promise.all` | +1 RTT per lookup | `await Promise.all([…])` |
| **MED** | `src/app/api/admin/quotes/route.ts:51-60` + `dashboard/quotes/page.tsx:30-36` | Filter on `status` + sort by `createdAt:-1`, but `quotes` only has `{status:1}` and `{quoteReference:1}` — no compound | In-memory SORT after IXSCAN | Add `{status:1, createdAt:-1}` to `getQuotesCollection` |
| **MED** | `src/contexts/BusinessInfoContext.tsx:47-49` + `src/components/Footer.tsx:30-32` | Footer hard-depends on the *client-fetched* context — returns `null` until it resolves. Data is already in server render via `getBusinessInfo` | Footer paints late; CLS risk; duplicate `/api/businessinfo` round-trip from every page | Make Footer a server component; pass `businessInfo` via a server-seeded context |
| **MED** | `src/lib/utils/businessInfo.ts:294` | Not wrapped in `React.cache()` — invoked 2× per home render | -50-150 ms TTFB | `export const getBusinessInfo = cache(async () => {…})` |
| **MED** | `src/app/(main)/BrowseFleet/[_id]/page.tsx:131,166` | `getCar` called in metadata + body without dedup | One extra `findOne` per detail page render | `React.cache` wrap |
| **MED** | `src/components/Footer.tsx:4` + `src/components/Shared/CookieBanner.tsx:5` | Static-import `motion/react` in two layout-level files → motion enters shared chunk on every page | ~25 KB gz on every route | Lazy import via `next/dynamic({ ssr:false })` for CookieBanner; convert Footer micro-animations to CSS |
| **MED** | `next.config.ts` | Missing `experimental.optimizePackageImports: ["lucide-react","motion","recharts","@react-email/components"]`; no `images.formats:["image/avif","image/webp"]`; no `images.minimumCacheTTL`; no explicit `compress: true` | -5-15% shared chunk + larger images | Add the block |
| **LOW** | `src/app/(main)/{saved,login,register,forgot-password,reset-password}/page.tsx` | `force-dynamic` on pages that read **no** server data | Static optimization restored | Delete the line |
| **LOW** | `src/app/(admin)/layout.tsx:22` + `(admin)/admin/dashboard/layout.tsx:13` | `force-dynamic` declared twice (parent + child) | Cosmetic | Drop the parent's |
| **LOW** | `src/components/Header.tsx:21-46` | `"use client"` + 13 lucide icons + motion at module scope on every customer page | ~5-10 KB gz | Dynamic-import mobile overlay subtree |

---

## 4. NEW UX / CTA / accessibility findings

### 4a. Customer-flow bugs (Sev-1 / P0)

| Sev | File:line | Issue | Fix |
|---|---|---|---|
| **P0** | `src/components/HeroSection.tsx:25` + `src/components/WhatsAppButtonClient.tsx:72` | Both have `z-50`. On any page with the hero, the decorative gradient blobs render OVER the floating WhatsApp CTA on scroll — most visible on home, also on `/Recoveries`, `/AccidentClaims`. | Drop hero's `z-50`; reserve `z-50+` for fixed elements |
| **P0** | `src/components/Header.tsx:332-342` | Header "Book a Viewing" CTA is `hidden sm:inline-flex` — **invisible on viewports <640px**. The most-clicked CTA on the site doesn't exist on the most common viewport. Header is otherwise z-60 sticky. | Show at all breakpoints; collapse to icon-only "Book" under 640px if space tight |
| **P0** | `src/components/CarViewing.tsx:18` (related to prior §3.2) | "Loading..." renders on every first paint before `useEffect` flips `isClient`. Combined with the broken ViewingContext, returning to `/Booking/[_id]` flashes "Loading…" → "No Car Selected" — two-step empty state. | Folded into the §3.2 server-component fix |
| **P1** | `src/components/Booking/Flow/BookingFlow.tsx:1029` | "Track booking" uses `<a href>` not `<Link>` → full reload; loses any saved state. Also omits `email=` query (compounds prior §3.13). | `<Link>` + `&email=…` |
| **P1** | `src/app/(main)/Booking/confirmation/page.tsx:131-137` | "View Booking Details" → `/Booking/lookup?ref=…` with no `email` — but the lookup form *requires* email before searching. User must retype the email they just received the confirmation at. | Append `&email=${encodeURIComponent(email)}` |
| **P1** | `src/components/Main/Form/CarViewingForm.tsx:331-336` | After viewing confirmation, hardcoded `setTimeout(…, 2000)` then `router.replace`. If user navigates away in the window, the redirect still fires → unexpected URL change. | Cleanup effect or redirect immediately |
| **P1** | `src/app/(main)/Booking/lookup/page.tsx:147-153, 217-226` | `onKeyPress` handler only on email input; the ref input pressing Enter does nothing. No form wrapper. Also missing `inputMode="email"` / `autoComplete="email"`. | Wrap in `<form onSubmit={handleSearch}>` and replace `onKeyPress` with form submit |
| **P2** | `src/components/Booking/Flow/BookingFlow.tsx:67` vs `src/components/Main/Form/CarViewingForm.tsx:39-49` | Service booking ends at 17:00; viewing offers 17:00 + 18:00. Inconsistent windows. | Unify the slot list (see also prior §3.1 fix) |

### 4b. CTA placement & routing (P1)

| File:line | Issue | Fix |
|---|---|---|
| `src/components/Footer.tsx:111-194` | Footer has no primary CTA — only plain text links. Bottom-of-page conversion missed | Add CTA card row above the column grid |
| `src/app/(main)/BrowseFleet/page.tsx:120-135` | Hero has 3 badge chips but no CTA button | Add "Book a viewing on any car" link |
| `src/app/(main)/Recoveries/page.tsx:128-145` | 24/7 emergency service but "Call Now" is buried below the fold | Move tel: into hero buttons row |
| `src/app/(main)/Services/page.tsx:107` | "Learn More & Book" routes to `/Services/Detailing` with no anchor — user lands on top of page, must scroll to find Book | Anchor to `#book` (already defined at L75) |
| `src/app/(main)/Services/page.tsx:219-225` | "Start booking" routes to `/Book` without `?service=` — `BookingFlow.tsx:193-199` reads that param to prefill Step 1, would skip an entire step | `href="/Book?service=detailing"` etc. |
| `src/app/(main)/AccidentClaims/page.tsx:191-195` | "Make an Enquiry" → `/contact` with no context (same silent context loss as Reserve Part bug) | `?subject=Accident%20Claim` + read on contact page |
| `src/components/Header.tsx:874-887` | Mobile menu's sticky bottom "Book a Viewing" *also* routes to `/Book` — prior report missed this third occurrence | Same fix as prior §3.4 — sweep ALL `href="/Book"` with "Book a Viewing" label |
| `src/components/Header.tsx:466-475` | "Need help signing in?" routes to `/contact` — there's no sign-in help there. Forgot-password lives at `/forgot-password` | Route to `/forgot-password` |
| `src/app/(main)/Booking/confirmation/page.tsx:26-43` | "Invalid Confirmation Link" CTA → `/BrowseFleet`. User with malformed ref needs to *find* their booking | Add "Look up your booking" → `/Booking/lookup` as primary CTA |
| `src/app/(main)/Booking/confirmation/page.tsx:139-145` | "Browse More Cars" styled equal weight to red primary — competing CTAs | Outline/ghost styling for secondary |

### 4c. Mobile & responsive (P1)

| File:line | Issue | Fix |
|---|---|---|
| `src/components/Car/SavedCarsPage.tsx:96-106` | "Clear all" text link on top right — wraps awkwardly on 360px and below 44px touch target | `min-h-[44px] inline-flex px-3` |
| `src/components/CarParts/CarPartsGrid.tsx:186-188` | "Reserve Part" `<Button size="sm">` ≈ 32-36px height — fails 44px AA touch target | Default size on mobile |
| `src/components/Booking/Flow/BookingFlow.tsx:791-800` | Step 3+ "Continue" not sticky (only sticky on steps 1-2). On mobile user must scroll past InfoBanner to find it | Sticky `ContinueBar` on all steps |
| `src/components/Header.tsx:319-329` | Mobile search trigger `h-10 w-10` = 40px — just below 44px AA | `h-11 w-11` |
| `src/components/Car/CarDetailView.tsx:802-827` | Mobile sticky CTA bar at `z-40` but page has no scroll-margin compensation — anchor links under the bar are obscured | `scroll-pb-24` or per-anchor `scroll-margin-bottom` |
| `src/components/CarParts/CarPartsGrid.tsx:122-128` | `<Image width={300} height={192}>` with stretched `h-full w-full object-cover` — fixed intrinsic vs stretched display, jank | Use `fill` + `sizes` like other cards |

### 4d. Accessibility (P1)

| File:line | Issue | Fix |
|---|---|---|
| `src/components/Helpful/FAQAccordion.tsx:37-66` | Accordion has `aria-expanded` but no `aria-controls`; panel has no `id` / `role="region"` | Wire `aria-controls={panelId}` + matching panel id |
| `src/components/Header.tsx:919` | `DropdownPanel` has `role="menu"` but children aren't `role="menuitem"` — incorrect ARIA, screen readers announce "menu" then can't navigate | Add `role="menuitem"` to children, or drop role |
| `src/app/(main)/BrowseFleet/[_id]/page.tsx:174` | "Not found" state uses 🚗 emoji as icon with no `aria-label` — platform-dependent SR announcement | Use lucide icon with `aria-hidden` |
| `src/app/(main)/Booking/confirmation/page.tsx:50-54` | Success only conveyed via green icon container + heading; no `role="status"` region announcing the booking ref | Add `role="status" aria-live="polite"` on the ref card |
| `src/components/Car/CarDetailView.tsx:619-695` | "Closes 7pm · 7 days a week" qualifier is `text-xs` gray on dark — borderline AA contrast | Bump to `text-gray-300` |
| `src/app/not-found.tsx:8` | `<h1>404</h1>` — single number is bad SR semantics ("four hundred and four") | H1 = "Page not found", 404 graphic `aria-hidden` |
| `src/components/Footer.tsx:67-95` | Address / phone / email lines use no `aria-label`s or `<address>` element — fine for sighted, poor for skim listeners | Add `<address>` + visually-hidden labels |
| `src/app/(main)/Booking/lookup/page.tsx:222` | `onKeyPress` is deprecated; only fires for email input | Already covered above; form wrapper fixes both |

### 4e. SEO

| Sev | File:line | Issue | Fix |
|---|---|---|---|
| P1 | `src/app/(main)/Booking/[_id]/page.tsx:8-11` | Sets `robots: {index: false, follow: false}` — fine — but `/Booking/[_id]` slugs still leak via referrer headers into Google Search Console as crawlable noindex URLs | Add `Disallow: /Booking/` to `robots.ts` |
| P1 | `src/app/(main)/saved/page.tsx:11` | `robots: {index: false, follow: true}` — wastes crawl budget on a user-private page | `follow: false` |
| P1 | `src/app/(main)/{login,register,forgot-password,reset-password,account}/page.tsx` | None set `alternates.canonical` despite being noindexed | Add canonical |
| P1 | `src/app/sitemap.ts:8-93` | Omits two indexable customer pages: `/Booking/lookup` and `/review` | Add both |
| P1 | `src/app/(main)/FAQ/page.tsx:55-211` | All FAQ content hardcoded but no `FAQPage` JSON-LD emitted — highest-volume Q&A page gets zero rich-result treatment | Emit `JsonLd` with `@type: FAQPage` |
| P1 | `src/app/(main)/AccidentClaims/page.tsx` | No `Service`/`LegalService` schema markup unlike Services/Recoveries/Detailing | Add `JsonLd` with `@type: Service` |
| P1 | `src/app/(main)/contact/page.tsx:26-37` | Highest-intent local-SEO page has no `LocalBusiness` schema | Emit `LocalBusiness` with NAP + hours |
| P2 | `src/app/(main)/BrowseFleet/page.tsx:20` | Canonical hard-coded to `/BrowseFleet` regardless of filters — `?make=BMW` etc. inherit and consolidate signals | Either keep current (deliberate) or emit per-facet canonicals for whitelisted facets |

### 4f. Trust & credibility (P1)

| File:line | Issue | Fix |
|---|---|---|
| `src/components/HeroSection.tsx:60-62` | Stats card values (`stats?.vehicles?.value`) render `undefined` for a few hundred ms during cold load — visible "undefined Vehicles" flash | Provide defaults or skeleton |
| `src/app/(main)/AboutUs/page.tsx:493` (prior) + Footer / About | No reviews/testimonials surfaced anywhere despite the "Our customers love us" copy | Wire to a reviews data source or remove the copy |
| `src/components/Car/CarDetailView.tsx:53-58` | Trust band ("AA pre-sale inspection", "HPI clear", "6-month warranty") is plain text with no AA logo, no HPI badge link, no warranty terms link | Link each to evidence |
| `src/components/Home/WhyChooseHome.tsx:33` | Stock count "120+" hardcoded — lies if actual stock is 18 | Drive from `getBusinessInfo` or live count |

---

## 5. Code-debt observations (delta from prior report)

The prior report's §1 covers code debt well. Adding:

- **Public seed code in `/api/carparts/route.ts:11-117`** — the entire 107-line `seedCarParts` array is dead-code-with-side-effects in prod. Move to `scripts/`.
- **3 `'use client'` pages that don't need it** — `(main)/forgot-password/page.tsx`, `(main)/reset-password/page.tsx`, `(main)/saved/page.tsx` declare `force-dynamic` but don't read server data. They could be static + client subcomponents.
- **Production `console.log` regressions** — `src/emails/send.ts:64,80,104,107`, `src/lib/utils/auth.ts:24`, `src/lib/utils/reviewInvite.ts:175`, `src/lib/env.ts:86,87,141,142`, `src/lib/mongodb.ts:41`. The first set leak SMTP user, email subjects, message IDs, and preview URLs to stdout in prod. Route via `observability.ts` `logInfo`/`logError`.
- **`type` import vs runtime import mismatch** in `src/components/Booking/Flow/BookingFlow.tsx:18` — `type LucideIcon` is fine; many other files conflate runtime + type imports (minor bundle hygiene).
- **Auto-seed Mongo indexes from getter functions** — `src/lib/models/index.ts:280-313` (already there) runs `createIndexes` inside `getAdminUsersCollection()`. The pattern is repeated for every collection getter; each getter is called per request after cold start. The current code has a guard (`adminUsersCollection` cached), but `reconcileAdminEmailIndex` was added on the working branch as a one-shot fix — once it's done, **remove it before handover** (it does a listIndexes/dropIndex on every cold start of the lambda).
- **One `.jsx` file in a TS codebase** — `src/components/Helpful/Buttons/LinkPrimaryButton.jsx`. Migrate or delete (still 0% coverage per prior report).

---

## 6. Handover operational gaps

The prior report's §7 is thorough. To make it actionable, here is what to physically do this weekend, in order:

### 6a. RUNBOOK ownership table (30 min)

Open `RUNBOOK.md` lines 8-21. Each row currently says `_(fill in)_`. You must fill in:

1. **Domain registrar** + login URL + renewal date + payment method
2. **Vercel** org slug + billing owner email + plan tier
3. **MongoDB Atlas** org URL + cluster name + billing owner
4. **AWS account ID** + IAM admin user/role + billing alert email
5. **Cloudflare** account + Turnstile site keys location
6. **Sentry** org + project URL (or "NOT YET SET UP")
7. **SMTP provider** — currently the doc is ambiguous between Resend and SES. `src/lib/env.ts:38-44` references `SMTP_HOST/PORT/USER/PASS/EMAIL_FROM` — generic SMTP, no Resend SDK. Check `.env.local` and document the actual provider.

Without this, the new owner literally cannot pay the bills or rotate keys.

### 6b. CI workflow (1 hr)

Create `.github/workflows/ci.yml` per the snippet in the prior report's §7b. Make it required for merge via branch protection. Currently the ONLY gate between a broken PR and prod is `next build` on Vercel — any test failure that doesn't break the build will ship.

### 6c. Sentry wiring (30 min)

`@sentry/nextjs` is **not in `package.json`** (verified). `SENTRY_DSN` is optional in `env.ts`. Follow `SETUP.md:307-348`. Without it, Sunday outages go unnoticed until Monday.

### 6d. Uptime monitor (10 min)

Free tier UptimeRobot or BetterStack pointing at `/api/admin/session` (cheap GET, returns 200/401). Add the URL + ack/escalation contact to RUNBOOK.

### 6e. Branch cleanup (1-2 hrs)

```bash
git branch -r | grep -v 'main\|HEAD' | xargs -I {} git log {} --pretty=format:"%H %s" --max-count=1 | sort > BRANCHES_AUDIT.txt
```

For each origin/ branch: merge, close, or note in a new `HANDOVER_BRANCHES.md` why it's parked. Don't hand someone a graveyard of 30 unknown-status branches.

### 6f. `.env.example` vs `SETUP.md` consistency (15 min)

`SETUP.md` lines 30-62 references `RESEND_API_KEY` and `NEXT_BUSINESS_*` vars that don't exist in `.env.example` or get read in `src/`. Stale docs mislead new devs into setting variables that do nothing. Reconcile.

### 6g. `DATA.md` (30 min)

UK dealership = GDPR / UK GDPR. Write a one-page document covering: what PII is stored (customers, bookings, admin users, audit log) · retention (currently indefinite) · DSAR process (how to honour an erasure request given the API gap at `account/route.ts:24-45`) · breach contact · cookie banner status.

### 6h. Test the `setup-admin` flow end-to-end (15 min)

`npm run setup-admin` is referenced in `package.json` and `SETUP.md`. Verify it still works against your prod Atlas cluster with current env vars before the new owner needs it for their first account creation.

---

## 7. Weekend action plan — prioritized for ~10-12 hours

### Saturday morning (0-3 hrs) — security & critical bugs

1. **🔥 Remove `/api/carparts` GET seed write** — `src/app/api/carparts/route.ts:124-127` → 5 min
2. **🔥 zod + `.strict()` on admin/carparts PUT and admin/bookings PUT** — 30 min
3. **🔥 Sweep `x-forwarded-for` → `ipAddress(request)` across 10 auth routes** — 20 min
4. **🔥 KV limiter fail-closed for security limiters** — 15 min
5. **CRON_SECRET constant-time compare** — 5 min (prior §2.4)
6. **Half-hour booking slots fix** — 2 min (prior §3.1) — copy this into `src/lib/utils/booking-form.ts` shared constant + import in form + validator
7. **NextAuth Credentials timing oracle** — 5 min
8. **Header CTA visible on mobile + routes to `/BrowseFleet`** — 5 min (prior §3.4 + new §4a)
9. **Hero z-50 fix** — 1 min
10. **`/Recoveries` "London" → "Leeds"** — 5 min (6 occurrences via sed)
11. **Footer admin-link removal** — 1 min
12. **Account-enumeration on register** — 20 min

### Saturday afternoon (3-6 hrs) — booking flow + handover ops

13. **`/Booking/[_id]` server-fetch the car** — make the page a server component, pass to `<CarViewing initialCar={car} />` (prior §3.2) — 1 hr
14. **Saved cars `?ids=` public endpoint + rewire SavedCarsPage** — 30 min (prior §3.3)
15. **Confirmation page `&email=` query params on lookup/track links** — 5 min (new §4a)
16. **AccidentClaims + Services + CarParts → contact context (subject/partId)** — read on contact page — 30 min (prior §3.10 + new §4b)
17. **Brand chips on AboutUs use `?make=` query** — 5 min (prior §3.8)
18. **RUNBOOK ownership table fill-in** — 30 min
19. **CI workflow + branch protection** — 1 hr
20. **Sentry wiring** — 30 min
21. **UptimeRobot pointed at `/api/admin/session`** — 10 min
22. **Branch graveyard cleanup or document** — 1 hr

### Saturday evening (6-9 hrs) — performance + UX polish

23. **Bound unbounded admin scans + `/api/carparts` + `/CarParts` server page** — 30 min
24. **`React.cache` wrap `getCar`, `getBusinessInfo`** — 10 min
25. **`next.config.ts` perf flags (`optimizePackageImports`, image formats)** — 5 min
26. **Drop `priority` from Header logo + admin carousel; add `sizes` to 5 `<Image fill>` sites** — 15 min
27. **CookieBanner via `next/dynamic({ssr:false})`** — 5 min
28. **Hard-coded "Open now" → drive from businessInfo.hours** — 30 min
29. **`force-dynamic` cleanup on 5 data-less pages** — 5 min
30. **FAQ + AccidentClaims + Contact JSON-LD** — 20 min
31. **Sticky ContinueBar on all booking steps** — 30 min

### Sunday (3 hrs buffer for the unforeseen)

32. Role-gate the 10 admin write routes with `hasMinimumRole("manager")` (prior §2.4)
33. TOTP secret encryption (1 hr — needs `TOTP_ENC_KEY` env + migration of existing rows)
34. `__Host-` cookie prefix rename
35. `DATA.md` (GDPR) + reconcile `SETUP.md` with `.env.example`
36. Final smoke test of all 8 customer flows in prod (you'll need a real browser for this)

### Backlog (don't try this weekend)

- Code-debt refactors from prior report §1b (BookingFlow.tsx, BusinessInfoForm.tsx, Header.tsx splits) — these are 4-6 hrs each and not safe in a handover window
- `LazyMotion` migration across 68 files
- Cron/scheduled tasks beyond review-invites
- E2E coverage for register/forgot-password/reservation/part-exchange

---

## 8. Quick-reference summary — every NEW finding by sev

**🔥 CRITICAL (3)** — fix this weekend, no exception
1. `/api/carparts` GET auto-seeds prod (`carparts/route.ts:124-127`)
2. Admin carparts PUT mass-assignment (`admin/carparts/route.ts:107`)
3. Admin bookings PUT staff can mark any booking completed → triggers customer emails (`admin/bookings/route.ts:80`)

**HIGH security (7)** — fix this weekend
4. Admin upload no rate limit + unbounded filename (`admin/upload/route.ts:103`)
5. `x-forwarded-for` rate-limit spoofing (9 routes)
6. KV rate-limiter fail-OPEN (`rateLimit.ts:155`)
7. Admin booking-cancel no audit log (`admin/bookings/cancel/route.ts:30`)
8. Account DELETE no rate limit, no re-auth, leaves PII in bookings (`account/route.ts:24`)
9. Admin user reset-password spoofable IP (`admin/users/reset-password/route.ts:35`)
10. Account bookings `$regex` scan × 3 collections (`account/bookings/route.ts:53`)

**HIGH perf (5)** — fix this weekend
11. Header logo `priority` competes with LCP (`Header.tsx:270`)
12. `/CarParts` server page unbounded `find({})` (`CarParts/page.tsx:29`)
13. `/api/admin/carparts` GET unbounded (`admin/carparts/route.ts:28`)
14. Admin bookings sort with no compound index (`admin/bookings/route.ts:39`)
15. `BrowseFleet getFacets()` full scan (`BrowseFleet/page.tsx:49`)

**P0 UX (3)** — fix this weekend
16. Hero z-50 clash with WhatsApp (`HeroSection.tsx:25`)
17. Header CTA invisible <640px (`Header.tsx:332`)
18. CarViewing "Loading…" → "No Car Selected" flash (`CarViewing.tsx:18`)

**P1 UX (~15)** — fix in week 1 post-handover
- See §4a/§4b/§4c/§4d/§4e/§4f tables above for the full list with fix sketches

**MED+ security/perf/a11y (~25)** — work through over the following 2 weeks

---

## 9. Caveats — what I did NOT verify

- **Live customer-flow walkthrough in a real browser.** Sandbox can't keep `next dev` alive between calls and I didn't want to point bash at your prod Atlas. If you want, I can guide you through a 30-min checklist on your machine.
- **Vercel env var contents.** Inferred required set from `src/lib/env.ts`.
- **Whether staging actually exists.** `SETUP.md:351-365` describes it; `.vercel/project.json` only lists prod.
- **Whether the auto-seed bug in `/api/carparts` has ever fired in prod.** Check Mongo's `carParts` collection for documents with `image: "/car.jpg"` and the mock brand list — if any exist, they came from this route.
- **Whether backup-restore drills have ever been run.** No `RESTORE_LOG.md` in the repo.
- **`reconcileAdminEmailIndex` on the working branch** (uncommitted) — once merged + run once, the function should be deleted to stop running listIndexes/dropIndex on every cold start.

---

## 10. Appendix — verification commands you can re-run

```bash
# Verify Header CTA still routes to /Book
grep -n 'href="/Book"' src/components/Header.tsx src/components/Home/WhyChooseHome.tsx

# Verify carparts seed write
grep -n 'insertMany(seedCarParts' src/app/api/carparts/route.ts

# Verify admin PUT mass-assignment
grep -n 'updateData' src/app/api/admin/carparts/route.ts src/app/api/admin/bookings/route.ts

# Verify x-forwarded-for usage
grep -rn 'x-forwarded-for' src/app/api/

# Verify KV limiter fail-open
sed -n '150,170p' src/lib/utils/rateLimit.ts

# Verify role gating gaps
grep -rln 'await isAuthenticated' src/app/api/admin/ | xargs -I {} grep -L 'hasMinimumRole' {}

# Verify Recoveries London
grep -n 'London' src/app/\(main\)/Recoveries/page.tsx

# Verify hero z-50 clash
grep -n 'z-50' src/components/HeroSection.tsx src/components/WhatsAppButtonClient.tsx

# Verify Sentry not installed
grep -n '"@sentry/nextjs"' package.json || echo "Sentry NOT in package.json — confirmed"

# Verify CI workflow gap
ls .github/workflows/
```

---

*Generated 2026-05-20 against `main @ 9e83e38`. Working tree was on `fix/e2e-regressions` with three unrelated dashboard/index edits that don't affect any finding above. If you ship any of the fixes, re-verify before opening the PR — the codebase is well past the size where mental cache of "what's at L107" is reliable.*

*Companion reading: `HANDOVER_REVIEW_2026-05-20.md` (the prior 41 KB report) — that file's P0 list + this file's §2-§4 NEW findings together are your complete pre-handover punch list.*
