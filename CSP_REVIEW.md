# CSP and security-header review

**Date:** 2026-05-24
**Branch:** `claude/csp-tighten`
**Scope:** review the existing CSP (issued per-request from `src/proxy.ts`) and the
static security headers (set in `next.config.ts`), identify what can move from
report-only / loose to enforced / strict without breaking the live site, and
apply those changes.

The historical context — why `style-src` still permits `'unsafe-inline'`, why
the report-only mirror exists, why CSP is in `src/proxy.ts` rather than
`next.config.ts` — is in `CLAUDE.md` §11 gotcha #9 and the prose comment at the
top of `src/proxy.ts`. This document is the diff and the rationale.

---

## 1. Current headers — full dump for the record

### From `src/proxy.ts` (per-request, page routes only)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<random>' 'strict-dynamic'
    https://challenges.cloudflare.com [dev only: 'unsafe-eval'];
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://res.cloudinary.com https://*.cloudfront.net data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.s3.*.amazonaws.com https://challenges.cloudflare.com;
  frame-src https://challenges.cloudflare.com;
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self';
  report-uri /api/csp-report

Content-Security-Policy-Report-Only:
  ... identical except `style-src 'self'` (no 'unsafe-inline')
```

### From `next.config.ts` (static, all routes)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-DNS-Prefetch-Control: on
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
(X-Powered-By suppressed via `poweredByHeader: false`)
```

---

## 2. Findings and decisions

### 2.1 `script-src` — drop `'unsafe-inline'`?

- **Current:** `'self' 'nonce-…' 'strict-dynamic' https://challenges.cloudflare.com` plus dev-only `'unsafe-eval'`.
- **Proposed change:** none.
- **Decision:** ALREADY APPLIED. `'unsafe-inline'` is not present in the production directive. The proxy test (`__tests__/utils/proxy.test.ts`) already asserts its absence. No further work.

### 2.2 `script-src` — drop `'unsafe-eval'` entirely?

- **Current:** `'unsafe-eval'` is appended *only* when `process.env.NODE_ENV !== "production"`. Production already excludes it.
- **Decision:** APPLIED (already). Verified by reading `isProduction` ternary in `buildCsp`. Next.js production builds do not require `eval`; Turbopack dev does for HMR.

### 2.3 `style-src` — drop `'unsafe-inline'`?

- **Current:** `'self' 'unsafe-inline'` enforced; `'self'` alone in the report-only mirror.
- **Proposed change:** none today.
- **Decision:** DEFERRED. Three reasons documented at the top of `buildCsp()` in `src/proxy.ts`:
  1. **`motion/react`** injects per-frame inline `style` attributes for transforms/opacity — unavoidable without rewriting every animated component.
  2. **`next/font`** emits inline `<style>` blocks with `@font-face` declarations to avoid CLS.
  3. ~12 hand-written `style={{…}}` attributes with runtime-dynamic values (skeleton widths, toast progress, image-upload percentages, dynamic z-index) that cannot move to Tailwind classes.
- **Future-watch:** the report-only mirror at `report-uri /api/csp-report` already streams `csp_violation` events into the structured log (`src/app/api/csp-report/route.ts` → `logEvent("csp_violation", …)`). Before flipping `style-src` to enforce, monitor for a representative sample window (≥ 1 week of real traffic) and confirm that every reported `violated-directive: style-src` blocked URI maps to one of (a) motion/react, (b) next/font, (c) the documented dynamic style attributes. If a fourth source appears (e.g. a third-party script injecting styles), fix that first.

### 2.4 `connect-src` — tighten to specific hosts?

- **Current:** `'self' https://*.s3.*.amazonaws.com https://challenges.cloudflare.com`.
- **Proposed change:** none.
- **Decision:** REJECTED.
  - **Sentry ingestion** — does not need a connect-src widening because `next.config.ts` sets `tunnelRoute: "/monitoring"` in the Sentry plugin. All Sentry telemetry POSTs leave the browser as same-origin requests to `/monitoring/...` and are forwarded server-side. Adding `https://*.ingest.sentry.io` would be dead weight and could leak the org slug.
  - **Vercel KV** — REST API is called from server-side rate-limiting code (`src/lib/utils/rateLimit.ts`), never from the browser. No `connect-src` entry needed.
  - **S3** — covered by `https://*.s3.*.amazonaws.com`.
  - **Turnstile** — covered.
  - We could tighten `https://*.s3.*.amazonaws.com` to a single bucket via `process.env.S3_BUCKET_NAME`, but the bucket name is sometimes path-style (`s3.<region>.amazonaws.com/<bucket>`) vs vhost-style (`<bucket>.s3.<region>.amazonaws.com`) and we already enumerate both in `next.config.ts:remotePatterns`. The wildcard is intentional and matches the image-host policy; tightening here without an `NEXT_PUBLIC_S3_PUBLIC_HOST` env var (not currently defined) would be brittle.
- **Future-watch:** if/when an `NEXT_PUBLIC_S3_PUBLIC_HOST` is introduced (single canonical S3/CF host for browser uploads), pin `connect-src` and `img-src` to that exact host.

### 2.5 `img-src` — tighten further?

- **Current:** `'self' https://res.cloudinary.com https://*.cloudfront.net data: blob:`.
- **Proposed change:** none.
- **Decision:** REJECTED. The directive does not contain the broad `https:` wildcard the task brief mentioned — it is already an explicit allowlist. `data:` is required for inline placeholder thumbnails generated by `next/image`; `blob:` is needed for client-side preview of admin image uploads before they are pushed to S3. Hosts are pinned: Cloudinary (legacy assets), CloudFront (primary delivery), and we permit `'self'` for `/_next/image` optimised output.
- **Future-watch:** when all legacy Cloudinary images are migrated to S3/CF, drop `https://res.cloudinary.com` from this directive.

### 2.6 `frame-ancestors` — flip to `'none'`?

- **Current:** `'self'`.
- **Proposed change:** `'none'`.
- **Risk:** very low. The site is not embedded in any iframe by any internal page or partner; we do not ship an embed widget. The legacy `X-Frame-Options: SAMEORIGIN` header would already block cross-origin framing in browsers without CSP support, and we are about to tighten that too (§2.10).
- **Decision:** APPLIED. `src/proxy.ts` now emits `frame-ancestors 'none'`. Test added in `__tests__/utils/proxy.test.ts`.

### 2.7 `object-src` and `upgrade-insecure-requests`

- **Current:** neither directive is set; both inherit from `default-src 'self'` (which forbids `<object>`/`<embed>` indirectly) but the report-only mirror loses that protection on `default-src`'s fall-through behaviour.
- **Proposed change:** add `object-src 'none'` and `upgrade-insecure-requests`.
- **Risk:** none. No code path uses `<object>`, `<embed>`, or `<applet>`. The production deployment is HTTPS-only behind Vercel; `upgrade-insecure-requests` is a belt-and-braces backstop against any stray `http://` URL slipping into a future template.
- **Decision:** APPLIED.

### 2.8 `Referrer-Policy`

- **Current:** `origin-when-cross-origin`.
- **Proposed change:** `strict-origin-when-cross-origin`.
- **Risk:** none. The difference is purely subtractive — on HTTPS→HTTP downgrades, the new policy sends no referrer at all (where the old policy still sent the origin). The site is HTTPS-only outbound and no partner uses HTTP, so the downgrade case is hypothetical, but the strict variant is the OWASP-recommended default.
- **Decision:** APPLIED.

### 2.9 `Permissions-Policy`

- **Current:** disables `camera`, `microphone`, `geolocation` only.
- **Proposed change:** also disable `accelerometer`, `autoplay`, `browsing-topics`, `display-capture`, `gyroscope`, `hid`, `interest-cohort`, `magnetometer`, `midi`, `payment`, `publickey-credentials-get`, `screen-wake-lock`, `serial`, `usb`, `xr-spatial-tracking`.
- **Risk:** none verified — the app uses none of these features. Future-watch: if WebAuthn (`publickey-credentials-get`) is added for admin 2FA hardening, lift that one. If a customer-facing Apple Pay / Google Pay flow lands, lift `payment`.
- **Decision:** APPLIED. `interest-cohort` and `browsing-topics` opt the site out of Chrome's behavioural-ad APIs.

### 2.10 `X-Frame-Options`

- **Current:** `SAMEORIGIN`.
- **Proposed change:** `DENY`.
- **Risk:** none — this is the legacy mirror of the new `frame-ancestors 'none'` CSP directive. Same reasoning as §2.6.
- **Decision:** APPLIED.

### 2.11 `Strict-Transport-Security` (HSTS)

- **Current:** `max-age=63072000; includeSubDomains; preload`.
- **Proposed change:** none.
- **Decision:** ALREADY APPLIED. `preload` is **IRREVERSIBLE** once a domain is accepted into the browser preload list (hstspreload.org). It is already enabled in the current production deploy, so the irrevocability bell has already been rung — there is no further action here, but flagging it explicitly so a future revert PR doesn't mistakenly think dropping `preload` is reversible. **IRREVERSIBLE: do not remove `preload` and assume browsers will forget — they will not.**

### 2.12 `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy`

- **Current:** `COOP: same-origin`, `CORP: same-site`. **COEP** deliberately omitted (would block Turnstile and S3 image hosts that do not send CORP headers).
- **Decision:** APPLIED (already). Keep as-is; the rationale comment in `next.config.ts` is preserved.

### 2.13 `X-Powered-By`

- **Current:** suppressed via `poweredByHeader: false`.
- **Decision:** APPLIED (already). Verified PR #42 still in effect.

### 2.14 `X-Content-Type-Options`

- **Current:** `nosniff`.
- **Decision:** APPLIED (already). No change needed.

---

## 3. Summary table

| Header / directive | Status | Notes |
|---|---|---|
| `script-src 'unsafe-inline'` removed | applied previously | nonce + strict-dynamic |
| `script-src 'unsafe-eval'` removed (prod) | applied previously | dev-only for Turbopack |
| `style-src 'unsafe-inline'` removed | DEFERRED | report-only mirror collecting telemetry; see §2.3 |
| `connect-src` tightened to allowlist | rejected | already an allowlist; Sentry tunneled |
| `img-src` tightened | rejected | already pinned to specific hosts |
| `frame-ancestors 'none'` | APPLIED | was `'self'` |
| `object-src 'none'` | APPLIED | new directive |
| `upgrade-insecure-requests` | APPLIED | new directive |
| `Referrer-Policy: strict-origin-when-cross-origin` | APPLIED | was `origin-when-cross-origin` |
| `Permissions-Policy` expanded | APPLIED | covers 18 features now |
| `X-Frame-Options: DENY` | APPLIED | was `SAMEORIGIN` |
| HSTS `preload` | ALREADY APPLIED — **IRREVERSIBLE** | do not remove |
| COOP `same-origin`, CORP `same-site` | applied previously | COEP omitted (Turnstile + S3) |
| `X-Powered-By` suppressed | applied previously | PR #42 |

---

## 4. Future-watch — what to monitor in production CSP reports

`/api/csp-report` writes structured `csp_violation` events into the
observability stream (today: stdout; once Sentry DSN is set:
`Sentry.captureMessage`). Before any further tightening, watch for:

1. **`violated-directive: style-src`** with `blocked-uri` other than
   `inline` / `eval`. Anything pointing at a real URL means a third-party is
   injecting a stylesheet outside our allowlist — fix that first.
2. **`violated-directive: script-src`** with a non-empty `blocked-uri`. The
   nonce should cover all in-house scripts and `strict-dynamic` should
   cover the Next.js hydration chain; a violation here is either a CDN
   change at Cloudflare/Turnstile or evidence of a script-injection
   incident in progress.
3. **`violated-directive: img-src`** with a host outside Cloudinary /
   CloudFront / S3. Most likely a stale `<img>` reference in a marketing
   page; less likely but possible: a content-injection vector via the
   admin BusinessInfo form.
4. **`violated-directive: connect-src`**. Anything unexpected here is
   almost always an analytics script someone bolted on without updating
   the policy; track it down before adding the host to the allowlist.

After a representative window (≥ 1 week of real traffic), revisit §2.3 and
flip `style-src` enforcement if and only if the only reported violations
map to the three documented sources.

---

## 5. Files changed by this PR

- `src/proxy.ts` — `frame-ancestors 'self'` → `'none'`; new `object-src 'none'`; new `upgrade-insecure-requests`.
- `next.config.ts` — `X-Frame-Options SAMEORIGIN` → `DENY`; `Referrer-Policy origin-when-cross-origin` → `strict-origin-when-cross-origin`; `Permissions-Policy` expanded to 18 features.
- `__tests__/utils/proxy.test.ts` — assertions for the three new CSP directives and a sanity check that the report-only mirror keeps emitting the tighter `style-src 'self'`.
- `CSP_REVIEW.md` — this document.
