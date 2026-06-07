# Smoke tests (against a deployed build)

The smoke suite (`e2e/smoke/`) verifies a **live deployment** — real endpoints,
real (or test) credentials, no local server and no fakes. It's the automated
version of the go-live checklist: it answers "does this actually work under the
configured accounts?".

It is **not** part of the default CI (`npm run test:e2e`) — that suite stays
hermetic. Run smoke explicitly or via the `Smoke` GitHub Action.

## Run it

```bash
# read-only subset (safe against production)
SMOKE_BASE_URL=https://www.example.com npm run test:smoke -- --grep @prod-safe

# full suite (use a STAGING deploy — see Turnstile note below)
SMOKE_BASE_URL=https://staging.example.com \
SMOKE_CUSTOMER_EMAIL=... SMOKE_CUSTOMER_PASSWORD=... \
SMOKE_ADMIN_USERNAME=... SMOKE_ADMIN_PASSWORD=... \
SMOKE_CRON_SECRET=... \
npm run test:smoke
```

Specs that need credentials **skip** when they're absent, so the `@prod-safe`
subset runs with just `SMOKE_BASE_URL`.

## What it checks

| Spec | Tag | Mutates? | Verifies |
|---|---|---|---|
| `up` | `@prod-safe` | no | key pages 200, no JS errors, **CSP header present** (middleware live) |
| `oauth-redirect` | `@prod-safe` | no | "Continue with Google" → Google with the right `client_id` + `redirect_uri` |
| `cron` (401) | `@prod-safe` | no | unauthenticated cron → 401 (proves `CRON_SECRET` is set) |
| `cron` (200) | — | sends email | configured secret → 200 (staging) |
| `session` | — | no | signed-in `/account` resolves, **no authjs `ClientFetchError`** (the AUTH_URL fix) |
| `booking` | — | writes booking + email | a signed-in customer can book a viewing (auth + Turnstile + send) |
| `admin` | — | login + presign | admin login, presign URL, existing image renders via `next/image` |

## The two caveats (by design)

- **Turnstile** — the booking spec sends a dummy token, which only passes when
  the target uses Cloudflare's **always-pass test keys**. So run the full suite
  against **staging** (test keys), and only the `@prod-safe` subset against
  production. A real production Turnstile challenge can't be auto-solved.
- **Email** — "send-only": the booking/cron specs confirm the app *dispatched*
  the email (HTTP 200), not that it landed in an inbox. For true delivery
  verification, point a real inbox service (e.g. Mailosaur) at it later.

## GitHub Action (`.github/workflows/smoke.yml`)

Triggers, tuned to stay well under the 2,000 free Actions minutes/month
(ubuntu only, npm + browser caching, chromium only, 10-min cap,
cancel-in-progress):

- **deployment_status** — on each successful deploy: full smoke for
  staging/preview URLs, `@prod-safe` for production URLs.
- **schedule** — daily `@prod-safe` smoke against `SMOKE_PROD_URL`.
- **workflow_dispatch** — manual: pick a URL + `full`/`prod-safe`.

> If you deploy previews very frequently, restrict the `deployment_status`
> trigger to a named staging environment (or drop it and rely on the daily +
> manual runs) to avoid burning minutes. For sub-daily uptime, use a free
> external monitor (UptimeRobot / Checkly) instead of Actions.

### Secrets to set (repo → Settings → Secrets → Actions)

| Secret | Used by |
|---|---|
| `SMOKE_PROD_URL` | the daily scheduled prod smoke |
| `SMOKE_CUSTOMER_EMAIL` / `SMOKE_CUSTOMER_PASSWORD` | session + booking (staging test customer) |
| `SMOKE_ADMIN_USERNAME` / `SMOKE_ADMIN_PASSWORD` | admin spec (staging test admin) |
| `SMOKE_CRON_SECRET` | cron 200 spec (staging) |

The staging credential secrets should point at **staging test accounts**, not
real ones.
