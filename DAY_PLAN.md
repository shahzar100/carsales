# DAY_PLAN — Morley Motor Company Remediation

**Source:** `WEBSITE_REVIEW.md` (2026-05-12). All 62 findings are addressed below.
**Goal:** ship every fix in order, on its own branch, so each Day merges to `main` independently with green CI.
**Branch convention:** `day-N-short-description`. One PR per Day. Don't start Day N+1 until Day N is on `main`.

## How to use this plan

Each Day has:
* a **Branch** name,
* a **Goal** one-liner,
* numbered fixes that map back to findings #1–#62 in the review,
* a per-fix block with **Files**, **Change**, **Why it doesn't break anything else**, **Test**,
* a **Validation** checklist to run before merging.

`Why it doesn't break anything else` is the most important field — it's where regressions hide. Read it.

`Test` calls out the minimal test you should add/run. Lint, type-check and `npm test` are baseline expectations on every Day; only extra tests are called out.

---

## Day 1 — Stop the bleeding (P0)

**Branch:** `day-1-critical-build-and-customer-bugs`
**Goal:** make the build pass again, stop sending customers to 404s, stop silently breaking image uploads.
**Findings addressed:** #1 (build), #2 (review email 404), #4 (S3 image hostnames), #6 (Finder duplicates).

### Fix 1.1 — Make `npm run build` pass again (Finding #1)

**Files:**
* `src/components/Services/Common/PackageGridWrapper.tsx` — delete (zero importers, verified via `grep -rn "PackageGridWrapper" src/`).

**Change:** `git rm src/components/Services/Common/PackageGridWrapper.tsx`. It's the only thing that references `@/hooks/useSkeleton`, which was deleted in a previous cleanup pass.

**Why it doesn't break anything else:** The file isn't imported anywhere — there's no `PackageGridWrapper` entry in `src/components/Services/Common/index.ts` and no JSX use of it across `src/`. Removing it returns `tsc --noEmit` to zero errors.

**Test:** `npm run type-check` returns clean; `npm run build` succeeds.

### Fix 1.2 — Stop sending review-email recipients to a 404 (Finding #2)

**Files:**
* New: `src/app/(main)/review/page.tsx` — a server component reading `?ref=…` and rendering a "Leave a Google review" CTA (or your real review host).
* Edit: `src/lib/utils/reviewInvite.ts` — keep `buildReviewUrl` pointing at `/review?ref=…` (the new page will exist).
* No DB changes needed.

**Change:** scaffold a minimal "thanks for booking — please leave a review" page. Verify `ref` matches the `BK-XXXXXX` / `BK-XXXXXX` format from `validateBookingReference` (`src/lib/utils/validation.ts:51`) — if invalid, render a friendly error. Provide one external link (e.g. your Google Business URL pulled from `businessInfo.googleMapsUrl` or a new `businessInfo.reviewUrl` field). Add `robots: { index: false, follow: false }` in `metadata` so review URLs don't enter the index.

**Why it doesn't break anything else:**
* The cron route `src/app/api/cron/review-invites/route.ts` is untouched — same URL, same content type.
* No DB migrations; if you add `reviewUrl` to `ShopInfo`, mark it optional so existing documents still validate.
* `__tests__/links/brokenLinks.test.ts` checks JSX `href`s, not URLs built from utilities, so adding the page can only widen acceptance, not narrow it.

**Test:**
* Snapshot test of the new page rendering both valid and invalid `ref`.
* If you add `reviewUrl` to `ShopInfo` (`src/lib/interfaces.ts`), update the Zod schema in any `/api/admin/shop` validator.

### Fix 1.3 — Allow S3 photos in `next/image` (Finding #4)

**Files:**
* `next.config.ts` — extend `images.remotePatterns`.

**Change:**

```ts
remotePatterns: [
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "**.cloudfront.net" },
  // Explicit S3 fallback for environments without CloudFront.
  // Restricted by hostname pattern + pathname to your bucket only.
  {
    protocol: "https",
    hostname: "*.s3.*.amazonaws.com",
    pathname: "/**",
  },
  // Newer S3 path style (eu-west-2, etc.) — both forms are valid signed-URL hosts.
  {
    protocol: "https",
    hostname: "s3.*.amazonaws.com",
    pathname: "/**",
  },
],
```

**Why it doesn't break anything else:**
* `next/image` already accepts the two existing hostnames. We're adding entries, not changing CSP (`connect-src 'self' https://*.s3.*.amazonaws.com` already permits the same hosts at fetch time, so we're aligning two policies that were already half-aligned).
* Adding `pathname: "/**"` is the safer Next 14+ shape — match anything under the bucket. It can't loosen security beyond what `getPublicUrl` already returns.

**Test:** locally set `CLOUDFRONT_DOMAIN=` (empty), upload a car image via admin, confirm it renders on `/BrowseFleet/[_id]`. Should not produce `Invalid src prop` console errors.

### Fix 1.4 — Delete the eight macOS Finder duplicate files (Finding #6)

**Files to delete:**
* `src/components/UI/Button 2.tsx`
* `src/components/UI/ConfirmDialog 2.tsx`
* `src/components/UI/EmptyState 2.tsx`
* `src/components/UI/StatusBadge 2.tsx`
* `src/hooks/useApi 2.ts`
* `src/hooks/useScrollLock 2.ts`
* `src/lib/utils/format 2.ts`
* `src/lib/utils/apiResponse 2.ts`

**Change:** `git rm` all eight, plus `src/hooks/# Code Citations.md` (stray Copilot artifact, Finding #8).

**Why it doesn't break anything else:**
* Verified via grep: zero callers reference the ` 2.tsx` paths in `src/`. The bundler can't auto-import a file with a space in its name.
* Important caveat: `format 2.ts` has *drifted* — it lacks the BST timezone fix from `format.ts`. Deleting the stale copy removes a latent risk; the canonical `format.ts` is unaffected.

**Test:** `npm run type-check && npm test && npm run build` all clean. Search the repo once more (`rg "from .*' 2'"`) to confirm nothing left.

### Day 1 validation

* [ ] `npm run lint` — 0 errors, ≤ 59 warnings (we deal with warnings on Day 4).
* [ ] `npm run type-check` — clean.
* [ ] `npm test` — all green; coverage didn't drop.
* [ ] `npm run build` — succeeds.
* [ ] Smoke-test locally: home loads, BrowseFleet shows uploaded car images, a fake review URL `/review?ref=BK-ABCDEF` renders the new page.

---

## Day 2 — Security and dead routes (P0/P1)

**Branch:** `day-2-security-and-dead-routes`
**Goal:** finish two half-built features (admin reset-password page, broken brand-shortcut links) and close two real security gaps.
**Findings addressed:** #3 (reset-password page), #5 (Header brand links), #11 (plaintext password), #13 (rate limiter), #16 (lookup enumeration), #17 (JsonLd hardening).

### Fix 2.1 — Ship `/admin/reset-password` (Finding #3)

**Files:**
* New: `src/app/(admin)/admin/reset-password/page.tsx` — Server Component reading `?token=…`, rendering a new-password form.
* New: `src/app/api/admin/users/reset-password/route.ts` — `POST { token, newPassword }`. Validates the token via SHA-256 hash compare against `adminUsers.resetToken`, checks `resetTokenExpiry > now`, then `await hashPassword(newPassword)`, sets it, `$unset` the token fields.
* No change to `src/lib/utils/auth.ts` or `getSession()` — the consumer is unauthenticated by definition.

**Change:** the reset-token plumbing already exists in `POST /api/admin/users/password { action: "reminder" }` (`src/app/api/admin/users/password/route.ts:188-206`): it generates `crypto.randomBytes(32).toString('hex')`, stores the SHA-256 hash, sets a 1-hour `resetTokenExpiry`, emails the plaintext token. We just need to consume it. Validate:
* token length (64 hex chars),
* token exists in some user row (`{ resetToken: sha256(token), resetTokenExpiry: { $gt: new Date() } }`),
* new password ≥ 12 chars, ≤ 200, with at least one upper / lower / digit (Zod schema).

On success, `$unset` both fields and respond `{ success: true }`. Add per-IP rate limit (3 attempts per 15 min) via `createRateLimiter("password-reset-consume", …)`.

**Why it doesn't break anything else:**
* The existing reminder route is untouched. Tokens it has already minted will work once the new page ships.
* It's a brand-new route — no existing test or call site depends on its absence.
* The reset-on-arrival flow doesn't touch the live session cookie (the user isn't logged in), so admin sessions aren't invalidated.

**Test:** API integration test with `mongodb-memory-server` — mint a token, consume it, verify password hash changed, verify token fields cleared, verify expired/invalid tokens 401. Add a Playwright E2E covering "request reminder → consume token → log in with new password" (uses Ethereal email transport).

### Fix 2.2 — Fix Header brand-shortcut dropdown (Finding #5)

**Files:**
* `src/components/Header.tsx` — change four `href` values.

**Change:**

```diff
-<NavLink href="/BrowseFleet/Toyota" text="Toyota" />
-<NavLink href="/BrowseFleet/Honda"  text="Honda" />
-<NavLink href="/BrowseFleet/BMW"    text="BMW" />
-<NavLink href="/BrowseFleet/Audi"   text="Audi" />
+<NavLink href="/BrowseFleet?make=Toyota" text="Toyota" />
+<NavLink href="/BrowseFleet?make=Honda"  text="Honda" />
+<NavLink href="/BrowseFleet?make=BMW"    text="BMW" />
+<NavLink href="/BrowseFleet?make=Audi"   text="Audi" />
```

`parseCarFilters` in `src/lib/utils/buildCarFilter.ts` already reads `make` from the query string, so this lands on the BrowseFleet page with the filter pre-applied.

**Why it doesn't break anything else:**
* These were always broken — they 404 today. Anything that "depends on" them is already broken.
* `__tests__/links/brokenLinks.test.ts` will accept query-string hrefs because it splits on `?` before resolving to a `page.tsx`. Verify by re-running it.

**Test:** add a smoke unit test for the four hrefs; existing brokenLinks test continues to pass.

### Fix 2.3 — Replace plaintext-password responses (Finding #11)

**Files:**
* `src/app/api/admin/users/route.ts` — remove plaintext from POST response.
* `src/app/api/admin/users/password/route.ts` — remove plaintext from `action=reset` response.
* Both routes already have the email-link path baked in for the `reminder` action; reuse it for new-user creation too.

**Change:**
1. When a manager+ creates a user (`POST /api/admin/users`), don't auto-generate a password. Instead, store the user with `passwordHash: null` (or a random unguessable hash that will never match) and `resetToken` + `resetTokenExpiry` set the same way as `reminder`. Email a "Set up your account" link to `/admin/reset-password?token=…` (the page from Fix 2.1).
2. Reset-action: same pattern — generate a token, email the link, never return plaintext.
3. Response shape becomes `{ success: true, message: "Password reset email sent" }` — no `password` field.

**Why it doesn't break anything else:**
* Existing admin users keep working; their `passwordHash` is unchanged.
* If anyone has built tooling on the plaintext response (unlikely — TODO comments indicate this was always known as wrong), document the change in the PR.
* The `AdminUser` interface (`src/lib/interfaces.ts`) already declares `resetToken?: string` and `resetTokenExpiry?: Date` — no schema migration required.

**Test:** update `__tests__/api/admin/users.test.ts` and `__tests__/api/admin/users/password.test.ts` to assert the response no longer carries `password`. Add a test that creating a user enqueues an email and stores a hashed token.

### Fix 2.4 — Move the rate limiter to Vercel KV / Upstash (Finding #13)

**Files:**
* `src/lib/utils/rateLimit.ts` — replace the in-memory `Map` with a KV-backed implementation behind the same `createRateLimiter` API.
* `src/lib/env.ts` — add `KV_REST_API_URL` and `KV_REST_API_TOKEN` (optional in dev, required in production).
* `.env.example` — document the new vars.

**Change:**

```ts
// rateLimit.ts
import { kv } from "@vercel/kv"; // or @upstash/redis

export function createRateLimiter(name: string, opts: RateLimiterOptions) {
  return {
    async check(identifier: string) {
      // If KV isn't configured, fall back to the legacy in-memory store
      // (already implemented). Production hard-requires it.
      if (!process.env.KV_REST_API_URL) return legacyCheck(name, identifier, opts);

      const key = `rl:${name}:${identifier}`;
      const count = await kv.incr(key);
      if (count === 1) await kv.pexpire(key, opts.windowMs);
      const remaining = Math.max(0, opts.maxRequests - count);
      const resetIn = (await kv.pttl(key)) || opts.windowMs;
      return { allowed: count <= opts.maxRequests, remaining, resetIn };
    },
    async reset(identifier: string) {
      if (!process.env.KV_REST_API_URL) return legacyReset(name, identifier);
      await kv.del(`rl:${name}:${identifier}`);
    },
  };
}
```

All current callers (`login`, `viewing-booking:`, `service-booking:`, `reservation:`, `password-reset-consume`, etc.) keep working. Mark `check()` as `async` everywhere and `await` it. There are ~6 call sites — all already in `await`-friendly contexts because the existing implementation returns synchronously.

**Why it doesn't break anything else:**
* The in-memory implementation is kept as a fallback when KV isn't configured, so local dev and existing tests continue to pass.
* Switch to `await` is mechanical — `npm run type-check` will flag any missed call site.
* No semantic change to "5 attempts per 15 min" — only distributed enforcement.

**Test:** unit test against an in-memory KV mock; verify allowed/blocked at the boundary. Confirm the legacy path still passes its existing tests when KV env vars are absent.

### Fix 2.5 — CAPTCHA + rate-limit `/api/bookings/lookup` (Finding #16)

**Files:**
* `src/app/api/bookings/lookup/route.ts` — add rate limit + optional Turnstile.
* `src/app/(main)/Booking/lookup/page.tsx` — add a `<TurnstileWidget>` to the form.

**Change:** apply the same pattern as `/api/bookings/viewing`:

```ts
const lookupLimiter = createRateLimiter("booking-lookup", { maxRequests: 10, windowMs: 60_000 });
// ...
const ip = ipAddress(request) || "unknown";
const { allowed } = await lookupLimiter.check(ip);
if (!allowed) return tooManyRequests();
const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
if (!captcha.ok) return badRequest("CAPTCHA failed");
```

Keep CAPTCHA optional in dev (same fallback as other endpoints).

**Why it doesn't break anything else:**
* Existing customers who navigated from the email's `?ref=…` URL get auto-lookup on mount. That's still fine — the rate-limit window is per-IP per-minute at 10 requests, which a normal user won't hit.
* The CAPTCHA widget only renders on the manual form, not on the URL-driven path; the URL path skips CAPTCHA because the booking ref itself is the bearer secret.

**Test:** API test for the rate limiter; component test that the Turnstile widget renders on the lookup page.

### Fix 2.6 — Tighten `JsonLd` against admin-content XSS (Finding #17)

**Files:**
* `src/components/SEO/JsonLd.tsx` — broaden the escape.
* `src/lib/utils/businessInfo.ts` (or wherever `ShopInfo` is validated server-side) — add Zod max-length on `description`, `businessName`, `address` etc.

**Change:**

```tsx
const safe = JSON.stringify(data)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
  .replace(/'/g, "\\u0027");
```

Adding `>`, `&`, `'` escapes neutralises the remaining HTML-context attacks (`</script>`, `--><script>`, attribute breakouts).

**Why it doesn't break anything else:**
* `JSON.parse` reverses all four escapes identically to `<`. Search engines parse JSON-LD, not HTML, so the runtime payload is unchanged for crawlers.
* No other consumer reads the inline string.

**Test:** snapshot test verifying that input like `<\/script>` round-trips correctly.

### Day 2 validation

* [ ] All Day 1 checks still pass.
* [ ] Both new API routes have integration tests.
* [ ] Manual: create a new admin user → receive the email → click the link → set a password → log in.
* [ ] Manual: try `/api/bookings/lookup` 11 times in 60 seconds — 11th returns 429.

---

## Day 3 — Information architecture cleanup (P1)

**Branch:** `day-3-ia-cleanup`
**Goal:** remove duplicate pages, dead code, and fix SEO competition.
**Findings addressed:** #7 (SearchContext dead), #8 (stray .md, partially handled in Day 1), #9 (DAY_PLAN duplicates — already fixed by this very plan replacing them), #10 (/Enquiry vs /contact), #31 (empty backend dir), #44 (BreadcrumbList JSON-LD), #45 (per-car og:image), #46 (contact/Enquiry SEO competition).

### Fix 3.1 — Choose `/contact` or `/Enquiry`, redirect the other (Findings #10, #46)

**Files:**
* Keep `/contact` (lowercase is more canonical and the conventional spelling).
* Delete `src/app/(main)/Enquiry/page.tsx`.
* Add a redirect: `next.config.ts` `async redirects()`:

```ts
async redirects() {
  return [
    { source: "/Enquiry", destination: "/contact", permanent: true },
  ];
}
```

* Update every internal `Link` that points to `/Enquiry` → `/contact`. Grep first: `rg "/Enquiry"` — likely Header.tsx, Footer.tsx, sitemap.ts, /AboutUs, /FAQ, the various Services pages.

**Why it doesn't break anything else:**
* 301 redirect preserves any external SEO authority pointing at `/Enquiry`.
* `__tests__/links/brokenLinks.test.ts` will fail until you sweep all internal references — that's a feature, not a bug; let it gate the PR.
* The two pages render *similar* content but with different copy. Audit the `/Enquiry` version once before deleting and copy any unique sections into `/contact`.

**Test:** updated `brokenLinks.test.ts` is green; `curl -I http://localhost:3000/Enquiry` returns 308 (permanent redirect).

### Fix 3.2 — Delete `SearchContext` (Finding #7)

**Files:**
* Delete `src/contexts/SearchContext.tsx`.

**Change:** `git rm`. Confirmed zero importers in `src/`.

**Why it doesn't break anything else:** literally nothing references it. The future global-search bar (when built) can resurrect this from git history.

**Test:** `npm run type-check && npm test` clean.

### Fix 3.3 — Decide on `src/backend/` (Finding #31)

**Files:**
* `src/backend/` — currently sparse per the README; verify it's actually empty and `git rm -r` it, OR move its remaining contents into `src/contexts/` or `src/lib/` and update imports.

**Change:** run `ls -la src/backend/` and decide:
* If empty → `git rm -r src/backend && rg "@/backend/" src/` should be empty.
* If non-empty → move each file to its logical home, update imports via grep + sed:
  * `rg -l "@/backend/X" src | xargs sed -i '' 's|@/backend/X|@/contexts/X|g'`

Update `README.md` to remove the `src/backend/` mention.

**Why it doesn't break anything else:** TypeScript will flag every broken import on `npm run type-check`. Treat any error as the move missed a file.

**Test:** `npm run type-check && npm test && npm run build`.

### Fix 3.4 — Add `BreadcrumbList` JSON-LD to BrowseFleet listing and car detail (Finding #44)

**Files:**
* `src/app/(main)/BrowseFleet/page.tsx` — render a `BreadcrumbList` near the existing `JsonLd`.
* `src/app/(main)/BrowseFleet/[_id]/page.tsx` — same, with Home › Fleet › Make Model Year.

**Change:**

```tsx
const breadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Fleet", item: `${siteUrl}/BrowseFleet` },
  ],
};
```

(For the detail page, add the third item for the car.)

**Why it doesn't break anything else:** Pure additive JSON-LD. Multiple `JsonLd` instances on a page are valid; Google's Rich Results test parses each separately. The visible `<Breadcrumb>` component already exists for the user-visible nav.

**Test:** snapshot the JSON-LD output; run a Rich Results test on a deployed preview.

### Fix 3.5 — Per-car `og:image` (Finding #45)

**Files:**
* `src/app/(main)/BrowseFleet/[_id]/page.tsx` — fill in `openGraph.images` in `generateMetadata`.

**Change:** inside `generateMetadata`, after loading the car:

```ts
const ogImage = car.image
  ? [{ url: car.image, width: 1200, height: 630, alt: `${car.year} ${car.make} ${car.model}` }]
  : undefined;

return {
  // ...
  openGraph: {
    title,
    description,
    images: ogImage,
    url: `/BrowseFleet/${_id}`,
  },
  twitter: { card: "summary_large_image", images: ogImage },
};
```

**Why it doesn't break anything else:** `next/image` doesn't gate metadata `openGraph.images`; only `<Image>` validates `remotePatterns`. Per-car URLs come from S3/CloudFront — both are valid HTTPS URLs that social crawlers can resolve. If `car.image` is empty, fall back to the global `/car.jpg` from the root layout (which is automatically inherited).

**Test:** generate metadata for a car with an image and confirm `openGraph.images` is present.

### Day 3 validation

* [ ] Manual: visit `/Enquiry` — 308 → `/contact`.
* [ ] Manual: open a deployed preview car detail in Slack/WhatsApp/iMessage — preview shows the car photo, not the generic `/car.jpg`.
* [ ] `__tests__/links/brokenLinks.test.ts` clean.

---

## Day 4 — Lint and runtime warnings (P1)

**Branch:** `day-4-lint-and-runtime-warnings`
**Goal:** close every remaining lint warning, fix the React hook dependency bugs they hide, and lift `console.error` calls into structured logging.
**Findings addressed:** #18 (exhaustive-deps × 4), #19 (unescaped entities × 12), #20 (no-unused-vars), #21 (unused eslint-disable), #28 (console.* → logError).

### Fix 4.1 — Fix `react-hooks/exhaustive-deps` (Finding #18)

#### 4.1.a — `src/components/Car/CarView.tsx:38`

The effect depends on `viewType` but its dep array omits it. Read the effect body: if `viewType` is *only* used to decide whether to run the effect, gate via the body (`if (!viewType) return;`); if it's *consumed*, add it.

**Why safe:** adding a real dep can't cause infinite loops as long as `viewType` is set from props/state at predictable points. Test by toggling view types in the dashboard and confirming no re-render storm.

#### 4.1.b — `src/components/Form/Dropdown.tsx:90`

`handleSelect` is called inside an effect but omitted. Wrap `handleSelect` in `useCallback` with proper deps, then list it in the effect's deps.

#### 4.1.c — `src/components/Main/Form/ServiceBookingForm.tsx:581`

The `useMemo` over `subServiceOptions` is missing `defaultService` and `subServiceOptions`. Adding `subServiceOptions` to its own memo deps is a smell — actually look at what the memo computes. If it builds a list keyed on `serviceType`, the dep should be `serviceType + businessInfo`. Refactor to capture the right inputs explicitly, then update the deps.

**Why safe:** these are correctness fixes — under React 18+ strict mode the missing deps cause stale closures, which is *more* dangerous than the warning suggests. Fixing them only narrows bugs.

**Test:** add a component test that flips the inputs and asserts the memoized output recomputes.

### Fix 4.2 — Escape apostrophes in email templates (Finding #19)

**Files:** all flagged by lint — see `npm run lint` output for the exact lines:
* `src/emails/BookingCancellation.tsx:126`
* `src/emails/CarViewingConfirmation.tsx:127`
* `src/emails/PasswordReset.tsx:61`
* `src/emails/QuoteConfirmation.tsx:46`
* `src/emails/ReviewInviteDetailing.tsx:113`
* `src/emails/ReviewInviteRecovery.tsx:110,112`
* `src/emails/ReviewInviteRepair.tsx:112,113`
* `src/emails/ReviewInviteService.tsx:114`
* `src/emails/ReviewInviteTinting.tsx:112,113`

**Change:** replace `'` with `&apos;` inside JSX text where the linter flags it.

**Why safe:** `&apos;` renders identically to `'` in every email client; `react-email`'s render pipeline passes entities through. Any `react/no-unescaped-entities` downgrade for `src/emails/**` (if one exists) can then be reverted to default-error.

**Test:** open `npm run email` preview and verify the apostrophes still appear in the rendered HTML.

### Fix 4.3 — Remove unused vars and unused eslint-disable (Findings #20, #21)

**Files:**
* `src/emails/template/EmailTemplate.tsx:21` — `Img` import unused.
* `src/lib/mongodb.ts:33` — remove the `// eslint-disable no-var` line.
* `src/lib/utils/businessInfo.ts:354,364,413` — unused `_id` / `_recoveryId` (rename to `_` or destructure with `_id: _`).
* `src/lib/utils/observability.ts:62,78` — remove stale eslint-disable directives.
* `src/lib/utils/reviewInvite.ts:103` — unused `customerName`.

**Change:** mechanical. Either delete the import/variable, or rename to start with `_` (already accepted by the lint config for "intentionally unused").

**Why safe:** unused identifiers can't affect behaviour. Removing unused `eslint-disable` lines actually enables real coverage for lines that were never flagged.

### Fix 4.4 — Migrate `console.error/warn` to `logError/logEvent` (Finding #28)

**Files:** 233 hits across `src/`. Run:

```bash
rg -l "console\.(error|warn)" src/ | grep -v __tests__
```

**Change:** every `console.error(msg, err)` → `logError(err, { context: "where", msg })`. Every `console.warn(...)` → `logEvent("warn", { ... })`.

Keep `console.log` in `emails/send.ts` for the Ethereal account printout (dev only).

**Why safe:** `logError` and `logEvent` in `src/lib/utils/observability.ts` currently fall through to `console.error` / `console.log`, so behaviour in dev is unchanged. Once Sentry is wired (Day 5), production becomes queryable.

**Test:** spot-check 10 routes. Run them locally, trigger a known error, confirm structured logs appear.

### Day 4 validation

* [ ] `npm run lint` returns 0 warnings (or down to a single-digit pile of stylistic ones).
* [ ] CI's lint job no longer needs the `react/no-unescaped-entities` downgrade in `src/emails/**`.
* [ ] Manual: scan output of a dev run — no raw `console.error` from app code.

---

## Day 5 — Observability and runtime hardening (P2)

**Branch:** `day-5-observability`
**Goal:** make production debuggable.
**Findings addressed:** #54 (Sentry), #55 (KV reflected via Day 2.4), #56 (env/staging docs), #29 (mixed fetching patterns — partial).

### Fix 5.1 — Wire Sentry (Finding #54)

**Files:**
* `npm i @sentry/nextjs`
* New: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` (per Sentry's Next 16 wizard).
* `src/lib/utils/observability.ts` — replace the placeholder bodies with `Sentry.captureException(err, { extra: context })` and `Sentry.addBreadcrumb({...})`.
* `src/lib/env.ts` — add `SENTRY_DSN` (optional in dev, required in production).
* `.env.example` — document.

**Change:** standard Sentry Next.js setup. Keep `tracesSampleRate: 0.1` to start. Mark `/api/cron/*` as background — Sentry handles that automatically when called from Vercel cron.

**Why safe:**
* `logError` / `logEvent` keep the same call signatures, so Day 4's migration doesn't need to change.
* If `SENTRY_DSN` is unset, Sentry no-ops; behaviour matches today.

**Test:** trigger an error locally → verify it appears in Sentry. Add a `/api/admin/health` check that pings Sentry connectivity.

### Fix 5.2 — Document env, staging, secrets (Finding #56)

**Files:**
* `SETUP.md` — add sections: "Staging environment" (separate Vercel project + separate Mongo cluster), "MongoDB backup/restore" (Atlas point-in-time recovery), "Secret rotation cadence" (table: secret, owner, rotation period, last rotated).

**Why safe:** docs-only.

**Test:** read the file aloud, ask "would the client know what to do?"

### Day 5 validation

* [ ] Live Sentry receives a test event.
* [ ] `SETUP.md` covers staging + backups + rotation.

---

## Day 6 — Accessibility (P1/P2)

**Branch:** `day-6-accessibility`
**Goal:** raise the floor on WCAG 2.1 AA. Catch real keyboard / screen reader problems before they hit users.
**Findings addressed:** #38 (gray-400 contrast), #40 (aria-describedby), #41 (FilterSelect/RangeInput a11y), #42 (gallery keyboard), #43 (heading hierarchy), plus enable axe-core in CI.

### Fix 6.1 — Sweep `text-gray-400` (Finding #38)

**Files:** 41 components — start with `Form/Form.tsx` (step indicators), `Helpful/Pagination.tsx`, `Footer.tsx`, `FormPrimitives.tsx`.

**Change:** body text should be ≥ `text-gray-600` (`#4b5563`, 7.2:1 on white — comfortably AA). Decorative gray-400 stays. Placeholder text (gray-400 in `placeholder:text-gray-400`) is fine — placeholders don't need AA.

**Why safe:** purely visual contrast change. If anything looks "too dark" after the sweep, that's the contrast you actually wanted.

**Test:** axe-core CI (added below). Manual: dark text on white in DevTools' accessibility pane.

### Fix 6.2 — Add `aria-describedby` to form inputs (Finding #40)

**Files:** `src/components/Form/FormPrimitives.tsx` (`FormInput`, `FormTextarea`), `src/components/Form/Dropdown.tsx`.

**Change:** generate a stable `id` via `useId`, render the error message with `id="${inputId}-error"`, and on the input add `aria-describedby={error ? `${inputId}-error` : undefined}` + `aria-invalid={!!error}`.

**Why safe:** purely additive ARIA. Existing visual error rendering is unchanged.

**Test:** jest-axe test for each form primitive with an error state.

### Fix 6.3 — `FilterSelect` and `RangeInput` ARIA (Finding #41)

**Files:** `src/components/Helpful/FilterSelect.tsx`, `src/components/Helpful/RangeInput.tsx`.

**Change:** if these are custom selects (not native `<select>`), implement the WAI-ARIA combobox pattern — `role="combobox"`, `aria-expanded`, `aria-controls`, arrow-key navigation, Home/End jumps, escape to close. If they're native, just verify `<label>` association.

**Why safe:** existing mouse users keep their UX; keyboard users gain access.

**Test:** jest-axe test + manual tab-through.

### Fix 6.4 — Car gallery keyboard navigation (Finding #42)

**Files:** `src/components/Car/CarDetailView.tsx`.

**Change:** prev/next buttons need `aria-label="Previous image"` / `aria-label="Next image"`. Add a `<span class="sr-only" aria-live="polite">Image {n} of {total}</span>` that updates on change. Bind ArrowLeft/ArrowRight to prev/next when the gallery has focus.

**Why safe:** purely additive interaction.

**Test:** manual SR test (VoiceOver on macOS).

### Fix 6.5 — Heading hierarchy audit (Finding #43)

**Files:** every `(main)/*/page.tsx`.

**Change:** ensure each page has exactly one `<h1>` and no `<h3>` before an `<h2>`. The `.page-title` / `.section-title` / `.heading-3` / `.heading-4` utilities don't enforce semantic levels — verify the tag (`h1`/`h2`/`h3`/`h4`) matches the class.

**Why safe:** semantic correction only; no visual change because the typography utilities aren't tag-bound.

**Test:** axe-core flags multiple-h1 and out-of-order headings.

### Fix 6.6 — Add axe-core to Playwright E2E (Findings #15, #38–#43)

**Files:**
* `npm i -D @axe-core/playwright`
* `e2e/a11y.spec.ts` — new spec that visits every public route and runs `AxeBuilder`.

**Change:**

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = ["/", "/BrowseFleet", "/Services", "/Services/Detailing", "/Services/Tints",
                "/Services/Repairs", "/Recoveries", "/CarParts", "/AccidentClaims",
                "/contact", "/FAQ", "/AboutUs", "/privacy", "/terms"];

for (const path of routes) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter(v => v.impact === "critical" || v.impact === "serious")).toEqual([]);
  });
}
```

**Why safe:** new tests, no app changes. They'll fail loudly when something regresses.

**Test:** run locally, fix any net-new violations.

### Day 6 validation

* [ ] axe E2E spec is green on every public route at "serious+" impact.
* [ ] Tab through home → BrowseFleet → CarDetail → booking confirmation manually — focus order is logical, no traps, modal traps correctly.

---

## Day 7 — Code debt: large files and parallel primitives (P2)

**Branch:** `day-7-refactor-debt`
**Goal:** reduce future maintenance cost. Risk is highest in this Day — do it last among the technical Days.
**Findings addressed:** #22 (BusinessInfoForm 1,143 LOC), #25 (three button primitives), #26 (Helpful vs UI), #27 (interfaces.ts vs types.ts).

### Fix 7.1 — Split `BusinessInfoForm.tsx` (Finding #22)

**Files:**
* New: `src/components/Admin/Tabs/BusinessInfo/CoreInfoSection.tsx`
* New: `src/components/Admin/Tabs/BusinessInfo/HeroStatsSection.tsx`
* New: `src/components/Admin/Tabs/BusinessInfo/HoursSection.tsx`
* New: `src/components/Admin/Tabs/BusinessInfo/SocialSection.tsx`
* New: `src/components/Admin/Tabs/BusinessInfo/DetailingPackagesSection.tsx`
* New: `src/components/Admin/Tabs/BusinessInfo/TintOptionsSection.tsx`
* New: `src/components/Admin/Tabs/BusinessInfo/ServiceOverviewsSection.tsx`
* New: `src/components/Admin/Tabs/BusinessInfo/RecoverySection.tsx`
* Edit: `src/components/Admin/Tabs/BusinessInfoForm.tsx` → becomes a thin orchestrator (open state, save handler) that composes the sections.
* New: `src/components/Admin/Tabs/BusinessInfo/useShopInfoEditor.ts` — small hook that owns the `(shopInfo, setShopInfo, update)` triple.

**Change:** mechanical move. Each section receives `shopInfo` slice + `onChange` callback as props. Keep the existing `<Section>` collapse component (move it next to the sections that use it).

**Why safe:**
* The outer save handler (`POST /api/admin/shop`) is untouched; it always sent the full `ShopInfo`, still does.
* Open/closed state was `useState` per section; preserve by keeping it local to each section component.
* No prop drilling beyond one level.

**Test:** add a snapshot test of each section's controlled render; existing API test of `/api/admin/shop` PUT continues to pass.

### Fix 7.2 — Unify on `UI/Button` (Findings #25, #26)

**Files:**
* Migrate 18 imports of `@/components/Helpful/Buttons/Button` to `@/components/UI/Button`. Each call site needs `variant`/`size` translated (the new primitive's API is documented in `UI/Button.tsx` header).
* Migrate `FormPrimitives.FormButton` to `UI/Button` — re-export or import directly.
* Delete `src/components/Helpful/Buttons/Button.tsx` once zero importers remain.

**Change:** because the API differs slightly, do this one folder at a time:
1. Migrate all admin pages (5–6 files).
2. Migrate all customer forms (3 files).
3. Migrate the marketing pages (the rest).

Verify visual parity in dev after each batch — both primitives target the same Tailwind classes, but corner-case props (e.g. `loading`, `iconPosition`) can render subtly differently.

**Why safe:**
* The new `Button` was explicitly designed to subsume the old; the new docstring (`UI/Button.tsx`) says so.
* Visual diff possible via storybook (if you have one) or just side-by-side screenshots.

**Test:** existing button tests (`__tests__/components/UI/Button.test.tsx` and `__tests__/components/Helpful/Buttons/Button.test.tsx`) — the latter eventually becomes obsolete.

### Fix 7.3 — Merge `interfaces.ts` and `types.ts` (Finding #27)

**Files:**
* `src/lib/interfaces.ts` — keep, becomes the single source.
* `src/lib/types.ts` — move every export into `interfaces.ts`, leave the file as a re-export shim during the transition:

```ts
// types.ts
export * from "./interfaces";
```

* Eventually, after a sweep of imports to `@/lib/interfaces`, delete `types.ts`.

**Why safe:**
* The shim keeps every existing `from "@/lib/types"` import working unchanged.
* Type-only changes have zero runtime impact.

**Test:** `npm run type-check` is the test.

### Day 7 validation

* [ ] All Day 1–6 checks still green.
* [ ] BusinessInfoForm renders identically to today (manual diff on admin > Shop tab).
* [ ] Every button on the site uses `UI/Button`.

---

## Day 8 — Testing coverage (P2)

**Branch:** `day-8-testing`
**Goal:** lift coverage from 23% toward 50% as a stepping stone to 80%. Focus on the high-value files. No CI in this repo today — coverage gates run locally via `npm run test:coverage`.
**Findings addressed:** #50 (coverage), #51 (form coverage), #52 (BusinessInfoForm tests), #53 (link test gaps).

### Fix 8.1 — Test the four highest-value untested files

* `src/components/Main/Form/ServiceBookingForm.tsx` (700 LOC) — drive every step, hit submit, assert API called with the right body.
* `src/components/Main/Form/CarViewingForm.tsx` (326 LOC) — same.
* `src/components/Car/PartExchangeForm.tsx` (345 LOC) — same.
* `src/components/Admin/Tabs/BusinessInfoForm.tsx` (now split per Day 7, easier to test per section).

**Approach:** for each form, mock the network (`fetch` or your `useApi` hook), drive happy path + validation failures, snapshot the rendered review step.

**Why safe:** test additions can't break runtime.

### Fix 8.2 — Strengthen `brokenLinks.test.ts` (Finding #53)

**Files:** `__tests__/links/brokenLinks.test.ts`.

**Change:** also scan `.ts` files under `src/lib/` and `src/emails/` for URL string literals that look like internal routes, not only JSX `href`s. Regex: `/\b(['"`])\/[A-Za-z0-9/_-]+\1/g`. Walk that list through the same router resolution as today.

This would have caught Finding #2 (the `/review?ref=…` builder) automatically.

**Why safe:** broader detection only adds failures, never silently passes.

### Fix 8.3 — Local coverage floor

**Files:** `jest.config.js`.

**Change:** keep a `coverageThreshold.global` floor so anyone running `npm run test:coverage` locally gets a failure when coverage regresses. Raise the floor by 5% every quarter until 80%. No CI integration today — this is a developer-discipline gate, not an automated one.

**Why safe:** ratchet only goes up. Threshold only fires when `--coverage` is passed; bare `jest` runs are unaffected.

### Day 8 validation

* [ ] Coverage ≥ 50%.
* [ ] `npm run test:coverage` fails if anyone drops it below the configured floor.
* [ ] `brokenLinks.test.ts` would have caught the `/review` bug if it had been run before Day 1.

---

## Day 9 — UX polish and missing features part 1 (P2/P3)

**Branch:** `day-9-ux-polish`
**Goal:** ship the small UX wins.
**Findings addressed:** #32 (no search bar — placeholder for later), #33 (cookie consent), #34 (WhatsApp message), #35 (booking price visibility), #36 (badge-blue naming), #37 (token consistency).

### Fix 9.1 — Cookie consent banner (Finding #33)

**Files:**
* New: `src/components/Shared/CookieBanner.tsx`.
* `src/app/(main)/layout.tsx` — render the banner once at layout level.
* No analytics today, so the banner only governs whether to load analytics later (cookie key `cookie-consent` in localStorage with values `accepted` / `rejected`).

**Change:** small banner pinned to the bottom of the viewport, two buttons (Accept, Reject), dismissed via localStorage. Add `aria-live="polite"`, focus-trap when shown, restore focus on close.

**Why safe:** purely additive UI. No analytics is currently wired, so "accept" doesn't enable anything yet — but it future-proofs you.

**Test:** RTL test for show/dismiss + axe-core check.

### Fix 9.2 — Strip query params from WhatsApp message (Finding #34)

**Files:** `src/components/WhatsAppButtonClient.tsx`.

**Change:**

```diff
- `Hi ${businessName}, I'm interested in this car: ${typeof window !== "undefined" ? window.location.href : ""}`
+ `Hi ${businessName}, I'm interested in this car: ${typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : ""}`
```

**Why safe:** the customer doesn't need the query params (`?utm_…`, search filters) when reporting interest. Trimming them removes a small PII leak.

**Test:** manual — click WhatsApp from a filtered fleet page, confirm the URL pasted into WhatsApp has no `?`.

### Fix 9.3 — Show car price on the first step of booking forms (Finding #35)

**Files:** `src/components/Main/Form/CarViewingForm.tsx`, `src/components/Shared/VehicleDetails.tsx`.

**Change:** `VehicleDetails` already shows the car at the top of the flow, but doesn't render `price`. Add `formatPrice(vehicle.price)` to the existing layout.

**Why safe:** purely additive. The price was already in the data — just rendering it.

### Fix 9.4 — Rename `badge-blue` (Finding #36)

**Files:** `src/app/globals.css`, every JSX using `className="badge-blue"`.

**Change:** since the class is implemented as red (`bg-red-50 text-red-600`), either:
* Rename the utility to `.badge-brand` and update call sites (recommended).
* Or change the implementation to actual blue (`bg-blue-50 text-blue-600`).

Pick option 1 — keeps the visual consistent with the brand.

**Why safe:** call sites are searchable.

### Fix 9.5 — Use CSS custom properties consistently (Finding #37)

**Files:** `src/app/globals.css`, frequent `bg-red-600` consumers.

**Change:** stop maintaining both `--color-brand` in `:root` and Tailwind's `red-600` literal in every component. Either:
* Decide tokens are authoritative — replace `bg-red-600` etc. with `bg-[var(--color-brand)]`. Tedious but theme-able.
* Decide Tailwind is authoritative — delete the CSS variables from `:root`. Simpler.

Recommendation: delete the CSS variables for now (option 2). Re-introduce them later when theming is a real requirement. The current setup gives the worst of both worlds.

**Why safe:** the variables are not currently consumed by any JSX (verify with `rg "var\(--color-"` — should be empty in `src/`). Removing them changes nothing visually.

### Fix 9.6 — Build the global search bar (Finding #32)

**Files:**
* `src/contexts/SearchContext.tsx` — restore from git history (deleted in Day 3) or write fresh.
* New: `src/components/Shared/SearchBar.tsx`.
* `src/components/Header.tsx` — render the search bar; on submit, navigate to `/BrowseFleet?q=…`.
* `src/lib/utils/buildCarFilter.ts` — extend `parseCarFilters` to read `q` and add a `$text` Mongo filter or a regex against `make`/`model`/`features`.
* `src/lib/models/index.ts` — add a `$text` index to the `cars` collection (`{ make: "text", model: "text", description: "text", features: "text" }`).

**Why safe:**
* `$text` index is additive — no other queries change behaviour.
* The search bar is hidden behind a `<form>` so URL state stays canonical.

**Test:** add unit tests for `parseCarFilters({ q: "BMW" })` and an E2E click-through.

### Day 9 validation

* [ ] Cookie banner shows on first visit, persists choice.
* [ ] WhatsApp deep link URL has no query string.
* [ ] Search bar in header narrows BrowseFleet correctly.

---

## Day 10 — Admin features part 2 (P3)

**Branch:** `day-10-admin-features`
**Goal:** make the admin dashboard cover the operational surface.
**Findings addressed:** #58 (reset-password page — done in Day 2), #59 (audit log), #60 (bulk actions / CSV), #61 (Reservations / PartExchange / Quotes admin UI), #62 (saved cars for customers).

### Fix 10.1 — Audit log (Finding #59)

**Files:**
* `src/lib/models/index.ts` — new `auditLogs` collection with indexes on `(createdAt: -1)` and `(actor, createdAt)`.
* `src/lib/interfaces.ts` — new `AuditLog` interface (`actor`, `action`, `targetType`, `targetId`, `metadata`, `createdAt`).
* `src/lib/utils/audit.ts` — `recordAudit({ actor, action, ... })` helper.
* `src/app/(admin)/admin/dashboard/audit/page.tsx` — new admin page listing recent entries with filter by actor + action.
* Wire `recordAudit` into every state-changing admin route: car create/update/delete, carpart CRUD, user create, password reset, booking confirm/cancel.

**Why safe:** purely additive. Logging failures must never block the parent operation — wrap `recordAudit` in `try/catch` and `logError` on failure.

**Test:** integration test that a car create produces an audit log row.

### Fix 10.2 — Bulk actions + CSV export (Finding #60)

**Files:**
* `src/components/Admin/Tabs/ServiceBookingsTab.tsx`, `ViewingBookingsTab.tsx`, `src/app/(admin)/admin/dashboard/cars/page.tsx`, `src/app/(admin)/admin/dashboard/carparts/page.tsx`.

**Change:** add a row-checkbox column + a sticky action bar at the bottom ("Mark 3 as confirmed", "Cancel 5 bookings", "Export selected as CSV"). For CSV, generate client-side via a small `toCsv(rows, columns)` helper.

**Why safe:** bulk endpoints already exist for one-at-a-time updates; the bulk action is just N parallel calls (with a small concurrency cap, e.g. `p-limit`). No new server route needed.

**Test:** select 3 rows, confirm them, refresh, all 3 confirmed.

### Fix 10.3 — Dedicated admin UI for Reservations, Part Exchange, Quotes (Finding #61)

**Files:**
* New: `src/app/(admin)/admin/dashboard/reservations/page.tsx` — list, confirm (deposit taken), cancel.
* New: `src/app/(admin)/admin/dashboard/part-exchange/page.tsx` — list, set valuation, accept/decline.
* New: `src/app/(admin)/admin/dashboard/quotes/page.tsx` — list, respond, mark accepted/expired.
* Update `AdminNavigationTabs.tsx` to expose all three.

**Change:** reuse `BookingsTable` patterns — same shape (search, status filter, row click → modal). The existing `/api/admin/bookings` endpoint already proves the table abstraction.

**Why safe:** the DB collections already exist with proper indexes. Adding UI doesn't change data; existing customer-facing flows that write to those collections aren't touched.

**Test:** smoke E2E for each new page.

### Fix 10.4 — Saved cars for customers (Finding #62)

**Files:**
* `src/contexts/SavedCarsContext.tsx` — localStorage-backed, no auth required.
* `src/components/Car/CarListCard.tsx` and `CarDetailView.tsx` — heart icon toggle.
* New `/saved` page listing saved cars.

**Why safe:** localStorage-only; no DB, no auth surface area.

**Test:** RTL test for save/unsave toggle persistence.

### Day 10 validation

* [ ] Every admin action shows in `/admin/dashboard/audit`.
* [ ] Bulk confirm 5 bookings — all 5 update.
* [ ] CSV export downloads with the right rows.
* [ ] Reservations, Part Exchange, Quotes have dedicated admin pages.

---

## Day 11 — Performance and scale (P3)

**Branch:** `day-11-performance`
**Goal:** keep the dashboard fast as the dataset grows; clean up minor perf debt.
**Findings addressed:** #47 (getDashboardData over-fetches), #48 (per-instance featured-car cache), #49 (Motion bundle).

### Fix 11.1 — Paginate / aggregate `getDashboardData` (Finding #47)

**Files:** `src/components/Admin/Dashboard/getDashboardData.ts`.

**Change:** move aggregation into MongoDB. Today the function pulls every car / booking / user and groups in JS. Switch to `aggregate()` pipelines:

```ts
const inventoryByFuel = await carsCol.aggregate([
  { $group: { _id: "$fuel", count: { $sum: 1 } } }
]).toArray();
```

…and for the time-range bucketing, push `$match: { createdAt: { $gte: rangeFrom, $lte: rangeTo } }` to Mongo before the `$group`.

**Why safe:**
* Output shape is unchanged for the chart components.
* Existing in-memory path can stay as the dev-mode fallback if you want belt-and-braces.

**Test:** snapshot the dashboard for a known fixture; ensure numbers match exactly post-refactor.

### Fix 11.2 — Distributed featured-car cache (Finding #48)

**Files:** `src/lib/models/index.ts` — change the in-module `featuredCar` cache to KV.

**Change:** use the same `@vercel/kv` from Day 2.4. Key `featured-car`, TTL 5 min. On admin mutation that sets a car as featured (`PUT /api/admin/cars`), call `kv.del("featured-car")` after the Mongo update.

**Why safe:** the explicit `revalidatePath('/')` continues to work for the static segment; the KV cache only affects the in-memory hot-path inside `getFeaturedCar`.

### Fix 11.3 — Audit Motion bundle (Finding #49)

**Files:** any component importing from `motion` or `framer-motion`.

**Change:** verify imports use the tree-shakeable `motion/react` entry, not the legacy `framer-motion`. Run `npx @next/bundle-analyzer` to see actual bundle size; if Motion is > 30 KB gzipped, lazy-load via `dynamic(() => import("..."), { ssr: false })` for non-critical animations.

**Why safe:** ESM imports are tree-shaken regardless; the bundle analyzer just confirms.

### Day 11 validation

* [ ] Dashboard p95 < 500ms with seeded 10k bookings.
* [ ] Featured car cache shared across instances.
* [ ] Bundle analyzer shows Motion impact ≤ 30 KB gzipped.

---

## Day 12 — Final polish and handover prep (P3)

**Branch:** `day-12-final`
**Goal:** the small stuff. Items the audit flagged that have low risk and low reward but produce a tidier handover.
**Findings addressed:** #12 (CSP `unsafe-inline`), #14 (2FA — defer or implement), #15 (dev SESSION_SECRET), #23 (marketing copy primitive), #24 (parallel form abstractions), #29 (mixed fetching patterns), #30 (dealership field), plus client-facing docs.

### Fix 12.1 — CSP nonce middleware (Finding #12)

**Files:** `src/middleware.ts`, `next.config.ts`.

**Change:** generate a per-request nonce, inject into the CSP header (`script-src 'self' 'nonce-${n}'`) and into Next's `<Script>` components via the `next/script` `nonce` prop. Document the constraint clearly: inline `<style>` blocks need nonces too (`style-src 'self' 'nonce-...'`).

**Why safe but risky:** Tailwind v4 emits all CSS at build time, so `'unsafe-inline'` on `style-src` is no longer load-bearing. But any third-party script (Turnstile, future analytics) must accept a nonce. Test thoroughly in staging before merging.

**Defer if:** you don't have 4 uninterrupted hours.

### Fix 12.2 — 2FA on admin (Finding #14)

**Files:**
* `npm i otpauth qrcode`
* New: `src/app/api/admin/2fa/enroll/route.ts` and `/verify/route.ts`.
* New: `src/app/(admin)/admin/account/2fa/page.tsx` for setup.
* Extend `AdminUser` with `totpSecret?: string` and `totpEnabled: boolean`.
* `src/app/api/admin/login/route.ts` — when `totpEnabled`, return `{ requires2fa: true }` and accept the TOTP code in a second step.

**Why safe:** opt-in per user, doesn't lock anyone out by default.

**Test:** E2E enroll + login.

### Fix 12.3 — Remove dev `SESSION_SECRET` hardcode (Finding #15)

**Files:** `src/lib/utils/auth.ts`.

**Change:** replace `"dev-only-fallback-secret-at-least-32chars!"` with `crypto.randomBytes(32).toString("hex")` computed once at module load when no env var is set. The string is opaque to readers of source.

**Why safe:** dev sessions become un-resumable across server restarts (fine; you log in once a session). Tests already mock auth.

### Fix 12.4 — Marketing pages primitive (Finding #23)

**Files:**
* New: `src/components/Shared/MarketingPage.tsx` — accepts a `sections: Array<{ kind: "hero" | "feature-grid" | "process-flow" | "cta", ... }>` and renders.
* Refactor `AboutUs`, `AccidentClaims`, `Recoveries` to feed `MarketingPage` instead of hand-rolling JSX.
* Store the section data in `lib/content/about.ts`, `lib/content/accident-claims.ts`, etc. — easier for a non-developer to edit.

**Why safe:** purely a refactor; visual output must match (snapshot test before/after).

**Defer if:** the client wants a real CMS later. This is an intermediate step.

### Fix 12.5 — Reconcile customer form abstractions (Finding #24)

**Defer.** DAY_PLAN's predecessor explicitly chose not to migrate the customer forms because they're revenue-critical. Hold that line. Address only if you have a week to test thoroughly.

### Fix 12.6 — Settle on a data-fetching pattern (Finding #29)

**Files:** admin pages that mix server-component fetching with client-side `useEffect(fetch)`.

**Change:** for read-mostly admin pages, prefer Server Components (already the pattern for `/admin/dashboard`). Reserve client `fetch` only for live-reloading data (e.g. status page, dashboard refresh button).

**Why safe:** strangler-style migration, one page at a time.

### Fix 12.7 — `dealership` field cleanup (Finding #30)

**Files:** `src/lib/interfaces.ts`, `src/app/api/bookings/viewing/route.ts`, `CarDetailView.tsx`.

**Change:** either:
* Make `dealership` required, default it from `businessInfo` at the route level so the form doesn't have to think about it.
* Or remove it from `CarViewingBooking` entirely if the booking is always at the single showroom. (You're a single-location dealer; consider removing.)

**Why safe:** changing optionality requires a Mongo migration backfill (or accepting that old documents have `undefined`). If you remove the field, deprecate first (stop writing it, leave it in the schema for 30 days, then drop).

### Fix 12.8 — Client handover docs (per old DAY_PLAN's outstanding items)

**Files:**
* `OPERATIONS.md` (new, repo-root) — non-technical client guide ("how to add a car", "how to confirm a booking", "what to do when the Status widget shows red").
* `RUNBOOK.md` (new, repo-root) — MongoDB / S3 / SMTP ownership, domain, env vars, escalation path.
* Update `README.md` to point at both.

**Why safe:** docs-only.

### Day 12 validation

* [ ] CSP no longer contains `'unsafe-inline'` (or, if deferred, the deferral is documented).
* [ ] All admin accounts can opt into 2FA.
* [ ] OPERATIONS.md and RUNBOOK.md are written for the client, not the developer.

---

## Skipped / not worth doing

| Item | Why skipping |
|---|---|
| Migrate `ServiceBookingForm` and `CarViewingForm` to the multi-step `Form` framework | High risk on revenue-critical flows. Only justified if rewriting them anyway. |
| Single `<DataTable>` primitive | 3 call sites today (cars, carparts, bookings). Build when there's a 4th. |
| Pre-commit hook for `prettier-plugin-tailwindcss` | Nice-to-have. Run `npm run format` once before handover. |

---

## Cross-cutting validation checklist

Before merging any Day:

1. `npm run lint` — no errors, warnings only decrease.
2. `npm run type-check` — clean.
3. `npm test` — all green; coverage didn't drop.
4. `npm run build` — succeeds (and is the most reliable smoke test).
5. `npx playwright test` — clean if you touched routes/forms.
6. Manual: walk the home → BrowseFleet → CarDetail → book viewing → confirmation flow.
7. Manual: admin login → cars → quick edit → save → see change on customer site within 60s.

Re-run all seven on each Day's branch before opening the PR.

---

## Done definition

When Days 1–12 are merged to `main`:
* `npm run build` is green.
* No customer-visible 404s from internal links or emails.
* Test coverage ≥ 50% with `npm run test:coverage` failing below the configured local floor.
* Lint is at 0 errors and ≤ a handful of warnings.
* CSP no longer contains `'unsafe-inline'` (or deferral is documented).
* Sentry receives errors from production.
* Rate limiter is distributed.
* Audit log captures every admin action.
* Every customer-facing page passes axe-core "serious+" checks.

That's the handover bar.

---

*Generated from WEBSITE_REVIEW.md on 2026-05-12. Update Day statuses as you go.*
