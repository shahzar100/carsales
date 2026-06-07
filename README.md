# Morley Motor Company (MMC Leeds)

Production [Next.js](https://nextjs.org) application for **Morley Motor Company**, a used-car
dealership in Roseville Road, Leeds. The site serves two audiences from one codebase:

- **Customers** browse the fleet and car parts, book viewings / detailing / tinting / recovery,
  request part-exchange quotes, look up and cancel bookings, leave reviews, and optionally
  register an account.
- **Admin staff** (`staff` < `manager` < `admin`) manage inventory, bookings, reservations,
  quotes, part-exchanges, the parts shop, and business settings through `/admin/dashboard`.

Deployed on **Vercel**, backed by a **MongoDB Atlas** cluster (`MMC` database).

> **Status:** private, production. `npm run build` is green; `tsc` and ESLint are clean.

---

## Documentation

Start here, then branch out by what you need to do:

| If you are… | Read |
|---|---|
| A developer onboarding to the code | [CLAUDE.md](./CLAUDE.md) — architecture, conventions, gotchas |
| Setting the project up locally | [SETUP.md](docs/SETUP.md) — env vars, Sentry, staging, backups, secret rotation |
| Picking the project up / handover | [HANDOVER_NOTES.md](docs/HANDOVER_NOTES.md) — current state, known issues, deep decisions |
| Deploying to production | [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel, cron, build requirements |
| On call | [RUNBOOK.md](docs/RUNBOOK.md) — ownership, escalation, common ops |
| Non-technical staff running the site | [OPERATIONS.md](docs/OPERATIONS.md) and [ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) |
| Contributing code | [CONTRIBUTING.md](docs/CONTRIBUTING.md) — pre-commit hooks and quality gates |
| Working on UI / design | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (generated from [design.md](./design.md)) |
| Writing or running tests | [TEST_README.md](docs/TEST_README.md) |

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) on React 19.1 |
| Language | TypeScript 5 (strict), `@/*` → `src/*` |
| Styling | Tailwind CSS 4 with semantic utility classes in `globals.css` |
| Database | MongoDB 6.x via the native driver (no ORM) |
| Admin auth | iron-session 8 (`adminUsers` collection) |
| Customer auth | NextAuth v5 (Auth.js) + `@auth/mongodb-adapter` (`users` collection) |
| Email | React Email 5 templates + Nodemailer 7 |
| Image storage | AWS S3 + presigned uploads (optional CloudFront) |
| Validation | Zod 4 (env + every API payload) |
| UI / charts | Motion 12, lucide-react, Recharts (lazy-loaded) |
| Two-factor | TOTP via `otpauth` + `qrcode` |
| Rate limiting | Vercel KV (Upstash REST), in-memory fallback in dev |
| Observability | `@sentry/nextjs`, gated entirely on `SENTRY_DSN` |
| Testing | Jest 29 (jsdom + `mongodb-memory-server`), Playwright 1.48 (E2E) |
| Runtime | Node 22.x |

---

## Quick start

**Prerequisites:** Node 22.x, npm, and a reachable MongoDB connection string (Atlas or local).

```bash
# 1. Install dependencies (use the lockfile)
npm ci

# 2. Configure environment
cp .env.example .env.local
#    Fill in at least MONGODB_URI, SESSION_SECRET, and AUTH_SECRET.
#    Every variable is documented inline in .env.example and validated
#    at boot by src/lib/env.ts. See docs/SETUP.md for the full reference.

# 3. Seed the first admin user (reads ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD)
npm run setup-admin

# 4. Start the dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000); the admin dashboard is at
`/admin/login`.

> **Build note:** `next build` runs page-data collection against the database, so a reachable
> `MONGODB_URI` is required at build time (locally and on Vercel). See
> [Gotchas](./CLAUDE.md#11-gotchas).

### Minimum environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Connection string; **must** include the `MMC` database in the path |
| `SESSION_SECRET` | iron-session signing secret (≥ 32 chars; required in production) |
| `AUTH_SECRET` | Signs customer (NextAuth) session JWTs |
| `CRON_SECRET` | Bearer token for cron routes; **required in production** |

Email (`SMTP_*`), image upload (`AWS_*` / `S3_BUCKET_NAME`), Google OAuth (`AUTH_GOOGLE_*`),
distributed rate limiting (`KV_REST_API_*`), Turnstile, and Sentry are all optional and
degrade gracefully when unset — full details in [.env.example](./.env.example) and
[SETUP.md](docs/SETUP.md).

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) on port 3000 |
| `npm run build` | Production build (needs a reachable `MONGODB_URI`) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run format` / `format:check` | Prettier over `src/**` |
| `npm test` | Jest (component + API, in-memory Mongo) |
| `npm run test:watch` / `test:coverage` | Jest watch / coverage |
| `npm run test:e2e` | Playwright E2E (`npx playwright install` once) |
| `npm run test:e2e:ui` / `test:e2e:headed` | Playwright with UI / headed browser |
| `npm run setup-admin` | Seed the first admin user from env |
| `npm run migrate:business-info` | One-off business-info Mongo migration |
| `npm run email` | React Email preview server for `src/emails/` |
| `npm run size` | Bundle size check (`size-limit`) |

---

## Project structure

```
src/
├── app/
│   ├── (main)/        Public site (customers) — own layout, header/footer
│   ├── (admin)/       Admin dashboard — separate layout
│   ├── api/           Route handlers (admin, auth, bookings, cars, cron, …)
│   └── globals.css    Design tokens + semantic utility classes
├── auth.ts            NextAuth v5 (customer auth) config
├── proxy.ts           Edge middleware: CSRF + per-request CSP nonce
├── instrumentation.ts Boots env validation on server start
├── components/        React components (Admin, Car, Booking, Form, …)
├── contexts/          React Context providers
├── emails/            React Email templates + Nodemailer transport
├── hooks/             Custom hooks
├── lib/
│   ├── models/        Collection accessors + serializeDocument helper
│   └── utils/         apiResponse, auth, booking, rateLimit, s3, …
└── types/             Shared TypeScript types
```

`(main)` and `(admin)` are App Router *route groups* — they organise files and own their
layouts without affecting URLs. The middleware file is `src/proxy.ts` (not `middleware.ts`).
See [CLAUDE.md §4](./CLAUDE.md#4-repository-layout) for the annotated layout.

---

## Architecture highlights

These are the non-obvious decisions worth knowing before your first change — each is detailed
in [CLAUDE.md](./CLAUDE.md):

- **Two independent auth systems.** Admin uses iron-session (`adminUsers`); customers use
  NextAuth v5 (`users`). They share no cookie, collection, or helper, and auth is enforced
  inside each protected page/layout — **not** in `proxy.ts`. (§5)
- **Server component + client island.** New admin pages fetch initial data in an async server
  component and hand it to a small `"use client"` island for interactivity. (§6)
- **Business info pipeline.** Address, hours, packages, and tint/service options come from
  MongoDB (auto-seeded on first read) via `getBusinessInfo()`, wrapped in `React.cache`. (§7)
- **Rate limiting.** `createRateLimiter()` uses Vercel KV when configured, with `failClosed`
  on credential-guarding limiters. (§9)
- **Security.** Per-request CSP nonce and CSRF in `proxy.ts`; static security headers and
  image `remotePatterns` in `next.config.ts`. (§11)

---

## Testing

```bash
npm test            # Jest: jsdom components + node API suite (in-memory Mongo)
npm run test:e2e    # Playwright end-to-end (run `npx playwright install` first)
```

Test-first is not enforced; coverage is concentrated on the high-risk auth and booking-race
paths. Add tests where you touch risky logic. See [TEST_README.md](docs/TEST_README.md) for the
setup and conventions.

---

## Deployment

Hosted on **Vercel** (Node 22.x) against **MongoDB Atlas**, with one cron job declared in
`vercel.json`. Production should configure Vercel KV (rate limiting) and set `CRON_SECRET`.
Full procedure — env, cron auth, Sentry wrap, build requirements — is in
[DEPLOYMENT.md](docs/DEPLOYMENT.md); on-call procedures are in [RUNBOOK.md](docs/RUNBOOK.md).

---

## License

Private and proprietary. © Morley Motor Company. Not licensed for redistribution.
