# Security Review — May 2026 Handover-Prep Cycle

## 1. Headline

This review covers the security-relevant changes shipped to `origin/main` during
the May 2026 handover-prep cycle (PRs #56, #58, #59, #61, #62, #63, #65, #66,
#67, #68, #70, #71, #72), reviewed on 2026-05-24.

Methodology:

- Walked the diff of every listed PR with `git show <sha>` against
  `origin/main`.
- Read each new/modified API route, every Sentry config file, the
  observability shim, the rate-limiter changes, and the `next.config.ts`
  CSP / headers block.
- Ran `npm audit --json` after the cycle and cross-referenced the result
  with `HANDOVER_NOTES.md` §4 "Vulnerable dependencies".
- Spot-checked test fixtures for real credentials, DSNs, or bucket names.

No source code, test, or other doc was modified. Every recommendation in
the table below is left as a SUGGESTION; real fixes will land in follow-up
PRs.

---

## 2. Findings table

| # | Severity | Area | File:line | Description | Recommended fix |
|---|---|---|---|---|---|
| 1 | High (advisory, pre-existing) | Dependency | `package.json` (next 16.2.6) | 13 Next.js advisories remain after `npm audit fix`: middleware-bypass via segment-prefetch, middleware-bypass via dynamic-route-param injection, RSC cache poisoning, CSP-nonce XSS, Image-Optimization DoS, SSRF via WS upgrades, etc. | Track the Next.js 16.2.x patch stream; bump as soon as a patched 16.2.x release is published. Do not `--force` (would downgrade to 9.3.3). |
| 2 | High (advisory, dev-only) | Dependency | `package.json` (`@react-email/preview-server`) | High-severity advisory from `next` transitive + `postcss` XSS. Tool is dev-only (`npm run email`) and not shipped. | Move to `devDependencies` is already done; once `@react-email/preview-server` cuts a release that bumps its `next` peer to a patched line, bump it (currently the `audit fix` suggestion is a semver-major downgrade — do not take it). |
| 3 | Medium | Secret exposure / observability | `src/lib/utils/observability.ts:35-50` (Sentry-bound `extra`) | The PII redactor strips known sensitive *keys* (`email`, `password`, `Authorization`, `cookie`, …) but only at object-key level. A caller that passes a free-form string (e.g. an error message containing a Bearer token, a Mongo connection URL, or a presigned S3 URL) into `logError(err, { context: errMessage })` will leak the value to Sentry via the `extra` payload. None of the current call sites do this — but there is nothing structural preventing it. | Either (a) deny-list at value level by regex-scrubbing `extra` with patterns for `Bearer [A-Za-z0-9-_\.=]+`, JWT-shaped strings, and `mongodb(\+srv)?://[^@]+@`, or (b) explicitly forbid passing `Error` messages through `extra` and document that the `error` argument itself is the only payload allowed to contain stringified secrets. See §3.3 for the suggested snippet. |
| 4 | Medium | Sentry default capture | `sentry.{client,server,edge}.config.ts` (PR #63) | Sentry SDK v10 defaults: `sendDefaultPii: false` (good — IP, user-agent, cookies not sent) but request URL, query string, request headers (minus `Cookie`/`Authorization`), and `next.config.ts` settings ARE auto-captured. The DSN config does not set a `beforeSend` filter. A query string carrying `?token=`, `?ref=BK-…&email=…`, or `?turnstileToken=…` (all real shapes used by `/api/bookings/lookup`) will be sent to Sentry verbatim if a handler error fires on that request. | Add `beforeSend` to all three `sentry.*.config.ts` that scrubs query-string keys matching `/(token|secret|password|ref|email|code|turnstileToken)/i` from `event.request.query_string` and `event.request.url`. Skeleton in §3.4. |
| 5 | Medium | Rate-limit key encoding | `src/lib/utils/rateLimit.ts:135,144,150,156,182` + `src/auth.ts:108-115` | The KV-backed limiter builds Upstash REST paths as `\`/incr/rl:${name}:${id}\`` with no URL-encoding on `id`. For most call sites `id` is an IP string and safe. But `magicLinkLimiter.check(identifier.toLowerCase())` in `src/auth.ts:109-110` passes the recipient *email address* as the limiter id. RFC 5321 permits `/`, `+`, `=`, `?`, `#`, and other reserved chars inside the local-part (with quoting). An address containing `/` would split the URL path and either 404 the INCR or land on an unrelated key, silently breaking the per-recipient cap so an attacker could re-flood that inbox. | URL-encode the identifier before substitution: change `keyFor(id)` to use `\`rl:${name}:${encodeURIComponent(id)}\``, or hash the id (`crypto.createHash('sha256').update(id).digest('hex').slice(0,32)`) before sending. Snippet in §3.5. |
| 6 | Low | Input validation gap | `src/app/api/admin/carparts/route.ts:63-125` (POST) | PR #56 hardened the PUT path with a Zod `.strict()` schema, but the POST handler still does field-by-field plucking without `.strict()` parsing, and uses an ad-hoc `/[${}]/` regex on `category` only. The newPart object is hand-built so mass-assignment isn't possible, but the asymmetry with PUT means a future maintainer adding a field in POST could regress to a spread. Also `image` is not URL-validated; a `javascript:` URL written via POST would render later if any consumer drops it into an `<a href>` (the Mongo doc is reflected back). | Lift `carPartUpdateSchema` to a base schema and reuse: `const carPartCreateSchema = baseSchema.strict()` for POST; keep `.partial().strict()` for PUT. Add `image: z.string().url().max(2000).optional()` and enforce `https:`. |
| 7 | Low | Input validation gap | `src/app/api/admin/shop/route.ts:38-205` (PUT) | The shop PUT does ad-hoc field-by-field type checks for the top-level scalar fields (`businessName`, `email`, `phone`, etc.) but the nested objects `socialMedia`, `heroStats`, `detailingPackages`, `tintOptions`, `serviceOverviews`, `recovery`, and `hours` are cast (`as ShopInfo["…"]`) and persisted as-is. A manager-role caller can therefore insert arbitrary keys/values into these sub-documents — including a `$` operator key if the document is later read into a Mongo `$set`. The route is role-gated so the attacker must already be a compromised manager, but the inconsistency with the carparts PUT (which is fully Zod-strict after PR #56) is worth closing. | Define a Zod schema for `ShopInfo` (it already has a TypeScript interface) and use `safeParse` for the whole body, removing the manual `validationErrors[]` block. Effort: M (~1 hr). |
| 8 | Low | CSP weakened by Sentry tunnelRoute | `next.config.ts:131` (`tunnelRoute: "/monitoring"`) | `withSentryConfig` provisions a same-origin route `/monitoring/...` that proxies events to Sentry. This route is auto-created by the wrapper; it is not declared in `src/proxy.ts`'s middleware matcher's allowlist for CSRF, and `connect-src` in the CSP only lists self / S3 / Cloudflare — the tunnel is `self` so it is allowed. However, the route accepts arbitrary POST payloads from the browser and forwards them. It is gated by Sentry's own envelope format but should be treated as user-reachable. | Mark as `Info — needs verification`: confirm the `/monitoring` tunnel does not bypass the CSRF check in `src/proxy.ts:65-95` (it shouldn't — `proxy.ts` matcher excludes only static assets, so `/monitoring` will hit the CSRF check, which requires Origin == Host; that's fine for browser-originating Sentry events). No fix needed if verified. |
| 9 | Info — needs verification | Headers / next.config | `next.config.ts:118-137` | `withSentryConfig` has historically clobbered custom headers / `poweredByHeader` settings in older versions. A diff of the wrapped vs. unwrapped config should confirm `poweredByHeader: false`, `securityHeaders`, and `images.remotePatterns` survive the wrap. | Verify by inspecting the generated `.next` build output, or set `SENTRY_DSN=test` locally and `next build`, then `curl -sI http://localhost:3000 \| grep -i powered`. |
| 10 | Info | CRON_SECRET test bypass | `src/app/api/cron/review-invites/route.ts:114-126` | Block at L114 allows the cron handler to run without `CRON_SECRET` set when `NODE_ENV === "test"`. If a deployment ever shipped with `NODE_ENV=test` (misconfiguration), the cron endpoint would be world-callable. Server-env validator (`src/lib/env.ts`) requires production NODE_ENV; risk is low. | Either tighten to `if (!cronSecret && process.env.NODE_ENV === "test")` AND require `process.env.JEST_WORKER_ID` to be set, or remove the bypass entirely and let tests inject a stub. |
| 11 | Info | Logging of customer email | `src/app/api/admin/bookings/cancel/route.ts:115` + `src/emails/send.ts:108` | `customerEmail` is read out of the booking and used in `sendEmail({ to: customerEmail })`. Not logged directly, but `console.error("Email sending failed:", error)` in `src/emails/send.ts:108` will include nodemailer's error object which typically embeds the rejected recipient address. After Sentry wiring, this stack trace flows to Sentry. PII redactor only operates on `extra`, not on captured exceptions' messages. | Wrap the rejected-recipient-bearing error in a synthetic `new Error("Email send failed for booking <ref>")` before throwing/logging, so the captured exception does not carry the email address. |

No findings in: NoSQL operator injection on the new routes (the `.strict()`
Zod parse on carparts PUT closes it; admin login already had string
type-guards); SQL injection (no SQL in repo); command injection (no
`child_process` calls in PR-touched files); CORS misconfiguration
(no CORS-changing config introduced in this cycle); secrets in client
bundles (only `NEXT_PUBLIC_SENTRY_DSN` is added and DSNs are public by
design); test mock leakage (DSNs / bucket names absent from fixtures —
see §5).

---

## 3. Detail per finding

### 3.1 Next.js dependency advisories (Finding #1) — High — effort: L

`package.json` pins `^16.2.6`; `npm audit` lists 13 advisories. Two are
middleware/proxy bypasses (GHSA-26hh, GHSA-492v) that interact directly
with `src/proxy.ts` (our edge CSRF + CSP-nonce middleware), and one is a
CSP-nonce XSS (GHSA-ffhc) on the same path. Combined with the admin
iron-session cookie being SameSite=Lax, the middleware-bypass class
widens the CSRF surface on `/api/admin/**` state-changers.

**Fix:** track Next.js release notes; bump to the next patched `16.2.x`
release that lists those GHSA IDs in its changelog. Do **not** run
`npm audit fix --force` — it suggests downgrading to 9.3.3.

### 3.2 `@react-email/preview-server` dev-only advisory (Finding #2) — High (advisory) — effort: S

Dev-dependency only — never bundled into production. Surfaces only when
`npm run email` is run locally. Fix: wait for upstream patch release.

### 3.3 Observability redactor only scrubs keys, not values (Finding #3) — Medium — effort: S

**Current state:** `src/lib/utils/observability.ts:35-49`:

```ts
const PII_KEYS = new Set([
  "email", "customerEmail", "customerName", "customerPhone", "phone",
  "password", "passwordHash", "token", "sessionToken",
  "Authorization", "authorization", "cookie", "Cookie",
]);
```

`redactObject()` checks `PII_KEYS.has(k)` and replaces the *value* if the
*key* matches. A free-form string value passed at key `context` /
`message` / `error` is not scrubbed.

**Why it's a risk:** a caller writes
`logError(new Error(\`bcrypt failed for hash ${passwordHash}\`))` or
`logError(err, { context: \`Failed at ${request.url}\` })` and the secret
or query-string value reaches Sentry verbatim.

**Suggested fix (snippet, do not apply in this PR):**

```ts
// observability.ts — add a value-level scrubber before serialising.
const VALUE_PATTERNS: Array<{ re: RegExp; replace: string }> = [
  { re: /Bearer\s+[A-Za-z0-9._\-=]+/g, replace: "Bearer [redacted]" },
  { re: /mongodb(?:\+srv)?:\/\/[^@\s]+@/g, replace: "mongodb://[redacted]@" },
  { re: /eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, replace: "[jwt-redacted]" },
];

function scrubString(s: string): string {
  let out = s;
  for (const { re, replace } of VALUE_PATTERNS) out = out.replace(re, replace);
  return out;
}

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") return scrubString(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);
  return redactObject(value as Record<string, unknown>);
}
```

### 3.4 Sentry has no `beforeSend` PII filter (Finding #4) — Medium — effort: S

**Current state:** `sentry.server.config.ts:12-19`:

```ts
Sentry.init({
  dsn,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  debug: false,
});
```

No `beforeSend`, no `ignoreErrors`, no `denyUrls`. Sentry SDK v10 default
`sendDefaultPii: false` keeps cookies and `Authorization` out, but it does
auto-attach `event.request.url`, `event.request.query_string`, and most
other request headers. Our customer-facing routes use query strings
carrying lookup-bearer-token-equivalents: `/api/bookings/lookup?ref=BK-…&email=…&turnstileToken=…`.

**Why it's a risk:** an exception thrown after parsing those query params
(e.g. an upstream Mongo timeout) sends the booking reference + customer
email + Turnstile token to Sentry. The (ref, email) pair is sufficient to
read the booking back via the same endpoint.

**Suggested fix (snippet):**

```ts
// sentry.server.config.ts — add a beforeSend hook to scrub query strings.
const SENSITIVE_QUERY_KEYS = /^(token|secret|password|code|turnstileToken|email|ref)$/i;

Sentry.init({
  dsn,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  debug: false,
  beforeSend(event) {
    const req = event.request;
    if (req?.query_string && typeof req.query_string === "string") {
      const sp = new URLSearchParams(req.query_string);
      for (const k of Array.from(sp.keys())) {
        if (SENSITIVE_QUERY_KEYS.test(k)) sp.set(k, "[redacted]");
      }
      req.query_string = sp.toString();
    }
    if (req?.url) {
      try {
        const u = new URL(req.url);
        for (const k of Array.from(u.searchParams.keys())) {
          if (SENSITIVE_QUERY_KEYS.test(k)) u.searchParams.set(k, "[redacted]");
        }
        req.url = u.toString();
      } catch { /* keep original */ }
    }
    return event;
  },
});
```

Apply the same `beforeSend` to `sentry.client.config.ts` and
`sentry.edge.config.ts`.

### 3.5 Rate-limit key not URL-encoded (Finding #5) — Medium — effort: S

**Current state:** `src/lib/utils/rateLimit.ts:133-188`:

```ts
const keyFor = (id: string) => `rl:${name}:${id}`;
// …
await kvRequest(config, `/incr/${key}`);
await kvRequest(config, `/pexpire/${key}/${opts.windowMs}`);
await kvRequest(config, `/pttl/${key}`);
```

`key` becomes part of the Upstash REST URL path. For IP-string callers
(all `ipAddress()` returns) this is safe — IPs are `[0-9\.]+` or
`[0-9a-f:]+`. But `src/auth.ts:108-115`:

```ts
async sendVerificationRequest({ identifier, url }) {
  const { allowed } = await magicLinkLimiter.check(
    identifier.toLowerCase()
  );
```

passes an arbitrary email address straight through. An email of the form
`"a/b"@example.com` (RFC 5321 quoted-local-part) or any address
containing `/`, `#`, `?` will break path parsing and either return 404 or
hit an unrelated key.

**Why it's a risk:** an attacker who can sign someone else up for a
mailing list / register-form input with a crafted address bypasses the
per-recipient cap on magic-link emails, allowing inbox flooding.

**Suggested fix:**

```ts
// rateLimit.ts:135
const keyFor = (id: string) =>
  `rl:${name}:${encodeURIComponent(id).slice(0, 200)}`;
```

(Length cap prevents an attacker-controlled length from blowing the
Upstash key-length limit; `encodeURIComponent` handles `/`, `#`, `?`,
spaces, and quoted-local-part chars.)

### 3.6 admin/carparts POST not strict-validated (Finding #6) — Low — effort: S

PR #56 hardened the PUT path with `carPartUpdateSchema` (`.strict()`)
but the POST handler at `src/app/api/admin/carparts/route.ts:63-125`
still does field-by-field plucking with an ad-hoc `/[${}]/` regex on
`category` only. Mass-assignment isn't reachable today because the
`newPart` literal is built explicitly, but the PUT/POST asymmetry is the
kind of inconsistency that decays. Also `image: body.image || ""` lets a
manager write a `javascript:` URL.

Fix: lift a `carPartBaseSchema = z.object({...}).strict()` and reuse —
`carPartCreateSchema = carPartBaseSchema` for POST,
`carPartUpdateSchema = carPartBaseSchema.partial().strict()` for PUT.
Add `image: z.string().url().refine(u => u.startsWith("https://")).max(2000).optional()`.

### 3.7 admin/shop PUT nested objects not Zod-validated (Finding #7) — Low — effort: M

`src/app/api/admin/shop/route.ts:161-180` — top-level scalars are
validated but `socialMedia`, `heroStats`, `detailingPackages`,
`tintOptions`, `serviceOverviews`, `recovery`, `hours` are cast and
forwarded as-is to `updateBusinessInfo`. A compromised manager-role
session could plant `$where` / `$gt` / `__proto__` keys inside the
nested objects; whether those reach a Mongo `$set` depends on the writer
in `src/lib/utils/businessInfo.ts`. Safer to fail-closed at the route
boundary by defining a Zod schema mirroring the `ShopInfo` interface
(`src/lib/interfaces.ts`) and `safeParse`-ing the whole body.

### 3.8 Sentry tunnel route under CSRF middleware (Finding #8) — Info — needs verification

`next.config.ts:131` sets `tunnelRoute: "/monitoring"`. The middleware
matcher in `src/proxy.ts:122-124` does match `/monitoring/*`, so the
CSRF check at L65-95 applies. Browser-originated Sentry envelope POSTs
are same-origin and satisfy `Origin === Host`. Verify that Sentry's
wrapper does not insert middleware that runs before `proxy.ts`; if it
does, add an explicit allowlist comment.

### 3.9 next.config.ts clobbering by withSentryConfig (Finding #9) — Info — needs verification

`HANDOVER_NOTES.md` gotchas warn that the Sentry wizard has historically
clobbered custom config. Verify by building with a DSN
(`SENTRY_DSN=https://x@y.ingest.sentry.io/1 next build`) and confirming
with `curl -sI` that `X-Powered-By` is absent and `Strict-Transport-Security`,
`X-Frame-Options`, `Cross-Origin-*` survive.

### 3.10 CRON_SECRET test-mode bypass (Finding #10) — Info — effort: S

`src/app/api/cron/review-invites/route.ts:114-122` skips auth when
`!cronSecret && NODE_ENV === "test"`. The Zod env validator forces
production `NODE_ENV !== "test"`, so this is unreachable in a real
deploy — but defence-in-depth: also require `process.env.JEST_WORKER_ID`
(only set by Jest):

```ts
const isUnitTest = process.env.NODE_ENV === "test" && !!process.env.JEST_WORKER_ID;
if (!cronSecret && !isUnitTest) { return 500; }
```

### 3.11 Email-send error path may leak recipient (Finding #11) — Info — effort: S

`src/emails/send.ts:107-110` does `console.error("Email sending failed:", error)`.
Nodemailer errors typically attach `error.envelope.to` and
`error.responseLines` with the rejected recipient. After Sentry wiring,
this exception flows through `logError(err)` — the PII redactor handles
`extra` but not the captured `Error` instance itself. Fix: synthesise a
safe message (`new Error("Email send failed")`) and stash the original
on `.cause` for local diagnostics only, not the Sentry payload.

---

## 4. npm audit report

`npm audit --json` after the cycle, summarised:

```
critical: 0
high:     2
  - @react-email/preview-server  (devDep; transitive next + postcss)
  - next                          (13 advisories vs 16.2.6)
moderate: 4
  - @sentry/nextjs                (transitive next)
  - next-auth                     (transitive @auth/core + next + nodemailer)
  - nodemailer                    (direct: GHSA-c7w3-x93f-qmm8, GHSA-vvjj-xcjg-gr5g)
  - postcss                       (transitive @react-email/preview-server, dev)
low:      2
  - @auth/core                    (transitive nodemailer)
  - @auth/mongodb-adapter         (transitive @auth/core)
info:     0

total: 8 packages, 1367 dependencies
```

Detailed next.js advisories (all 13 GHSAs against 16.2.6): bypass /
DoS / XSS / cache-poison class — GHSA IDs `8h8q-6873-q5fj`,
`26hh-7cqf-hhc6`, `3g8h-86w9-wvmq`, `ffhc-5mcf-pf4q`, `vfv6-92ff-j949`,
`gx5p-jg67-6x7h`, `mg66-mrh9-m8jx`, `h64f-5h5j-jqjh`, `c4j6-fc7j-m34r`,
`492v-c6pp-mqqv`, `wfc6-r584-vfw7`, `267c-6grr-h53f`, `36qx-fr4f-26g5`.
Two are direct middleware/proxy bypasses that interact with
`src/proxy.ts`.

**Cross-reference with `HANDOVER_NOTES.md` §4:** the handover doc lists
"7 advisories remaining". Today's audit reports 8 packages (the delta is
`@sentry/nextjs` added by PR #63 — transitive on `next`). No newly
available fixes; recommended posture (wait for patched `16.2.x`) is
unchanged. Suggest wiring Dependabot/Renovate to auto-PR upstream
patches.

---

## 5. What was checked and looked clean

- **PR #56 role-gates** — every admin write handler calls
  `hasMinimumRole("manager")` after `isAuthenticated()`. Verified:
  `src/app/api/admin/{cars,carparts,bookings,bookings/cancel,part-exchange,quotes,reservations,shop,upload,upload/delete}/route.ts`.
- **PR #56 ipAddress migration** — `grep -rn "x-forwarded-for"` zero hits
  in `src/`. All rate-limited handlers use `ipAddress(request)` from
  `@vercel/functions`.
- **PR #56 CRON_SECRET constant-time compare** — `timingSafeMatch` at
  `src/app/api/cron/review-invites/route.ts:47-51` SHA-256 hashes both
  sides before `timingSafeEqual`; length-dependent timing closed.
- **PR #56 KV fail-closed** — confirmed at
  `src/lib/utils/rateLimit.ts:166-177`. All 10 credential-guarding
  limiters (login, 2FA, password reset/change, magic link) pass
  `failClosed: true`; anti-abuse limiters correctly omit it.
- **PR #56 carparts PUT mass-assignment** — `.strict()` schema +
  pre-flight `$ / . / __proto__` key rejection at L147-153.
- **PR #56 public seeding removed** — `src/app/api/carparts/route.ts`
  no longer calls `insertMany` from a public GET.
- **PR #58 cleanup** — Finance + AccidentClaims removal left no
  dangling endpoints, imports, or orphan `/api/*` routes.
- **PRs #59 / #67 a11y** — pure UI / ARIA changes; no auth surface.
- **PRs #61 / #66 component refactors** — orchestrator splits, no API
  surface change.
- **PR #62 hero perf** — `sizes` attr + path fallback; no security surface.
- **PR #63 Sentry wiring** — DSN-gated init confirmed in all three
  `sentry.*.config.ts`, in `src/instrumentation.ts`, and in
  `src/lib/utils/observability.ts:71-73`. Without `SENTRY_DSN`,
  `Sentry.init` never runs and the shim is console-only.
- **PR #63 client-bundle exposure** — `NEXT_PUBLIC_SENTRY_DSN` is the
  only new `NEXT_PUBLIC_*`; DSNs are public by Sentry's design.
- **PR #65 docs only** — no code change.
- **PR #68 new tests** — fixtures inspected: no real DSN, S3 bucket
  name, or Mongo URI. `jest.env.setup.js` uses placeholders only.
  Sentry test mocks at
  `__tests__/components/Admin/{ServiceBookingsClient,ViewingBookingsClient}.test.tsx:25-29`
  flat-mock `@sentry/nextjs` with `jest.fn()`.
- **PR #70 broken-test fixes** — test-side only; no app code touched.
- **PR #71 perf** — `next/dynamic` splits + CSS trim; no API surface.
- **PR #72 husky hook** — runs `lint-staged` + `type-check` on
  `pre-commit`. No env-var leak; documented `--no-verify` escape.

---

## 6. Out of scope

- **All routes / source files not touched by PRs #56-#72.** Pre-existing
  admin endpoints (e.g. `/api/admin/audit`, `/api/admin/users/route.ts`)
  were not re-reviewed beyond confirming the PR-touched changes didn't
  regress them.
- **`src/proxy.ts` CSP / CSRF design** itself was added in earlier PRs
  (#47 and prior). Only its interaction with new code (PR #63 Sentry
  tunnel) was checked.
- **iron-session + NextAuth dual-auth correctness** — covered in earlier
  audit cycles (`CODEBASE_ISSUES.md`, `AUDIT_REPORT.md`). No structural
  change in this cycle.
- **E2E test suite (`e2e/`, `playwright.*.ts`)** — none modified in this
  cycle.
- **`scripts/` and `tools/`** — not reachable from a running deployment;
  reviewed only insofar as they appeared in PR diffs (PR #72 husky
  hook).
- **Live production behaviour** — this is a static review of the
  diff + a single `npm audit`. Findings #4 (Sentry default capture) and
  #8 (tunnelRoute) would benefit from a runtime check against a real
  DSN-configured staging environment.
