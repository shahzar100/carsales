# RUNBOOK.md — on-call response

> Developer / on-call response guide. Operator-facing guide is
> [OPERATIONS.md](./OPERATIONS.md); env + Sentry + backup details are in
> [SETUP.md](./SETUP.md).

## Ownership

| Resource | Account / location | Who has access |
|---|---|---|
| Domain | _(registrar — fill in)_ | _(name + email)_ |
| Vercel project (prod) | `carsales` org `_(slug)_` | _(name + email)_ |
| Vercel project (staging) | `carsales-staging` | _(name + email)_ |
| MongoDB Atlas | cluster `MMC-prod`, org `_(slug)_` | _(name + email)_ |
| AWS S3 | bucket `mmc-images-prod`, account `_(id)_` | _(name + email)_ |
| AWS CloudFront | distribution `_(id)_` | _(name + email)_ |
| SMTP / email | _(provider — Resend? SES? other?)_ | _(name + email)_ |
| Sentry | org `_(slug)_`, project `carsales` | _(name + email)_ |
| Turnstile | Cloudflare account `_(name)_` | _(name + email)_ |

Fill these in on handover. Anything blank is a thing nobody owns.

## Production URLs

- Customer site: `https://_(domain)_`
- Admin: `https://_(domain)_/admin/login`
- Status check (manual): `https://_(domain)_/api/admin/session`
  (200 / `{ isLoggedIn: false }` if MongoDB is reachable)

## Escalation

| Severity | Symptom | Response |
|---|---|---|
| **P0** | Customer site down (5xx from `/` or `/BrowseFleet`) | Page on-call within 5 min. Roll back the latest Vercel deploy: project → Deployments → previous → **Promote to Production**. |
| **P0** | Booking emails not sending | Check SMTP provider dashboard. Check Sentry for `email_send_failed` events. If SMTP is down, the booking still saved — recover by re-sending from admin. |
| **P1** | Admin can't sign in | Check `/api/admin/session` returns 200. Check MongoDB Atlas → Metrics for connection failures. If Mongo is reachable, check Sentry for `auth.login` errors. |
| **P1** | Images missing on car detail | Check S3 bucket → object exists at the path the DB row points to. Check `next.config.ts` `remotePatterns` covers the hostname. Check CSP `connect-src` if console shows a `Refused to connect` error. |
| **P2** | Slow dashboard | `getDashboardData.ts` reshapes whole collections in JS — under load it can take seconds. Day 11 Fix 11.1 (deferred) replaces this with Mongo aggregations. Workaround: reduce date range in the dashboard. |
| **P3** | One customer can't lookup their booking | They probably mistyped the email — the lookup is `customerInfo.email` match, case-insensitive. Look them up in Atlas → `serviceAppointments` or `carViewingBookings`. |

## Sentry triage

If wired (see [SETUP.md](./SETUP.md) → "Sentry"):

1. Open the project's **Issues** view, sort by **Last seen**.
2. For anything with `route: "..."` in extra, the failing endpoint is
   named explicitly. Grep `logError` in code for the route to find the
   handler.
3. For anything in `BrowseFleet/[_id].getCar`, check Mongo's ObjectId
   validity — most often the URL was hand-crafted.

PII is redacted via `src/lib/utils/observability.ts` `PII_KEYS` — if a
new sensitive field appears in extra, add it to that set.

## Common operations

### Roll back a deploy

```bash
gh deployment list --limit 10
# Pick the previous good deploy, then in the Vercel UI:
# Project → Deployments → that deploy → "Promote to Production"
```

### Restart MongoDB connection pool

Vercel re-uses the connection across requests. To force a clean pool,
trigger a redeploy:

```bash
git commit --allow-empty -m "chore: redeploy to refresh connection pool"
git push
```

### Reset the rate limiter

Bare-process rate limits (no Vercel KV configured) clear on redeploy.
With KV, delete the rate-limit keys:

```bash
# Connect to your KV instance; for Vercel KV:
vercel env pull
KV_REST_API_URL=... KV_REST_API_TOKEN=... \
  redis-cli del "rl:bookingLookup:_ip_"
```

### Run the admin bootstrap script

If the admin account is gone, bootstrap a new one against production:

```bash
# Get prod env locally
vercel env pull
# Bootstrap (ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD set in pulled .env)
npm run setup-admin
# Delete the password from .env right after
```

### Force-revoke all admin sessions

Rotate `SESSION_SECRET` in Vercel env. Every existing session cookie
becomes invalid on the next deploy. Communicate before doing this —
everyone signs out simultaneously.

## Cron jobs

The site has one scheduled job:

- `POST /api/cron/review-invites` — runs daily, sends review invites
  for bookings marked **completed** more than 24h ago. Authenticated
  with `Authorization: Bearer $CRON_SECRET` (set in Vercel project env).

To check it's running, look in Vercel → Crons → Logs.

## Storage

- **MongoDB** — `cars`, `serviceAppointments`, `carViewingBookings`,
  `shopInfo`, `adminUsers`, `quotes`, `carParts`, `reservations`,
  `partExchanges`, `detailingPackages`, `tintOptions`, `serviceOverviews`,
  `recoveryInfo`, `auditLogs`. Schemas in `src/lib/interfaces.ts`.
- **S3** — `cars/<id>/*.jpg`, `parts/<id>/*.jpg`. Use the admin upload
  endpoint, never write to S3 directly.
- **CloudFront** — optional CDN in front of S3. Cache invalidation is
  not automatic; if you upload a replacement image at the same key,
  invalidate the CloudFront path manually.

## Audit log

Every state-changing admin route should call `recordAudit()`
(`src/lib/utils/audit.ts`). The `auditLogs` collection is append-only
and indexed by `createdAt`, `actor + createdAt`, and `targetType +
targetId`. To investigate "who changed car X?":

```js
db.auditLogs.find({ targetType: "car", targetId: "<carId>" }).sort({ createdAt: -1 })
```

## Secrets

Full rotation cadence + ownership table is in [SETUP.md](./SETUP.md) →
"Secret rotation". TL;DR: rotate `SESSION_SECRET`, `CRON_SECRET`,
`AWS_SECRET_ACCESS_KEY`, and the Atlas DB user **quarterly**. Rotate on
incident if compromise is suspected.

## Known gotchas

- **`SESSION_SECRET` rotation logs everyone out** — do it during a quiet
  window and tell the team first.
- **MongoDB cluster pause** (Atlas free tier) — clusters auto-pause
  after inactivity. If the site has been quiet over a long weekend, the
  first request takes ~30s to wake up the cluster.
- **`featuredCar` cache** lives in module memory per Vercel instance.
  After admin sets a new featured car, the change is instant on the
  public site only after the cache TTL (5 min) or the next deploy. Day
  11 Fix 11.2 (deferred) moves this to KV so all instances see the
  invalidation immediately.
- **CloudFront caching** — images served via CloudFront cache for 24h
  by default. New uploads land at a new S3 key (the admin appends a
  timestamp) so this is usually fine, but manual S3 overwrites won't
  show up until you invalidate.
