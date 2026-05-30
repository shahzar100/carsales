# CLAUDE.md

Focused onboarding reference for the `carsales` repository. Aimed at engineers (human or AI) picking the project up for the first time. `README.md` is the broader source of truth — features, env vars, per-service setup, Vercel deployment, the admin guide, and costs; this file is the engineering working manual you keep open in the next tab.

## 1. Project overview

`carsales` is the production Next.js app for **MMC Leeds** (a used-car dealership in Roseville Road, Leeds). It serves two distinct audiences:

- **Customers** browse the fleet, book viewings / detailing / tinting / recovery, lookup bookings, and (optionally) register a user account.
- **Admin staff** (roles: `staff < manager < admin`) manage inventory, bookings, reservations, quotes, part-exchanges, and business settings through `/admin/dashboard`.

The site is deployed on Vercel and backed by a MongoDB Atlas cluster named `MMC`.

## 2. Tech stack

Verified against `package.json`:

- **Next.js 16.2.6** (App Router, Turbopack dev) on **React 19.1**
- **TypeScript 5** (strict mode, `moduleResolution: bundler`, `@/*` alias to `src/*`)
- **Tailwind 4** (`@tailwindcss/postcss`) — no PostCSS plugins beyond Tailwind + autoprefixer
- **MongoDB 6.x** via the native `mongodb` driver (no ORM)
- **iron-session 8** for admin sessions
- **next-auth v5 beta** (Auth.js) with `@auth/mongodb-adapter` for customer auth
- **React Email 5** templates + **Nodemailer 7** transport
- **AWS S3** (`@aws-sdk/client-s3` + `s3-request-presigner`) for admin image upload
- **Zod 4** for env + payload validation
- **Motion 12** for animations, **lucide-react** for icons, **recharts** for admin charts
- **otpauth + qrcode** for admin two-factor
- **Vercel KV** (Upstash REST) for distributed rate limiting (optional but required in prod)
- **Jest 29** (`jsdom` + `mongodb-memory-server`) + **Playwright 1.48** for E2E
- **Node 22.x** (declared in `package.json#engines`)

## 3. Run / build / test / lint commands

Exact `npm` script names from `package.json`:

| Script | Purpose |
|---|---|
| `npm ci` | Install with the lockfile (use this, not `npm install`, in CI) |
| `npm run dev` | Dev server on `http://localhost:3000` (Turbopack) |
| `npm run build` | Production build — requires a reachable `MONGODB_URI` for page-data collection |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (flat config `eslint.config.mjs`) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run format` / `npm run format:check` | Prettier (`.prettierrc`) over `src/**/*.{tsx,jsx,ts,js}` |
| `npm test` | Jest (component + API in-memory Mongo) |
| `npm run test:watch` / `npm run test:coverage` | Jest watch / with coverage |
| `npm run test:e2e` | Playwright (requires `npx playwright install` once) |
| `npm run test:e2e:ui` / `npm run test:e2e:headed` | Playwright with UI / headed browser |
| `npm run setup-admin` | Seed first admin user from `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`scripts/setup-admin.mjs`) |
| `npm run migrate:business-info` | One-off Mongo migration (`scripts/migrate-business-info.ts`) |
| `npm run email` | React Email preview server against `src/emails/` |

Env vars and the full table of required-vs-optional keys are documented in `README.md` (§4 environment variables, §5 per-service setup). Server-side validation lives in `src/lib/env.ts` and is triggered at boot from `src/instrumentation.ts`.

## 4. Repository layout

Top two levels of `src/` only:

```
src/
├── app/                       App Router root
│   ├── (main)/                Route group — public-facing site (customers)
│   │   ├── AboutUs/  Book/  Booking/  BrowseFleet/  CarParts/
│   │   ├── FAQ/  Recoveries/  Services/  account/  contact/
│   │   ├── forgot-password/  login/  register/  reset-password/
│   │   ├── privacy/  review/  saved/  terms/
│   │   ├── layout.tsx         (do NOT add force-dynamic here — see Gotchas)
│   │   ├── loading.tsx        page.tsx (home)
│   ├── (admin)/               Route group — admin dashboard, separate layout
│   │   ├── admin/
│   │   │   ├── dashboard/     account, audit, carparts, cars, part-exchange,
│   │   │   │                  quotes, reservations, service, shop, status, viewing
│   │   │   ├── login/  reset-password/
│   │   ├── layout.tsx  loading.tsx
│   ├── api/                   API route handlers
│   │   ├── about/  account/  admin/  auth/  bookings/  businessinfo/
│   │   ├── carparts/  cars/  cron/  csp-report/
│   ├── globals.css            Design tokens + semantic utility classes
│   ├── layout.tsx error.tsx global-error.tsx not-found.tsx
│   ├── robots.ts sitemap.ts favicon.ico
├── auth.ts                    NextAuth v5 (customer auth) configuration
├── proxy.ts                   Edge middleware (CSRF + per-request CSP nonce)
├── instrumentation.ts         Boots env validation on server start
├── components/                React components
│   ├── Account/  Admin/  Booking/  Car/  CarParts/  Dropdown/  Form/
│   ├── Helpful/  Home/  Legal/  Main/  Providers/  SEO/  Services/
│   ├── Shared/  Toast/  UI/
│   ├── CarViewing.tsx  Footer.tsx  Header.tsx  HeroMotion.tsx
│   ├── HeroSection.tsx  WhatsAppButton.tsx  WhatsAppButtonClient.tsx
├── contexts/                  React Context providers
├── emails/                    React Email templates + Nodemailer transport (send.ts)
├── hooks/                     Custom React hooks (useToast, etc.)
├── lib/
│   ├── constants.ts  env.ts  interfaces.ts  mongodb.ts  types.ts
│   ├── models/                Collection accessors + serializeDocument helper
│   ├── utils/                 apiResponse, audit, auth, booking, bookingSlots,
│   │                          buildCarFilter, businessHours, businessInfo,
│   │                          customerAuth, emailVerification, featuredCarCache,
│   │                          filterCars, format, observability, rateLimit,
│   │                          reviewInvite, s3, turnstile, twoFactor, url, validation
└── types/                     Ambient / shared TS types
```

Notes:

- The **`(main)`** and **`(admin)`** parentheses are App-Router *route groups*: they organise files and let each group own its `layout.tsx` (header, footer, fonts, providers) without affecting URL paths. A page under `(admin)/admin/dashboard/foo/page.tsx` resolves to `/admin/dashboard/foo`.
- The actual middleware file is `src/proxy.ts` (not `middleware.ts`). It exports `proxy()` and a `config.matcher`. CSP nonces are issued here; route-level auth is enforced in the page/layout itself, not here.
- `scripts/`, `e2e/`, `__tests__/`, `tools/`, `public/` and the root `*.md` files (`README.md`, `CLAUDE.md`) live at the repo root, not under `src/`.

## 5. Auth — two parallel systems

This is the single most counter-intuitive thing in the codebase. There are two independent auth stacks; they share no cookie, no collection, and no helper.

### Admin auth — `iron-session`

- **Config:** `src/lib/utils/auth.ts`
- **Cookie:** `carsales_admin_session` (httpOnly, sameSite=lax, 24h)
- **Collection:** `adminUsers`
- **Routes:**
  - `POST /api/admin/login` / `POST /api/admin/logout` / `GET /api/admin/session`
  - `/admin/login` page; `/admin/reset-password?token=...` page
- **Role hierarchy:** `staff (1) < manager (2) < admin (3)` — use `hasMinimumRole(role)` from `src/lib/utils/auth.ts` for authorization on privileged endpoints. **Never** rely on `isAuthenticated()` alone for admin-only actions; that would let a `staff` user act as `admin`. Reference fix: `src/app/api/admin/users/password/route.ts`.
- **Bootstrap:** `npm run setup-admin` seeds the first admin from env.
- **Two-factor:** TOTP via `otpauth`, see `src/components/Admin/TwoFactorPanel.tsx` and `src/lib/utils/twoFactor.ts`.

### Customer auth — NextAuth v5 (Auth.js)

- **Config:** `src/auth.ts`
- **Strategy:** JWT (mandatory because the Credentials provider can't use DB sessions)
- **Cookies:** standard NextAuth names
- **Collection:** `users` (NextAuth adapter writes to the `MMC` database)
- **Providers:**
  - Credentials (email + password, hashed with bcryptjs via `verifyPassword`)
  - Nodemailer magic link (rate-limited by recipient via `customerMagicLink` limiter)
  - Google OAuth (when `AUTH_GOOGLE_ID/SECRET` are set; `allowDangerousEmailAccountLinking: true`)
- **Endpoint:** `/api/auth/[...nextauth]`
- **Pages:** `/login` (sign-in + verifyRequest + error all route here), `/register`, `/forgot-password`, `/reset-password`, `/account`
- **Route protection:** server-side `auth()` guard in each protected page (e.g. `/account`), mirroring how the admin dashboard guards itself in its layout. **Do not** try to enforce either system from `src/proxy.ts` — it would conflict with the other.

A customer session can never be read as an admin session, and vice versa, because they use different cookies and different collections.

## 6. The "server component + client island" pattern

This is the project's canonical refactor pattern (Day 12.6 / Finding #29 in the audit history). The old all-client admin pages had to render a spinner, round-trip an API, then render — the first paint had no data. The new pattern fetches initial data in a server component and hands it to a small client island for interactivity.

**Canonical example:**

- Server page: `src/app/(admin)/admin/dashboard/viewing/page.tsx`
- Client island: `src/components/Admin/ViewingBookingsClient.tsx`

The shape:

```tsx
// page.tsx — async Server Component
export default async function ViewingBookingsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  const collection = await getCarViewingBookingsCollection();
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  const initialBookings = docs.map((b) => serializeDocument(b) as unknown as Booking);

  return <ViewingBookingsClient initialBookings={initialBookings} />;
}
```

```tsx
// ViewingBookingsClient.tsx — "use client" island
"use client";
export default function ViewingBookingsClient({ initialBookings }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  // mutations call /api/admin/... then refetch
}
```

Rules of thumb when applying the pattern:

- Auth-guard inside the server page (`isAuthenticated()` → `redirect("/admin/login")`).
- Fetch from collection helpers in `src/lib/models/`; convert ObjectIds with `serializeDocument` before crossing the server/client boundary.
- Keep the client island responsible for mutations, optimistic updates, and refetches via the existing `/api/admin/*` routes — do **not** call Mongo from the client.
- As of this writing every dashboard page under `src/app/(admin)/admin/dashboard/` follows this pattern — the shop/business-settings page was the last to migrate (`shop/page.tsx` server component + `components/Admin/ShopSettingsClient.tsx` island). New admin pages must follow it from the start.

## 7. Business info pipeline

Business settings (address, hours, hero stats, detailing packages, tint options, service overviews, recovery info) come from MongoDB, *not* from env vars.

- **Entry point:** `getBusinessInfo()` in `src/lib/utils/businessInfo.ts`.
- **Cache:** wrapped in `React.cache(fetchBusinessInfo)` so multiple calls within the same request (Header, Footer, HeroSection, metadata, WhatsAppButton, …) collapse into one set of Mongo round-trips. The cache scope is one request, not one process.
- **Source:** five collections — `businessInfo` (core), `detailingPackages`, `tintOptions`, `serviceOverviews`, `recoveryInfo` — all fetched in parallel.
- **Seeding:** on first ever read, each collection is auto-seeded from the in-file constants (`CORE_SEED`, `DETAILING_SEED`, `TINT_SEED`, `SERVICE_OVERVIEW_SEED`, `RECOVERY_SEED`). Subsequent reads are pure DB reads.
- **Writes:** `updateBusinessInfo(partial)` in the same file. Used by `PUT /api/admin/shop` (the admin shop-settings page). A read-only `GET /api/businessinfo` also exposes the assembled `ShopInfo` to public clients.
- **Assembly:** the resulting `ShopInfo` shape glues the five collections back together — consumers only ever see one object.
- **Consumers (verified):** `src/components/HeroSection.tsx`, `src/components/WhatsAppButton.tsx`, `src/app/(main)/AboutUs/page.tsx`, `Recoveries/page.tsx`, `review/page.tsx`, `FAQ/page.tsx`, `contact/page.tsx`, `Services/page.tsx`, `Services/Detailing/page.tsx`, `Services/Tints/page.tsx`, `Services/Repairs/page.tsx`, `Booking/confirmation/page.tsx`, `Book/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`.

## 8. Observability

- **Shim:** `src/lib/utils/observability.ts` exports `logError(error, context?)` and `logEvent(name, context?)`.
- **Today:** they call `console.error` / `console.log` with a structured payload, after passing the context through a PII redactor (`email`, `customerEmail`, `customerName`, `customerPhone`, `phone`, `password`, `passwordHash`, `token`, `sessionToken`, `Authorization`, `cookie` keys are replaced with `"[redacted]"`).
- **Gated on `SENTRY_DSN`:** the env value is accepted by `src/lib/env.ts` (`SENTRY_DSN: z.string().optional()`). The shim is the single seam for forwarding to Sentry — every call site stays put.
- **Sentry is installed and wired.** `@sentry/nextjs` is a dependency; `sentry.{client,server,edge}.config.ts` exist and `next.config.ts` wraps the build with `withSentryConfig` when a DSN is present at build time. `logError` / `logEvent` always log redacted structured output to console, and additionally forward to `Sentry.captureException` / `Sentry.addBreadcrumb` when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set. With no DSN the SDK never initialises and the helpers are console-only — safe to deploy without it. See `README.md` §5 for provisioning the DSN.

## 9. Rate limiting

`createRateLimiter(name, opts)` in `src/lib/utils/rateLimit.ts` returns a `RateLimiter` with `check(id)` / `reset(id)`.

- **Backend selection** is automatic: if both `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set, it uses the Upstash REST API against Vercel KV. Otherwise it falls back to a per-process in-memory `Map`.
- **Production must configure KV.** Without it, the limit is per-Lambda-warm-instance, which is effectively no limit under autoscaling.
- **`failClosed`** option: set `true` for credential-guarding limiters (login, password reset, 2FA, magic link) so a KV outage does *not* become an unlimited brute-force window. Leave `false` (default) for anti-abuse limiters where a blip shouldn't take the feature down.
- **Existing limiters** include `customerLogin` and `customerMagicLink` in `src/auth.ts`, plus the admin login limiter in `src/app/api/admin/login/route.ts`. Search for `createRateLimiter(` before adding another.

## 10. Conventions

- **TypeScript strict** is on. `paths`: `@/*` → `src/*`. Avoid `any`; prefer narrow types and `unknown` at boundaries.
- **Tailwind 4** with design tokens / semantic utility classes in `src/app/globals.css` (see `.page-title`, `.section-title`, `.badge-*`, `.card-*`, `.input`, `.tag`, …). Prefer the semantic class over a long Tailwind string when one exists — README.md has the full table.
- **Exports:** React components remain `export default`. New utility / pure-function files should use named exports — no default exports unless they are React components. (Existing legacy default-exported utilities are fine; don't churn the codebase to convert them.)
- **Comments:** keep them minimal. Document the *why*, not the *what*. The existing source has many high-value "why this looks weird" blocks (see `src/proxy.ts`, `src/app/(main)/layout.tsx`, `src/lib/utils/auth.ts`); add to that style rather than narrating obvious logic.
- **Imports:** absolute via `@/...`. Avoid `../../..` chains.
- **Validation:** every API route validates its payload with Zod. See examples in `src/auth.ts` (`credentialsSchema`) and `src/lib/env.ts`.
- **Server vs client:** mark client files with `"use client"` at the top. Default to server components; promote to client only when you need state, effects, browser APIs, or event handlers.
- **Mongo IDs:** always pass DB docs through `serializeDocument` (from `src/lib/models`) before sending to the client — raw `ObjectId` is not serialisable.
- **Testing:** test-then-implement is **not** enforced. Component coverage sits around ~22.89%; the critical auth and booking-race paths are covered, the long admin/marketing tail is not. Add tests where you touch risky logic; don't gate small changes on coverage.
- **No `CONTRIBUTING.md`** exists at the repo root; conventions are encoded here and in `README.md`.

## 11. Gotchas

Pulled from direct source inspection. Read these before your first non-trivial change.

1. **`next.config.ts` wraps with Sentry conditionally.** It calls `withSentryConfig(...)` only when a DSN is present at build time (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`); otherwise it exports the bare config so `next build` stays green pre-DSN. If you re-run the Sentry wizard or edit this file, preserve `poweredByHeader: false`, the `images.remotePatterns` for `*.s3.*.amazonaws.com` / `*.cloudfront.net`, and the `Cross-Origin-*` headers in `securityHeaders` — the wizard has historically clobbered custom config.
2. **Dual auth means you cannot share middleware logic.** `src/proxy.ts` (the edge middleware) deliberately does **not** enforce auth on `/admin/*` or `/account` — admin auth lives in iron-session and customer auth lives in NextAuth v5, and only one cookie format would be readable from the edge runtime cleanly. Auth is enforced inside each protected server page/layout instead. Don't try to centralise it.
3. **Admin tab refactor pattern is mandatory for new admin pages.** See §6. Every existing dashboard page now follows it (the shop page was the last to migrate); new admin pages should not be written as all-client.
4. **Do not put `force-dynamic` back on `src/app/(main)/layout.tsx`.** It was removed deliberately (PR #49). The header comment in that file explains why — re-adding it collapsed throughput to single-digit req/s under load. Use per-page `export const revalidate = N` instead.
5. **`MONGODB_URI` is needed at build time.** `next build` does page-data collection against the DB. Vercel build IPs reach Atlas in prod; local builds need a reachable URI in `.env.local` or you'll see ECONNREFUSED during prerender.
6. **`SESSION_SECRET` regenerates on dev restart if unset.** `src/lib/utils/auth.ts` falls back to `crypto.randomBytes(32)` per process. Set a stable value in `.env.local` if you want sessions to survive `next dev` restarts.
7. **Admin reset-password requires `hasMinimumRole("admin")`.** If you copy the password reset route as a template, keep that role check. Reference: `src/app/api/admin/users/password/route.ts`.
8. **S3 image hosts must be in `next.config.ts:remotePatterns`.** Adding a new bucket / CloudFront distribution without updating that list will silently break `<Image>` for those URLs.
9. **CSP `style-src` still allows `'unsafe-inline'`** because Motion + `@next/font` inject inline styles. A `Content-Security-Policy-Report-Only` mirror with `'self'`-only is also emitted so we can see what would break before flipping. See the long comment in `src/proxy.ts`.
10. **Cron uses bearer auth.** `/api/cron/review-invites` requires `Authorization: Bearer ${CRON_SECRET}`. Vercel cron and `CRON_SECRET` must be configured in the same project.
11. **Three giant components are deliberately not split** (handover risk): `BookingFlow.tsx` (~1158 lines), `BusinessInfoForm.tsx` (~1143 lines), `Header.tsx` (~1009 lines). When you do refactor, follow the server-component + client-island pattern.
12. **Some `node_modules` advisories are stuck on upstream.** `npm audit fix --force` would downgrade Next.js — do not run it. Run `npm audit` to see the current list before acting.

## 12. Where to look next

- `README.md` — the broad source of truth: feature inventory, env-var reference, per-service key setup, Vercel deployment, the step-by-step admin guide, running costs, and the design-system summary.
- The source itself — the inline `// why this looks weird` comments (see `src/proxy.ts`, `src/app/(main)/layout.tsx`, `src/lib/utils/auth.ts`) are the most reliable documentation in the repo.

When in doubt, read the source — the inline `// why this looks weird` comments are the most reliable documentation in the repo.
