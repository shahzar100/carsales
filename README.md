# MMC Leeds (Morley Motor Company) — Used-Car Dealership Platform

The production website for **MMC Leeds**, a used-car dealership on Roseville Road, Leeds. It serves two audiences from one codebase:

- **Customers** browse the fleet, book viewings / detailing / tinting / repairs / recovery, request quotes and part-exchange valuations, buy car parts, register an account, and track their bookings.
- **Admin staff** manage inventory, bookings, reservations, quotes, part-exchanges, car parts, and all public business content from a dashboard at `/admin/dashboard`.

Built with **Next.js 16 (App Router)** on **React 19**, backed by **MongoDB Atlas**, and deployed on **Vercel**.

> **This is the single source of truth for setting the site up, running it, deploying it, operating the admin dashboard, and what it all costs.** Engineers extending the code should also read `CLAUDE.md` (the in-repo architecture/conventions manual).

---

## Table of contents

1. [Tech stack at a glance](#1-tech-stack-at-a-glance)
2. [Features in detail](#2-features-in-detail)
   - [Customer-facing](#21-customer-facing-features)
   - [Admin dashboard](#22-admin-dashboard-features)
   - [Platform / technical](#23-platform--technical-features)
3. [Packages used](#3-packages-used)
4. [Environment variables & keys](#4-environment-variables--keys)
5. [External services — setup & getting keys](#5-external-services--setup--getting-keys)
6. [Local development — step by step](#6-local-development--step-by-step)
7. [Deploying to Vercel — step by step](#7-deploying-to-vercel--step-by-step)
8. [Admin dashboard guide — step by step](#8-admin-dashboard-guide--step-by-step)
9. [Costs — free tiers & realistic totals](#9-costs--free-tiers--realistic-totals)
10. [Project structure](#10-project-structure)
11. [Scripts reference](#11-scripts-reference)
12. [Testing & CI](#12-testing--ci)
13. [Design system (brief)](#13-design-system-brief)
14. [For engineers](#14-for-engineers)

---

## 1. Tech stack at a glance

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2.6** (App Router, Turbopack) on **React 19.1** |
| Language | **TypeScript 5** (strict; `@/*` → `src/*`) |
| Styling | **Tailwind CSS 4** + design tokens in `src/app/globals.css` |
| Database | **MongoDB Atlas** via the native `mongodb` 6.x driver (no ORM); database name **`MMC`** |
| Admin auth | **iron-session 8** (cookie `carsales_admin_session`, `adminUsers` collection) |
| Customer auth | **NextAuth v5 / Auth.js** (JWT) with `@auth/mongodb-adapter` (`users` collection) |
| Email | **React Email 5** templates + **Nodemailer 7** (generic SMTP) |
| Image storage | **AWS S3** presigned uploads (`@aws-sdk/client-s3` + `s3-request-presigner`); optional CloudFront |
| Validation | **Zod 4** (env + every API payload) |
| Rate limiting | **Vercel KV / Upstash Redis** (falls back to in-memory) |
| Bot protection | **Cloudflare Turnstile** |
| Admin 2FA | **TOTP** via `otpauth` + `qrcode` |
| Animation / icons / charts | **Motion 12** · **lucide-react** · **Recharts** |
| Observability | **Sentry** (`@sentry/nextjs`, gated on a DSN) |
| Testing | **Jest 29** (jsdom + node/`mongodb-memory-server`) · **Playwright** · **jest-axe** |
| Runtime | **Node 22.x** |

There are **two completely independent auth systems** — iron-session for admin, NextAuth for customers. They share no cookie and no collection; neither can read the other's session. This is the single most important thing to understand about the codebase.

**MongoDB collections (15):** `cars`, `carViewingBookings`, `serviceAppointments`, `reservations`, `partExchanges`, `quotes`, `carParts`, `businessInfo`, `detailingPackages`, `tintOptions`, `serviceOverviews`, `recoveryInfo`, `adminUsers`, `users` (NextAuth), `auditLogs`.

---

## 2. Features in detail

### 2.1 Customer-facing features

**Home — `/`** (ISR 60s)
- Hero with the live **featured car** (drive-away price, mileage, fuel/doors/colour, "Available for viewing" pills, View Details + Book a viewing CTAs); collapses gracefully when nothing is featured.
- Animated hero stat cards (vehicles in stock, bookings, rating) from admin-managed business info.
- **Latest Arrivals** — the 6 most recently added cars.
- "Why choose us" feature cards with animated count-ups.
- `AutoDealer` JSON-LD for SEO.

**Browse Fleet — `/BrowseFleet`** (ISR 60s)
- Fully **server-side filtering** (`buildCarFilter`): free-text search (make/model/colour), make, price min/max, year min/max, mileage min/max, doors, colour, and multi-select **features** (`$all`). Filter facets are computed from the full dataset so they don't shrink as you narrow.
- **Sorting**: newest, price ↑/↓, mileage ↑, year newest.
- Real **pagination** (9/page, max 50) with shareable filter URLs (e.g. `/BrowseFleet?make=BMW&priceMax=20000`).
- Only `available` cars shown; "X of Y vehicles" counter, active-filter badges, clear button, empty state.

**Car detail — `/BrowseFleet/[id]`** (ISR 300s)
- Image **gallery**: main + thumbnails, prev/next arrows, keyboard navigation, counter, mobile swipe dots, fullscreen, animated transitions.
- Full specs, "What's included" feature chips, long description.
- **Save** (heart; localStorage + server for signed-in users) and **Share** (Facebook, Instagram, WhatsApp, Snapchat, X, LinkedIn, Pinterest, Email, copy-link).
- Sticky CTA card: drive-away price, **Book a viewing**, call/directions/enquiry tiles, trust band (HPI clear, warranty, AA inspection, 2 keys), and a dealer card with **live open/closed status** from admin hours.
- **Reserve this car** and **Part-exchange enquiry** forms (sign-in gated, only for `available` cars). Sold/Reserved cars are not bookable.
- Similar-cars rail, stock ref, mobile sticky price/book bar.
- SEO: `Vehicle` JSON-LD, breadcrumbs, and a **dynamic per-car OpenGraph image** (branded card with year/make/model/price/specs; static fallback on any error).

**Car viewing booking — `/Booking/[id]`** — *account required.* Multi-step: date + time slot (hourly 09:00–18:00, lunch excluded) → contact details (email locked to account) → review + Turnstile. Produces a `BK-XXXXXX` reference and a confirmation email.

**Service booking flow — `/Book`** — *account required.* 5-step wizard (supports `?service=detailing|tints|repairs` prefill):
1. Pick service (Detailing / Window Tints / Repairs).
2. Pick a package — detailing packages & tint options come live from the DB; repair sub-services are Engine / Brakes / Electrical / Transmission / General Service & MOT.
3. Vehicle make/model/year/registration + notes.
4. **Book a slot** (date + time) **or Get a quote** (no date — written quote within 1 business day).
5. Contact details + summary + Turnstile. Booking → `BK-` reference; quote → `QT-` reference.

**Service marketing pages** — `/Services` (hub, ISR 3600s), `/Services/Detailing`, `/Services/Tints` (incl. VLT legal guide), `/Services/Repairs`, and **`/Recoveries`** (24/7 breakdown recovery). All driven by admin-managed content with `Service` JSON-LD where relevant.

**Car Parts shop — `/CarParts`** (ISR 300s) — browse parts with client-side filters (brand, category, condition: New/Used/Refurbished). Each part shows image, condition badge, compatibility, stock, price. "Reserve Part" routes to a pre-filled contact page (reserve online, complete in person — no online checkout).

**Part-exchange valuation** — form on the car detail page (account required): registration, make/model/year, mileage, condition, service history, notes → indicative valuation within 24h with an enquiry reference.

**Booking lookup / tracking — `/Booking/lookup`** — look up any booking or quote by **reference + the email used** (+ Turnstile). Shows details, status badge, vehicle/service info, and cancellation reason if cancelled. Deep-linkable via `?ref=`; also in the header as "Track Booking". Customers can cancel their own service/viewing bookings.

**Customer accounts (NextAuth v5)**
- **Register** (`/register`) — email + password (bcrypt), Google, or magic link; auto sign-in.
- **Login** (`/login`) — three routes to one session: email+password, **passwordless magic link**, **Google OAuth**.
- **Forgot / reset password** — SHA-256-hashed token, 1h expiry, enumeration-safe, fail-closed.
- **Soft email verification** — non-blocking dashboard nudge; OAuth/magic-link users pre-verified.
- **Account dashboard** (`/account`, tabbed): **Saved cars** (synced across devices), **Upcoming** & **History** (viewings, services, reservations matched by email), **Settings** (display name, set/change password, delete account).
- **Saved cars page** (`/saved`); heart toggles work site-wide.

**Informational** — `/contact`, `/FAQ` (accordion with live business details), `/AboutUs` (live stats), `/privacy`, `/terms`, plus **`/review`** (reached from review-invite emails; links to leave a Google review).

**Site-wide** — brand-filtered header nav + search, floating context-aware **WhatsApp button**, cookie banner, toast notifications, skeleton loaders, animated page transitions.

### 2.2 Admin dashboard features

Lives under `/admin/dashboard/*`, guarded server-side (redirect to `/admin/login`). Role hierarchy **`staff (1) < manager (2) < admin (3)`** enforced by `hasMinimumRole()`. (Full step-by-step usage is in [§8](#8-admin-dashboard-guide--step-by-step).)

- **Login & 2FA** — username + password with an optional **TOTP** step; rate-limited and fail-closed.
- **Overview** (`/admin/dashboard`) — KPI cards (cars + value, bookings, viewings, completed, pending, admins) and lazy-loaded **Recharts** (bookings by month/day, inventory by fuel/status, service breakdown, price distribution, popular cars), date-range selector, upcoming appointments, recent activity.
- **Cars** (`/cars`) — table/card/list views, edit, delete (with photo cleanup), status & featured toggles, **CSV export**, and create via "Create New" with **S3 image upload** (10 MB cap, content-type bound). Writes revalidate the public pages.
- **Car Parts** (`/carparts`) — create/edit/delete parts (server-component + client-island pattern).
- **Service appointments** (`/service`) & **Viewing bookings** (`/viewing`) — searchable tables; confirm (emails the customer once), complete, cancel (reason ≥10 chars, emailed). CSV export.
- **Reservations** (`/reservations`) — confirm/cancel deposits; pending ones auto-expire after 48h via a MongoDB TTL index.
- **Quotes** (`/quotes`) & **Part-exchange** (`/part-exchange`) — status workflows; record response/valuation notes.
- **Business / Shop settings** (`/shop`) — one form editing the five business collections (core info, hours, social, hero stats, detailing packages, tint options, service overviews, recovery info); feeds every public page.
- **Audit log** (`/audit`, **admin-only**) — immutable who-did-what, filterable by actor/action/target, cursor-paginated.
- **System status** (`/status`) — live MongoDB / SMTP / memory / env / server health.
- **Account** (`/account`) — enrol/disable TOTP 2FA.
- **Admin user management** (API-backed) — create users with a role (+ setup email); admin-only password resets.

### 2.3 Platform / technical features

- **SEO** — dynamic `sitemap.ts` (static pages + every available car), `robots.ts` (blocks `/admin`, `/api`, `/Booking`), XSS-escaped JSON-LD (`AutoDealer`, `Service`, `Vehicle`, `BreadcrumbList`), static + **dynamic per-car OpenGraph/Twitter images** (`next/og`), per-page metadata/canonicals, `noindex` on booking/account/admin.
- **Security** — edge middleware (`proxy.ts`) with CSRF protection + **per-request CSP nonce** (`script-src 'nonce-…' 'strict-dynamic'`, no `unsafe-inline` for scripts) plus a stricter report-only mirror → `/api/csp-report`; hardened response headers (`X-Frame-Options: DENY`, HSTS preload, Permissions-Policy, COOP/CORP); Turnstile on all public forms; Zod validation on every route; presigned-and-bounded S3 uploads.
- **Rate limiting** — KV-backed when configured; credential-guarding limiters (login, password reset, 2FA, magic link) **fail closed**.
- **Email** — React Email templates via Nodemailer (SMTP in prod, Ethereal in dev): booking/viewing/reservation/quote/part-exchange confirmations, cancellation, password resets, magic link, verify-email, and **six review-invite variants**.
- **Background cron** (`/api/cron/review-invites`, daily **10:00 UTC**, Vercel Cron, bearer-auth via `CRON_SECRET` with a constant-time compare) — sends a review-invite email for bookings completed ≥24h ago; at-most-once via an atomic claim-then-send (batch 50).
- **Observability** — `logError` / `logEvent` always log PII-redacted structured output to console, and forward to **Sentry** when a DSN is set (`@sentry/nextjs` is installed and wired via `sentry.{client,server,edge}.config.ts` + `next.config.ts`).
- **Health** — public `/api/health` (DB + KV probe, uptime/memory/region, 200/503) for uptime monitors; auth-gated `/api/admin/health` for the Status dashboard.
- **Caching** — per-page ISR; admin mutations call `revalidatePath` for instant invalidation; a distributed featured-car cache; business info wrapped in `React.cache` (one set of Mongo reads per request).

---

## 3. Packages used

Versions are from `package.json` (`npm ci` installs exact locked versions). Run `npm ci`, never `npm install`, for reproducible installs.

### Runtime dependencies

| Package | Purpose |
|---|---|
| `next` 16.2.6 | App Router framework (Turbopack) |
| `react` / `react-dom` 19.1 | UI runtime |
| `mongodb` 6.x | Native MongoDB driver (no ORM) |
| `next-auth` v5 (beta) + `@auth/mongodb-adapter` | Customer authentication (JWT) |
| `iron-session` 8 | Admin session cookies |
| `bcryptjs` | Password hashing (cost 12) |
| `otpauth` + `qrcode` + `@types/qrcode` | Admin TOTP two-factor |
| `zod` 4 | Env + payload validation |
| `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | S3 presigned image uploads |
| `react-email` + `@react-email/components` | Email templates |
| `nodemailer` 7 | SMTP transport |
| `@sentry/nextjs` 10 | Error/observability (gated on DSN) |
| `@vercel/functions` | `waitUntil`, `ipAddress` helpers |
| `tailwindcss` 4 + `@tailwindcss/postcss` + `postcss` | Styling |
| `motion` 12 | Animations |
| `lucide-react` | Icons |
| `recharts` 3 | Admin dashboard charts |
| `uuid` | ID generation |
| `server-only` | Guards server-only modules |

### Key dev dependencies

| Package | Purpose |
|---|---|
| `typescript` 5 + `@types/*` | Types / `tsc --noEmit` |
| `eslint` 9 + `eslint-config-next` + `@eslint/eslintrc` | Linting |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting |
| `jest` 29 + `ts-jest` + `jest-environment-jsdom` / `-node` | Unit/component & API tests |
| `@testing-library/{react,dom,jest-dom,user-event}` | Component testing |
| `jest-axe` + `@axe-core/playwright` | Accessibility tests |
| `mongodb-memory-server` | In-memory Mongo for API tests |
| `@playwright/test` | End-to-end tests |
| `husky` + `lint-staged` | Pre-commit (eslint + type-check) |
| `size-limit` + `@size-limit/preset-app` | Bundle-size budget |
| `@react-email/preview-server` | `npm run email` preview |

---

## 4. Environment variables & keys

Every server variable is validated at boot by `src/lib/env.ts` (Zod). Copy `.env.example` → `.env.local` and fill it in. **How "required" works:**

- A bare `next build` / dev boot only hard-fails on **`MONGODB_URI`** (must start with `mongodb://` or `mongodb+srv://`).
- A second guard runs only at **production runtime** (`NODE_ENV=production`, not during `next build`) and throws if **`SESSION_SECRET`**, **`AUTH_SECRET`**, **`CRON_SECRET`**, or a real **`EMAIL_FROM`** (not the placeholder) are missing.
- So **build time needs only `MONGODB_URI`**; the prod secrets are enforced at server boot.

Legend: **yes** = boot fails without it · **prod** = enforced at production boot · **prod-fn** = not boot-enforced, but the feature breaks in prod without it · **optional** = safe to omit.

### Database
| Variable | Req | Purpose |
|---|---|---|
| `MONGODB_URI` | **yes** | Atlas connection string. **Must include the `MMC` database** in the path (the model layer hardcodes `client.db("MMC")`). Needed at build (page-data collection) and runtime. |

### Sessions / Auth
| Variable | Req | Purpose |
|---|---|---|
| `SESSION_SECRET` | **prod** (≥32 chars) | iron-session signing key (admin). Dev uses a per-process random fallback. |
| `AUTH_SECRET` | **prod** | NextAuth JWT signing key (customer). Generate with `npx auth secret`. |
| `AUTH_GOOGLE_ID` | optional | Google OAuth client ID. Unset → Google button hidden. |
| `AUTH_GOOGLE_SECRET` | optional | Google OAuth client secret. |

### Email / SMTP
| Variable | Req | Purpose |
|---|---|---|
| `SMTP_HOST` | **prod-fn** | SMTP host. `send.ts` throws in prod if host/user/pass aren't all set. Dev uses an auto Ethereal account (preview URL logged). |
| `SMTP_PORT` | optional | Defaults to `587`. |
| `SMTP_USER` / `SMTP_PASS` | **prod-fn** | SMTP credentials (often `user=apikey`, `pass=<API key>`). |
| `EMAIL_FROM` | **prod** | From address. Placeholder `noreply@yourdomain.com` is rejected in prod. Must be SPF/DKIM-verified. |
| `EMAIL_FROM_NAME` | optional | From display name (default `MMC Leeds`). |

### AWS / S3
| Variable | Req | Purpose |
|---|---|---|
| `AWS_REGION` | **prod-fn** | Bucket region (e.g. `eu-west-2`). |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | **prod-fn** | IAM credentials for presigned uploads. |
| `S3_BUCKET_NAME` | **prod-fn** | Upload bucket. Without these four, `/api/admin/upload` throws. |
| `CLOUDFRONT_DOMAIN` | optional | Serve images via CloudFront instead of raw S3 URLs. |

### Cron
| Variable | Req | Purpose |
|---|---|---|
| `CRON_SECRET` | **prod** | Bearer token Vercel sends to cron routes (constant-time SHA-256 compared). Mismatch → 401; missing in prod → boot fails. |

### Admin bootstrap (consumed once by `npm run setup-admin`)
| Variable | Req | Purpose |
|---|---|---|
| `ADMIN_USERNAME` | optional | First admin username (default `admin`). |
| `ADMIN_EMAIL` | optional | First admin email. |
| `ADMIN_PASSWORD` | required to run script | Plaintext, ≥8 chars; bcrypt-hashed into `adminUsers`. Drop after seeding. |

### Rate limiting / Vercel KV
| Variable | Req | Purpose |
|---|---|---|
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | **prod-fn** | Upstash/Vercel KV REST creds. Without both, rate limits are per-warm-Lambda (effectively none under autoscaling). |

### Bot protection / Turnstile
| Variable | Req | Purpose |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional (rec. prod) | Turnstile site key. Unset → widget hidden. |
| `TURNSTILE_SECRET_KEY` | optional (rec. prod) | Turnstile secret. Unset → no-op in dev but **hard-400 in prod**. |

### Observability / Sentry
| Variable | Req | Purpose |
|---|---|---|
| `SENTRY_DSN` | optional | Server DSN. Unset → SDK no-ops, redacted console only. |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Client DSN (same value as `SENTRY_DSN`). |
| `SENTRY_AUTH_TOKEN` | optional | Enables source-map upload at build. |
| `SENTRY_ORG` / `SENTRY_PROJECT` | optional | Slugs for source-map upload. |

### Public (`NEXT_PUBLIC_*`, inlined into the browser bundle — no secrets)
| Variable | Req | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical site URL (metadata/SEO). |
| `NEXT_PUBLIC_APP_URL` | optional | App base URL. |
| `NEXT_PUBLIC_BASE_URL` | optional | Base URL for review-invite links — **set in prod** so emails link correctly. |
| `NEXT_PUBLIC_BUSINESS_NAME` | optional | Display name (default `MMC Leeds`). |

> In production, set all three public URL vars to your real `https://` domain and **redeploy** (they're baked in at build time).

---

## 5. External services — setup & getting keys

### Generate your secrets first
```bash
# SESSION_SECRET and CRON_SECRET (run twice for two different values)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# AUTH_SECRET
npx auth secret
```
These are server-only — never put them in `NEXT_PUBLIC_*`.

### MongoDB Atlas (database)
1. Create an account at <https://www.mongodb.com/cloud/atlas> and a cluster (M0 free is fine to start).
2. **Database Access** → add a user with read/write on the `MMC` database.
3. **Network Access** → allow Vercel's egress (or `0.0.0.0/0` if acceptable). **The Vercel build sandbox must reach Atlas** — `next build` queries the DB.
4. **Connect → Drivers** → copy the string and append `/MMC`:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/MMC?retryWrites=true&w=majority
   ```
   URL-encode special characters in the password. → **`MONGODB_URI`**.
5. Recommended: enable Continuous Backup. Indexes are created lazily on first access — no manual step.

### AWS S3 + IAM (admin image upload)
1. Create a bucket in your region → **`S3_BUCKET_NAME`** + **`AWS_REGION`**. Code writes only under `cars/` and `parts/`.
2. Create an **IAM user** (programmatic) with least-privilege:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": ["arn:aws:s3:::<bucket>/cars/*", "arn:aws:s3:::<bucket>/parts/*"]
     }]
   }
   ```
   Access key → **`AWS_ACCESS_KEY_ID`** / **`AWS_SECRET_ACCESS_KEY`**.
3. **Upload limits enforced in code** (`s3.ts`): types `image/jpeg|png|webp|avif`, max **10 MB**; presigned URL binds Content-Type + Content-Length and expires in 300s.
4. **Bucket CORS** (browser PUTs directly):
   ```json
   [{ "AllowedOrigins": ["https://your-domain"], "AllowedMethods": ["PUT","GET"],
      "AllowedHeaders": ["*"], "ExposeHeaders": ["ETag"] }]
   ```
5. **Public read**: either make `cars/*` and `parts/*` public, or (preferred) front with **CloudFront** and set **`CLOUDFRONT_DOMAIN`**.
6. **`next.config.ts` `remotePatterns`** must match wherever images are served. Already covered: `**.cloudfront.net`, `*.s3.*.amazonaws.com`, `s3.*.amazonaws.com`. A new bucket/CDN host that doesn't match means editing that list, or `<Image>` silently 404s.

### Google OAuth (optional customer sign-in)
1. <https://console.cloud.google.com/apis/credentials> → create an **OAuth 2.0 Client ID** (Web application).
2. Authorized redirect URI: `<site-url>/api/auth/callback/google` (+ the `http://localhost:3000/...` variant for dev).
3. Client ID → **`AUTH_GOOGLE_ID`**, secret → **`AUTH_GOOGLE_SECRET`**. Leave blank to disable the button.

### SMTP / transactional email (Nodemailer — generic SMTP, not an SDK)
Pick a provider, get SMTP creds, map to `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`, and set a verified `EMAIL_FROM`:

| Provider | Host | User | Pass |
|---|---|---|---|
| **Resend** (recommended — native React Email fit) | `smtp.resend.com` | `resend` | API key |
| SendGrid | `smtp.sendgrid.net` | `apikey` | API key |
| AWS SES | regional SMTP endpoint | SES SMTP user | SES SMTP pass |
| Mailgun | `smtp.mailgun.org` | domain SMTP user | SMTP pass |
| Gmail (quick start only) | `smtp.gmail.com` | address | App Password |

Dev: leave `SMTP_*` empty → Ethereal preview link logged to the console.

### Cloudflare Turnstile (bot protection)
1. <https://dash.cloudflare.com> → **Turnstile** → add a site (one widget per environment).
2. Site Key → **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`**, Secret Key → **`TURNSTILE_SECRET_KEY`**.
3. Set **both** in prod, or public forms hard-400.

### Vercel KV / Upstash Redis (rate limiting)
1. Vercel → **Storage → KV** (Upstash Redis) → connect to the project; `KV_REST_API_URL` / `KV_REST_API_TOKEN` are injected automatically. (Or create an Upstash Redis DB and copy its REST URL/token.)
2. Mandatory in prod for real rate limiting (credential limiters fail closed during a KV outage).

### Sentry (already installed & wired)
1. <https://sentry.io> → create a Next.js project → copy the **DSN**.
2. Set **`SENTRY_DSN`** and **`NEXT_PUBLIC_SENTRY_DSN`** to that DSN.
3. Optional for symbolicated traces: **`SENTRY_AUTH_TOKEN`**, **`SENTRY_ORG`**, **`SENTRY_PROJECT`**.
4. Leaving all Sentry vars empty is a safe no-op.

---

## 6. Local development — step by step

**Prerequisites:** Node **22.x**, a MongoDB you can reach (Atlas, or local `mongod` at `mongodb://localhost:27017/MMC`).

```bash
git clone <repo-url> carsales && cd carsales
npm ci                       # exact locked install
cp .env.example .env.local   # then fill in at least MONGODB_URI
npm run setup-admin          # seed the first admin (needs ADMIN_PASSWORD in .env.local)
npm run dev                  # http://localhost:3000
```

- Admin login: `http://localhost:3000/admin/login`.
- For local dev you can leave most optional services blank — email falls back to Ethereal, Turnstile and rate limiting no-op, Sentry stays off.
- Useful checks before pushing: `npm run type-check`, `npm run lint`, `npm test`.
- Preview emails: `npm run email`.

---

## 7. Deploying to Vercel — step by step

> Order matters. `next build` needs only `MONGODB_URI`, but the production **server** refuses to boot without `SESSION_SECRET`, `AUTH_SECRET`, `CRON_SECRET`, and a real `EMAIL_FROM`.

1. **Import the repo.** Vercel → **Add New → Project** → import `carsales`. Framework auto-detects Next.js. Ensure **Node 22.x**.
2. **Build settings.** Defaults are correct (`npm ci` install, `next build`).
3. **Environment variables** (Settings → Environment Variables) — add the values from [§4](#4-environment-variables--keys):
   - **Production:** all required + prod secrets, `SMTP_*`, `AWS_*` + `S3_BUCKET_NAME`, KV vars, Turnstile keys, and `NEXT_PUBLIC_*` pointing at the prod domain.
   - **Preview:** mirror prod with staging creds. Preview runs `NODE_ENV=production`, so it also needs the four prod secrets to boot.
   - `NEXT_PUBLIC_*` are inlined at build — set before building and redeploy after changes.
   - **Provision KV** here (Storage → KV → connect).
4. **Atlas reachability.** Confirm Network Access allows Vercel's build + runtime egress, or the build fails at page-data collection with `ECONNREFUSED`/timeouts.
5. **First deploy.** Push to the production branch (or click Deploy); wait for green and load the home page.
6. **Vercel Cron.** `vercel.json` declares one cron, picked up automatically:
   - `/api/cron/review-invites` — `0 10 * * *`
   It needs `CRON_SECRET`. Verify in **Dashboard → Crons**. Manual smoke test:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://<deploy>/api/cron/review-invites
   ```
7. **Seed the first admin** (no UI for it). Locally, put the **production** `MONGODB_URI` + `ADMIN_USERNAME/EMAIL/PASSWORD` in `.env.local`, run `npm run setup-admin`, then remove `ADMIN_PASSWORD`. Log in at `/admin/login`.
8. **Custom domain.** Settings → Domains → add + follow DNS; TLS is automatic. Then update `NEXT_PUBLIC_*` URLs, the Google OAuth redirect URI, S3 CORS origins, and Turnstile hostnames to the final domain — and **redeploy**.
9. **Smoke test.** Customer: Home → BrowseFleet → car detail → book a viewing → confirmation email. Admin: log in → add a car with an image (exercises S3) → confirm a booking → check the email + an `auditLogs` entry. Confirm the cron ran and KV is connected.

---

## 8. Admin dashboard guide — step by step

Plain-English guide for staff. The dashboard is at **`/admin/login`** → **`/admin/dashboard`**. Where it says "ask the developer," that's a database/hosting job, not an on-screen one.

### 8.1 First admin & logging in
There is **no public sign-up**. The very first admin is created once by the developer:
```bash
# set ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD (≥8 chars) in .env.local, then:
npm run setup-admin
```
This creates one **admin**-role account (safe to re-run). Then sign in at `/admin/login`.
- Sessions last **24 hours**.
- After ~5 failed attempts the system pauses logins briefly — wait and retry.
- First thing: turn on 2FA (below) and create named accounts per staff member (shared logins make the audit log useless).

### 8.2 Roles — who can do what

| Role | In short | Can… |
|---|---|---|
| **Staff** | View-only | See everything; manage only their own account security |
| **Manager** | Day-to-day operator | + add/edit/delete cars & parts, upload photos, confirm/cancel bookings, manage reservations/quotes/part-ex, edit business settings, create users |
| **Admin** | The boss | + reset other people's passwords, view the audit log |

Nuance: **creating** a new colleague is manager+, but **resetting an existing colleague's password** is admin-only.

### 8.3 Two-factor authentication & password resets
**Enable 2FA:** Account (`/admin/dashboard/account`) → **Enable 2FA** → scan the QR with an authenticator app (or use "show secret") → enter the 6-digit code → **Verify and enable**. From then on, login asks for the code after your password.
**Disable 2FA:** Account → Disable 2FA → confirm with your current password.
**Lost phone:** a password reset does **not** clear 2FA — ask the developer to remove it, then re-enrol.
**Reset a colleague's password (admin):** Create New (`/admin/dashboard/add`) → Type **Password** → **Reset Password** → look up by username/email → submit. They get a reset link (expires 1h). Passwords are never shown — only a link is emailed.

### 8.4 Each area, step by step
**Cars (`/cars`)** — *Add:* Create New → Type **Car** → step through Basic info → Pricing & mileage → Specs → **Photos** (first = main image, up to 10, wait for each upload to hit 100%) → Review → set Status (Available/Sold/Reserved) & optional Featured → **Add Car**. *Edit:* row Actions → Edit. *Sold/Reserved:* edit Status (Sold drops it from public lists immediately). *Feature:* click the star on a row. *Delete:* Actions → Delete (photos cleaned up automatically). **Export CSV** at the top. Photo uploads need Manager+; allowed JPEG/PNG/WebP/AVIF ≤10 MB.

**Car Parts (`/carparts`)** — Add Part (name, brand, category, price, condition, optional compatibility/description/image, In-Stock toggle); edit via pencil; remove via bin (permanent). Manager+ to change.

**Viewing bookings (`/viewing`) & Service appointments (`/service`)** — *Confirm:* click Confirm → status confirmed + the customer is emailed. *Cancel:* enter a reason (≥10 chars) → emailed to the customer; slot re-opens. *Complete* (service): mark completed after the job → a review-invite email goes out automatically 24h later (once per booking). Manager+ to change; both have search + CSV export.

**Reservations (`/reservations`)** — Confirm (usually when the deposit is taken in person) or Cancel. **Pending reservations auto-expire after 48h** via a MongoDB TTL index.

**Quotes (`/quotes`)** — pending → responded → accepted (or expired). **Part-Exchange (`/part-exchange`)** — pending → valued → accepted/declined (record the valuation amount). Both Manager+.

**Business Info (`/shop`)** — one form, collapsible sections: Business information, Hours, Social media, Homepage stats, Detailing packages, Tint options, Service overviews, Breakdown recovery. **Save** writes everything together and refreshes the public pages. Required: name, address, city, phone, valid email; Maps link must be `https://`.

**Audit log (`/audit`, admin-only)** — full history (cars, parts, bookings, reservations, quotes, part-ex, users, 2FA, business settings); filter by actor/action/target.

**Account (`/account`)** — your 2FA panel. **System Status (`/status`)** — live DB/SMTP/memory/env health; auto-refreshes every 30s; check it first when something seems broken.

### 8.5 Common workflows
- **Morning:** glance at Status → clear overnight **pending** viewings/services (confirm or cancel-with-reason) → check reservations/quotes/part-ex.
- **A car sold:** Cars → Edit → Status **Sold** → unfeature it and feature another → mark any related booking completed/cancelled.
- **Service finished:** Service → set **completed** → review invite auto-sends next day.
- **Bank-holiday hours:** Business Info → Hours → edit → **Save** (remember to revert after).
- **Add a colleague (manager+):** Create New → Type **User** → username + email + role → they get a "set your password" email.
- **Customer didn't get an email:** check Status (SMTP) → verify the email address on the booking → ask them to check spam → if all good, ask the developer to check the provider's send log.

> Customers manage their own accounts on the public site; there's no admin screen to edit an individual customer — that's a developer/database task.

---

## 9. Costs — free tiers & realistic totals

> **List prices in USD, verified late May 2026.** Cloud pricing changes often and varies by region — **re-verify each provider's pricing page before budgeting.** Figures assume a single small dealership with low-to-moderate traffic and email volume in the hundreds–low-thousands/month.

### Per-service breakdown

| Service | Free tier / allowance | When you pay | Paid entry | Notes |
|---|---|---|---|---|
| **Vercel** (hosting) | Hobby: free (100 GB transfer, 1M invocations) | Hobby is non-commercial; a real business should be on **Pro** | **$20/seat/mo** (incl. $20 usage credit, 1 TB transfer) | Low-traffic site fits inside Pro's included usage |
| **MongoDB Atlas** | **M0**: free forever (5 GB) | Outgrow 5 GB / want backups & no throttling | **Flex ~$8–30/mo** (capped $30); **M10 ~$57/mo** | **Flex is the sweet spot** for a dealership |
| **AWS S3** (+ optional CloudFront) | 100 GB/mo egress always-free; new-account credits | Storage/requests beyond free (tiny here) | ~$0.023/GB-mo + per-request pennies | Realistic bill **~$0–3/mo**; CloudFront zeroes egress |
| **Vercel KV / Upstash** | Free: 256 MB, **500k commands/mo** | Exceed 500k cmds (unlikely) | $0.20/100k, or fixed from $10/mo | Rate-limit volume is tiny → **free is plenty** |
| **Cloudflare Turnstile** | Free (unlimited, 20 widgets) | Enterprise bot mgmt only | n/a | **Free** for this use |
| **Google OAuth** | Free | n/a for sign-in | n/a | $0 |
| **Transactional email** | Resend **3,000/mo** free; SES via credits | Exceed free / want custom domain | Resend $20 (50k); **SES $0.10/1,000** | Free tier likely covers all volume |
| **Sentry** | Developer: free (5k errors/mo, 1 user) | >1 user or >5k errors/mo | **Team $26/mo** | Free tier fits a single-maintainer site |
| **Domain** | — (always paid) | Always (annual) | **~$10–15/yr** (`.com`); `.co.uk` often cheaper | Use an at-cost registrar |

### Scenario 1 — Lean / free-tier launch
Vercel Hobby* $0 · Atlas M0 $0 · S3 ~$0–2 · KV $0 · Turnstile $0 · Google $0 · Email (Resend free) $0 · Sentry Developer $0 · Domain ~$1/mo
**≈ $0–2 / month + ~$12/yr domain.**
\* Vercel Hobby is non-commercial; a *truthful* lean total for a live business is **~$21/mo** (add Vercel Pro). Everything else genuinely runs at $0.

### Scenario 2 — Comfortable production
Vercel Pro $20 · Atlas Flex (budget $30) · S3 ~$1–3 · KV $0–2 · Turnstile $0 · Google $0 · Email $0–20 (SES ~free, or Resend Pro $20) · Sentry Team $26 · Domain ~$1/mo
**≈ $76–100 / month** (~$78 if email stays on SES/free; ~$100 with Resend Pro + Atlas at the cap).

### Recommendation
1. **Start at ≈ $20/mo + ~$12/yr domain:** Vercel **Pro** (day one — required for commercial use), Atlas **M0** to launch (move to **Flex** before you depend on it for real bookings — Flex's $30 cap buys backups + no throttling), S3 (pennies), KV/Turnstile/Google free, email on **Resend free**, Sentry **Developer** free.
2. **Upgrade cadence:** Atlas M0 → **Flex** first (durability), then email free → paid (volume), then Sentry → **Team** (team size / >5k errors), and only **Atlas M10 (~$57)** if you genuinely need dedicated compute/VPC.

**Bottom line:** roughly **$20/month at launch**, rising to **~$75–100/month** for a comfortable production setup, plus ~$10–15/year for the domain.

---

## 10. Project structure

```
src/
├── app/
│   ├── (main)/        Public site (home, BrowseFleet, Book, Booking, Services,
│   │                  Recoveries, CarParts, account, login/register, contact,
│   │                  FAQ, AboutUs, review, saved, privacy, terms)
│   ├── (admin)/       Admin dashboard + admin login/reset (own layout)
│   ├── api/           Route handlers (cars, carparts, bookings, account, admin,
│   │                  auth, businessinfo, cron, health, csp-report, about)
│   ├── globals.css    Design tokens + semantic utility classes
│   ├── sitemap.ts robots.ts opengraph-image.tsx twitter-image.tsx
│   └── layout.tsx error.tsx global-error.tsx not-found.tsx
├── auth.ts            NextAuth v5 (customer auth)
├── proxy.ts           Edge middleware (CSRF + per-request CSP nonce)
├── instrumentation.ts Boots env validation
├── components/        Account, Admin, Booking, Car, CarParts, Services, Shared, …
├── emails/            React Email templates + send.ts (Nodemailer)
├── hooks/  contexts/  types/
└── lib/
    ├── env.ts mongodb.ts interfaces.ts constants.ts
    ├── models/        Collection accessors + serializeDocument
    └── utils/         auth, customerAuth, booking, bookingSlots, businessInfo,
                       buildCarFilter, rateLimit, turnstile, twoFactor, s3,
                       observability, reviewInvite, featuredCarCache, …
sentry.{client,server,edge}.config.ts   next.config.ts   vercel.json
scripts/   __tests__/   e2e/   .github/   public/
```

---

## 11. Scripts reference

| Script | Purpose |
|---|---|
| `npm ci` | Reproducible install from the lockfile |
| `npm run dev` | Dev server (Turbopack) on `:3000` |
| `npm run build` / `npm start` | Production build / serve (build needs a reachable `MONGODB_URI`) |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Jest **component/jsdom** suite |
| `npx jest --config jest.config.api.js` | Jest **API/node** suite (in-memory Mongo) |
| `npm run test:e2e` | Playwright (run `npx playwright install` once) |
| `npm run setup-admin` | Seed the first admin from env |
| `npm run migrate:business-info` | One-off business-info migration |
| `npm run email` | React Email preview server |
| `npm run size` | Bundle-size budget check |

---

## 12. Testing & CI

- **Two Jest configs.** `npm test` runs the **jsdom component/unit** suite. The **API/integration** suite (node env + `mongodb-memory-server`) runs via `npx jest --config jest.config.api.js`. CI runs **both**.
- **CI** (`.github/workflows/ci.yml`) runs lint, type-check, and both suites on every push to `main` and every PR. A separate workflow enforces the bundle-size budget.
- **Pre-commit** (husky + lint-staged): ESLint (`--max-warnings=0`) + `tsc --noEmit` on staged files.
- **E2E**: Playwright specs in `e2e/` (install browsers first).
- Add tests where you touch risky logic (auth, booking races, money); the long admin/marketing tail is partial.

---

## 13. Design system (brief)

Black-and-red brand. Light mode only (dark backgrounds used intentionally in header/hero/featured). Full tokens live in `src/app/globals.css` as semantic utility classes — **prefer these over long Tailwind strings.**

- **Primary:** `#dc2626` (red-600) for CTAs, links, page titles; hover `red-700`.
- **Text:** `gray-900` headings, `gray-700` body, `gray-600/500/400` secondary.
- **Semantic classes:** `.page-title`, `.section-title`, `.heading-3/4`, `.description`, `.card` / `.card-elevated` / `.card-interactive`, `.input` / `.input-error`, `.badge-{green,amber,red,blue,gray}`, `.tag`.
- **Icons:** lucide-react (20px default, stroke 2). **Animation:** Motion, 200ms default. **Touch targets:** ≥44px. **A11y target:** WCAG AA (focus rings, alt text, ARIA roles, keyboard nav).

---

## 14. For engineers

`CLAUDE.md` is the in-repo engineering manual — read it before non-trivial changes. Highlights:

- **Two parallel auth systems** (iron-session admin vs NextAuth customer) that share nothing — don't try to centralise them in middleware.
- **Server-component + client-island pattern** for admin pages (`viewing/page.tsx` + `ViewingBookingsClient.tsx` is the canonical example; `shop/page.tsx` is the remaining all-client page to migrate).
- **Business info** comes from MongoDB (five collections), assembled in `getBusinessInfo()` and `React.cache`-wrapped per request — not from env vars.
- **Authorization:** use `hasMinimumRole(role)` for privileged admin actions; never rely on `isAuthenticated()` alone.
- **Gotchas:** don't re-add `force-dynamic` to `(main)/layout.tsx`; `MONGODB_URI` is needed at build time; always `serializeDocument` Mongo docs before sending to the client; keep new S3 hosts in `next.config.ts` `remotePatterns`.

---

*MMC Leeds (Morley Motor Company), Roseville Road, Leeds.*
