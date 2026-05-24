# Deployment runbook

Day-1 operational reference for deploying and running the MMC Leeds car-sales app in production. Pair with `HANDOVER_NOTES.md` (architecture / known issues), `SETUP.md` (Sentry, staging, backups, secret rotation), and `RUNBOOK.md` (on-call).

## Hosting

- Target platform: **Vercel** (Next.js 16 App Router, Node 22.x, declared in `package.json#engines`).
- `vercel.json` declares one cron job. Other Vercel features used: KV (Upstash REST), edge middleware (`src/proxy.ts`), `waitUntil` (`@vercel/functions`) for fire-and-forget email sends.
- `next.config.ts` wraps the export with `withSentryConfig` only when `SENTRY_DSN` (or `NEXT_PUBLIC_SENTRY_DSN`) is set at build time. Without a DSN the wrap is skipped — `next build` stays green.
- `next.config.ts` sets `poweredByHeader: false`, AVIF/WebP image formats, and a baseline of security headers (HSTS, X-Frame-Options=SAMEORIGIN, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP=same-origin, CORP=same-site). **COEP is deliberately omitted** — enabling `require-corp` would break the Turnstile widget and S3 image hosts.
- CSP is set per-request from `src/proxy.ts` (the middleware file is named `proxy.ts`, not `middleware.ts`) so it can include a fresh nonce. `style-src` still permits `'unsafe-inline'` (Motion + `next/font` inject inline styles); a Report-Only mirror posts to `/api/csp-report`.
- Build requires a reachable `MONGODB_URI` because `next build` runs page-data collection against the DB. Vercel build IPs reach Atlas in prod; local builds need a working URI in `.env.local`.
- `vercel.json` only ships the cron schedule. Function `maxDuration` is set per-route (cron uses `export const maxDuration = 60`).
- Do **not** put `force-dynamic` back on `src/app/(main)/layout.tsx` — it was removed deliberately (collapsed throughput under load). Marketing pages use per-page `export const revalidate = N` instead.

## Required environment variables

`.env.example` documents every variable. `src/lib/env.ts` validates server vars at boot via Zod and refuses to start in production if required values are missing. Grouped here as they apply.

**Database**
- `MONGODB_URI` — `mongodb://…` or `mongodb+srv://…`. Must include the `MMC` database in the path; the model layer hardcodes `client.db("MMC")` in `src/lib/models/index.ts`.

**Sessions / auth**
- `SESSION_SECRET` — iron-session signing key for admin auth. Min 32 chars. Required in production (boot throws otherwise). In dev a per-process `crypto.randomBytes` fallback runs (sessions don't survive restart).
- `AUTH_SECRET` — NextAuth v5 (customer) JWT signing key. Required in production. Generate with `npx auth secret`.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — optional. Hide the "Continue with Google" button when unset.

**Admin bootstrap (one-shot, consumed by `npm run setup-admin`)**
- `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — seed the first admin user, then drop them. The script is idempotent (re-running rotates the password for an existing user).

**Email / SMTP** (used by `src/emails/send.ts`)
- `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_USER`, `SMTP_PASS` — required in production. Without all three host/user/pass, `getTransporter()` throws under `NODE_ENV=production`.
- `EMAIL_FROM` — required to differ from `noreply@yourdomain.com` in production (boot throws otherwise).
- `EMAIL_FROM_NAME` — defaults to `MMC Leeds`.

**S3 / AWS** (used by `src/lib/utils/s3.ts`)
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` — required for admin image upload. Without them `/api/admin/upload` will throw at sign time.
- `CLOUDFRONT_DOMAIN` — optional. When set, public URLs are rewritten to `https://${CLOUDFRONT_DOMAIN}/${key}`.

**Sentry** (Sentry is shipped as a dependency; behaviour is gated on DSN presence)
- `SENTRY_DSN` — server-side DSN. Without it `Sentry.init` no-ops and `src/lib/utils/observability.ts` falls back to `console.*`.
- `NEXT_PUBLIC_SENTRY_DSN` — same value, inlined into the client bundle.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — needed for source-map upload; optional for first deploy.

**Vercel KV / rate limit**
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — Upstash REST creds. When both are set, `createRateLimiter` uses KV; otherwise per-instance memory. **Production must configure KV** — without it, limits are per-Lambda-warm-instance under autoscaling (effectively no limit). Credential-guarding limiters use `failClosed: true`, so a KV outage still denies (not opens).

**Cron**
- `CRON_SECRET` — required in production (boot throws otherwise). Vercel sends it in the `Authorization: Bearer …` header for cron invocations. Compared via constant-time SHA-256 in `src/app/api/cron/review-invites/route.ts`.

**Turnstile** (optional)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile bot protection on forms. Widget hides itself when the site key is unset; server-side verification is a no-op in dev and a hard 400 in prod.

**Public URLs**
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL` — base URLs used in metadata, email links, and review-invite URLs.
- `NEXT_PUBLIC_BUSINESS_NAME` — defaults to `MMC Leeds`.

## MongoDB Atlas setup

- Connection string format: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/MMC?retryWrites=true&w=majority`. The `MMC` path segment is required — every collection accessor in `src/lib/models/index.ts` calls `client.db("MMC")`.
- DB user: read/write on the `MMC` database. No admin role needed.
- IP allowlist: add Vercel's egress ranges (or `0.0.0.0/0` if your security posture allows). Vercel's build sandbox must also reach Atlas because `next build` queries the DB.
- Pool / timeouts (`src/lib/mongodb.ts`): `maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`. The client promise is cached on `globalThis` to survive warm starts.
- Backups: enable Continuous Cloud Backup with PIT recovery. See `SETUP.md` → "MongoDB backup & restore" for retention defaults.

### Indexes the app expects (created lazily on first access)

Collection accessors in `src/lib/models/index.ts` call `createIndexes` the first time they run. You don't need to pre-create these, but knowing the shape helps with capacity planning.

- `cars` — `status`, `make+model`, `featured`, `price`, `year (desc)`, `status+createdAt (desc)`, `status+price`, `make+status`.
- `serviceAppointments` — `bookingReference (unique)`, `customerInfo.email`, `status`, `appointmentDate+status`, `status+createdAt (desc)`, `status+completedAt+reviewInviteSentAt`, plus partial-unique `appointmentDate+appointmentTime` scoped to `status in [pending, confirmed]` (slot uniqueness; cancelled bookings free the slot).
- `carViewingBookings` — same shape as service, plus `carId`, `carId+status`, and partial-unique `carId+appointmentDate+appointmentTime`.
- `reservations` — `reservationReference (unique)`, `carId`, `status`, `customerInfo.email`, `status+createdAt`, TTL on `expiresAt`, partial-unique on `carId` while status is `pending`/`confirmed` (one active reservation per car).
- `quotes` — `quoteReference (unique)`, `customerInfo.email`, `status`.
- `carParts` — `category`, `brand`, `condition`, `price`.
- `partExchanges` — `enquiryReference (unique)`, `status`, `customerInfo.email`, `status+createdAt`.
- `adminUsers` — `username (unique)`, `email (unique, sparse)`. A `reconcileAdminEmailIndex` helper drops-and-recreates if it finds an existing `email_1` index with different options.
- `auditLogs` — `createdAt (desc)`, `actor+createdAt`, `targetType+targetId`.
- `users` (NextAuth) — `email (unique)`. Other Auth.js collections (`accounts`, `sessions`, `verification_tokens`) are managed by the adapter.

## AWS S3 setup

- One bucket, region matches `AWS_REGION`. The S3 module hardcodes `cars/` and `parts/` as the only allowed object prefixes.
- IAM minimum permissions for the upload IAM user: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::<bucket>/cars/*` and `…/parts/*`. No bucket-level `ListBucket` required.
- Allowed content types are enforced in code: `image/jpeg`, `image/png`, `image/webp`, `image/avif`. Per-object cap is 10 MB; both the declared `Content-Length` and the signed URL bind it (`src/lib/utils/s3.ts`).
- CORS on the bucket — required because the browser PUTs directly to the presigned URL:
  - `AllowedOrigins`: your production and staging origins (e.g. `https://www.mmcleeds.co.uk`, preview deploy origins).
  - `AllowedMethods`: `PUT`, `GET`.
  - `AllowedHeaders`: `*` (or at minimum `Content-Type`, `Content-Length`).
  - `ExposeHeaders`: `ETag`.
- Public read: either make the bucket public for `cars/*` and `parts/*` or front it with CloudFront. CloudFront is preferred — set `CLOUDFRONT_DOMAIN` and `getPublicUrl()` rewrites accordingly.
- **`next.config.ts` `remotePatterns` must include** the S3 host pattern (`*.s3.*.amazonaws.com`, `s3.*.amazonaws.com`) and the CloudFront distribution (`**.cloudfront.net`). Adding a new bucket / distribution without updating the list silently breaks `<Image>` for those URLs.

## Vercel KV

- Provision via Vercel dashboard → Storage → KV. Connect to the project; Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
- Used by `createRateLimiter` (`src/lib/utils/rateLimit.ts`) and the featured-car cache (`src/lib/utils/featuredCarCache.ts`).
- Selection is automatic — when both env vars are present the KV backend runs; otherwise an in-memory map.
- TODO: confirm with developer whether any non-rate-limit features (other than `featuredCarCache`) depend on KV at runtime.

## Email

- Transport: SMTP via Nodemailer (`src/emails/send.ts`). Production requires `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` — the transporter factory throws under `NODE_ENV=production` otherwise.
- Dev uses an Ethereal test account; the preview URL is logged to console after each send.
- Templates: React Email components in `src/emails/` (BookingCancellation, CarViewingConfirmation, ServiceBookingConfirmation, ReservationConfirmation, QuoteConfirmation, PartExchangeConfirmation, ReviewInvite* per service type, MagicLinkSignIn, CustomerPasswordReset, PasswordReset, VerifyEmail).
- Magic-link customer sign-in shares the same SMTP_* vars (configured in `src/auth.ts`).
- Deliverability check: send a test booking from the public site, then verify in the SMTP provider's dashboard (sends, bounces, complaints). The `EMAIL_FROM` domain must be SPF/DKIM-verified at the provider.

## Cron

- One scheduled job declared in `vercel.json`: `/api/cron/review-invites`, runs daily at `0 10 * * *` UTC.
- Auth: `Authorization: Bearer ${CRON_SECRET}` — compared via constant-time SHA-256 (`timingSafeMatch` in `src/app/api/cron/review-invites/route.ts`). Missing `CRON_SECRET` returns 500.
- What it does: finds `serviceAppointments` and `carViewingBookings` with `status: "completed"` and `completedAt <= now - 24h` and `reviewInviteSentAt` not yet set; atomically claims each row, then sends the corresponding review-invite email. Roll-back on send failure so the next run retries. Batch limit 50 per invocation, `maxDuration = 60`.
- Verify it fires: Vercel dashboard → Crons tab → check last invocation status + logs. Manual smoke test: `curl -H "Authorization: Bearer $CRON_SECRET" https://<deploy>/api/cron/review-invites` returns a JSON summary `{ results: { sent, failed, skipped, … } }`.

## First-deploy checklist

Order matters — each step depends on the previous.

1. **Env vars.** In Vercel project settings, set every required var from §"Required environment variables" for Production (and Preview if applicable). Don't forget `CRON_SECRET` and `EMAIL_FROM` (these gate the boot validator). Leave Sentry vars empty for now if the Sentry project isn't provisioned yet — the SDK no-ops without a DSN.
2. **MongoDB.** Provision the Atlas cluster + DB user, set `MONGODB_URI` in Vercel. Allowlist Vercel's egress IPs (or `0.0.0.0/0`). Indexes auto-create on first access of each collection.
3. **S3 + CORS + IAM.** Create the bucket, attach the IAM policy, set the four CORS rules above, and add the bucket host to `next.config.ts:remotePatterns` if it isn't already matched. Set `AWS_*` and `S3_BUCKET_NAME` in Vercel.
4. **Vercel KV.** Provision KV; Vercel auto-injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`. Required for distributed rate limiting in prod.
5. **Deploy.** Push to `main` (or click "Deploy" on the Vercel dashboard). Confirm the build is green and the deployment URL loads the home page.
6. **Seed admin.** Set `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` in Vercel, then run `npm run setup-admin` against the production DB (locally with the prod `MONGODB_URI` in `.env.local`, or via Vercel CLI). Drop `ADMIN_PASSWORD` from Vercel once the admin can log in.
7. **Verify auth flows.** Log in at `/admin/login`; the dashboard at `/admin/dashboard` should load.
8. **Verify cron.** From the Vercel dashboard, trigger the cron once manually. Confirm `200` with a `success: true` JSON body.
9. **Smoke test (HANDOVER §7).** Home → `/BrowseFleet` → car detail → book a viewing → check confirmation email. Then admin: log in → add a car (uploading an image to S3) → mark a booking confirmed → check email + audit log entry.

## Common breaks

**500s appearing across the site**
- Check Vercel Function logs for the failing route. Most prod 500s in this codebase trace to:
  - `MONGODB_URI` unreachable or wrong (timeouts / `ECONNREFUSED`). Confirm Atlas IP allowlist still covers Vercel.
  - Boot validator throwing — typically `SESSION_SECRET`, `AUTH_SECRET`, `EMAIL_FROM`, or `CRON_SECRET` missing/invalid. Error message is explicit.
  - Sentry SDK misconfigured if `SENTRY_DSN` is set but `SENTRY_AUTH_TOKEN` is bad — `next build` warns but doesn't fail.

**Bookings disappear / can't be created**
- Slot-uniqueness indexes are partial: cancelling a booking re-opens its slot. If a customer reports a slot they expect to be free is unbookable, look for an in-flight `pending`/`confirmed` booking in `serviceAppointments` or `carViewingBookings` for that date/time.
- If `POST /api/bookings/viewing` returns 400 for everyone, check Turnstile — production verification is a hard 400 when `TURNSTILE_SECRET_KEY` is missing.
- If a car detail page shows a booking that doesn't appear in the admin list, the customer probably has a stale page — `revalidatePath` only fires from admin mutations.

**Emails not sending**
- Confirm `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` are all set in Vercel for the right environment.
- The send path is wrapped in `waitUntil` — a send failure won't 500 the API response. Check the function logs for `"Email sending failed"`.
- Check the SMTP provider's send/bounce log to distinguish "we didn't send" from "they rejected".
- If review-invite emails stop firing, check the cron's last invocation in the Vercel dashboard — `CRON_SECRET` mismatch returns 401, missing returns 500.

**Image uploads failing**
- The admin must have at least `manager` role (`hasMinimumRole("manager")` gate in `/api/admin/upload`).
- 413 = file over 10 MB. 400 = wrong content type or missing/invalid `contentLength`.
- 500 from `getSignedUrl` usually means missing `AWS_*` env vars or IAM permissions don't include `s3:PutObject`.
- Images uploading but not rendering: missing `remotePatterns` entry for the bucket / CloudFront host in `next.config.ts`. `<Image>` silently 404s for unmatched hosts.

**Admin login throws or 2FA broken**
- A first-time deploy can hit `IndexOptionsConflict` on `adminUsers.email`; `reconcileAdminEmailIndex` should auto-fix on next access. If it doesn't, drop the index manually in Atlas and let the next request recreate it.
- Lost 2FA — see `ADMIN_GUIDE.md` → "What to do when X breaks".

**Rate limit failing closed unexpectedly**
- If admins see "Too many login attempts" with no recent activity, Vercel KV is probably unreachable. Credential limiters (`failClosed: true`) deny by design during a KV outage. Check KV status in the Vercel dashboard.
