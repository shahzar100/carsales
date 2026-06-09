import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware.
 *
 * Two concerns live here:
 *   1. CSRF protection for state-changing API calls (legacy behaviour).
 *   2. A two-tier Content-Security-Policy (Day 12.1 / Finding #12, revised).
 *
 * ── Why two tiers ──
 * A per-request nonce on `script-src` is the strongest protection, but it only
 * works on *dynamically rendered* pages: Next.js stamps the nonce onto <script>
 * tags by reading the request-header CSP at render time. Statically prerendered
 * pages are built once with NO request and therefore NO nonce; bolting a
 * per-request nonce + 'strict-dynamic' onto that frozen HTML blocks every
 * script (the bug this revision fixes — all prerendered marketing pages shipped
 * dead JS in production).
 *
 * The public marketing pages are deliberately static for throughput (PR #49,
 * no force-dynamic). So we split by path:
 *   • /admin/*  → nonce + 'strict-dynamic'. Always dynamic (every admin page
 *     reads the iron-session cookie), so the nonce injects correctly. This is
 *     the authenticated, high-value surface where strict script-src matters.
 *   • everything else → 'self' 'unsafe-inline', no nonce. Stays static + CDN
 *     cacheable. React auto-escaping + Zod input validation carry the XSS load
 *     on these pages; the inline-script risk is the accepted trade for static
 *     rendering.
 *
 * INVARIANT: every /admin/* page must stay dynamically rendered. If one is ever
 * statically prerendered it will break exactly like the public pages did — keep
 * the cookie/auth read (or an explicit `export const dynamic = "force-dynamic"`)
 * in admin server components.
 *
 * Other security headers continue to live in next.config.ts; only the CSP
 * has to move because the nonce changes per request.
 */

type CspOptions =
  | { mode: "nonce"; nonce: string; reportOnly?: boolean }
  | { mode: "static"; reportOnly?: boolean };

function buildCsp(opts: CspOptions): string {
  const reportOnly = opts.reportOnly ?? false;
  // Read at call time (not module load) so the CSP follows the current
  // NODE_ENV and stays unit-testable across dev/prod.
  const isProduction = process.env.NODE_ENV === "production";
  // Optional custom CDN host (e.g. a CloudFront alias `cdn.example.com` that
  // isn't a `*.cloudfront.net` hostname). Mirrors next.config remotePatterns
  // so a custom-domain CDN isn't blocked by CSP.
  const cdnHost = process.env.CLOUDFRONT_DOMAIN
    ? ` https://${process.env.CLOUDFRONT_DOMAIN}`
    : "";
  // S3 image/upload hosts are region-specific. Read AWS_REGION at call time
  // (like the rest of this builder) so a region change flows through both
  // tiers of the CSP and stays in sync with next.config.ts:remotePatterns,
  // which reads the same env. Falls back to eu-west-2 so behaviour is
  // unchanged when AWS_REGION is unset.
  const awsRegion = process.env.AWS_REGION || "eu-west-2";
  // 'unsafe-eval' is only tolerated in dev (React refresh / source maps).
  const devEval = isProduction ? "" : " 'unsafe-eval'";
  // script-src is the only directive that differs by tier.
  //   • nonce mode: `'strict-dynamic'` lets scripts loaded by nonced scripts
  //     run without their own nonce — required for Next.js's RSC payload script
  //     that injects further script tags during hydration. Host allowlists are
  //     ignored under 'strict-dynamic', so the nonce is the sole gate.
  //   • static mode: no nonce can match the build-time HTML, so fall back to
  //     'self' (the same-origin /_next/static chunks) + 'unsafe-inline' (the
  //     inline RSC bootstrap scripts Next emits). 'strict-dynamic' is omitted
  //     because it would disable the 'self'/'unsafe-inline' allowlist.
  // The Cloudflare host is needed for the Turnstile widget in both tiers;
  // frame-src below is needed for the challenge iframe.
  const scriptSrc =
    opts.mode === "nonce"
      ? `script-src 'self' 'nonce-${opts.nonce}' 'strict-dynamic' https://challenges.cloudflare.com${devEval}`
      : `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${devEval}`;
  //
  // style-src normally keeps `'unsafe-inline'`. Audited 2026-05-13: 12
  // non-email `style={{...}}` attributes, all with runtime-dynamic values
  // (skeleton widths, toast progress %, image-upload %, dynamic z-index)
  // that can't move to Tailwind classes. `motion/react` adds many more at
  // runtime. `next/font` also injects inline `<style>` blocks with
  // @font-face declarations to avoid CLS. Dropping `'unsafe-inline'` would
  // need every animated component rewritten — cost/benefit doesn't justify
  // it given style-src XSS is a much weaker class than the script-src risk
  // handled above.
  //
  // We still emit a Content-Security-Policy-Report-Only mirror with the
  // tighter `style-src 'self'` so we gather telemetry on what would break
  // before we flip to enforce. Reports go to /api/csp-report.
  const styleSrc = opts.reportOnly ? "style-src 'self'" : "style-src 'self' 'unsafe-inline'";
  // frame-ancestors 'none' is the strict equivalent of X-Frame-Options: DENY.
  // The site is never embedded in an iframe (no partner widgets, no parent
  // dashboard). X-Frame-Options is set to DENY in next.config.ts so legacy
  // browsers without CSP support still get the same protection. Tightened
  // from `'self'` 2026-05-24.
  //
  // object-src 'none' kills <object>/<embed>/<applet> plugin loading — we
  // never use these and they are a legacy XSS surface.
  //
  // upgrade-insecure-requests rewrites any stray http:// asset references
  // to https://; the production deployment is HTTPS-only behind Vercel.
  const directives = [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    // img-src mirrors connect-src + next.config remotePatterns so stored S3 /
    // CloudFront image URLs render even when not proxied through next/image.
    `img-src 'self' https://res.cloudinary.com https://*.cloudfront.net https://*.s3.${awsRegion}.amazonaws.com https://s3.${awsRegion}.amazonaws.com${cdnHost} data: blob:`,
    "font-src 'self' data:",
    // connect-src governs the admin image uploader's direct browser→S3 PUT
    // (ImageUploader.tsx). CSP host grammar allows a wildcard ONLY as the
    // left-most label, so the old `*.s3.*.amazonaws.com` (two wildcards) was
    // invalid and silently dropped by the browser — which blocked the upload
    // PUT. Pin the region from AWS_REGION (default eu-west-2) and cover both
    // virtual-hosted (`<bucket>.s3.<region>`) and path-style (`s3.<region>`)
    // URLs, mirroring the two patterns in next.config.ts:remotePatterns.
    `connect-src 'self' https://*.s3.${awsRegion}.amazonaws.com https://s3.${awsRegion}.amazonaws.com https://challenges.cloudflare.com${cdnHost}`,
    "frame-src https://challenges.cloudflare.com",
    // frame-ancestors is meaningless in a report-only policy (browsers ignore
    // it and log a warning), so only emit it in the enforced CSP.
    ...(reportOnly ? [] : ["frame-ancestors 'none'"]),
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // Prod is HTTPS-only behind Vercel; in dev the server speaks plain HTTP,
    // so emitting this would upgrade http://localhost asset requests to https
    // and break every fetch (CSS + JS) with a TLS error. Gate to production.
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
    "report-uri /api/csp-report",
  ];
  return directives.join("; ");
}

function generateNonce(): string {
  // Edge runtime supports Web Crypto. 16 random bytes base64 → 24 chars.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function middleware(request: NextRequest) {
  // ── CSRF protection (state-changing API calls only) ──
  if (
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method) &&
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const isCronRoute = request.nextUrl.pathname.startsWith("/api/cron/");
    // Browsers POST CSP violation reports without an Origin header, so the
    // same-origin check below would 403 them — which is exactly what was
    // happening, silently dropping all report-only telemetry. The endpoint is
    // designed as unauthenticated browser telemetry (see api/csp-report), so
    // exempt it from CSRF like the cron routes.
    const isCspReportRoute = request.nextUrl.pathname === "/api/csp-report";

    if (!isCronRoute && !isCspReportRoute) {
      if (!origin) {
        return NextResponse.json(
          { error: "Missing Origin header" },
          { status: 403 }
        );
      }
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: "CSRF validation failed" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "CSRF validation failed" },
          { status: 403 }
        );
      }
    }
  }

  // ── CSP ──
  // Skip on API routes — they don't render HTML, so the CSP isn't needed and
  // computing one on every API call is wasted work.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Static (public) tier: a fixed, nonce-free policy that survives prerendering
  // and CDN caching. We deliberately do NOT write the CSP onto the request
  // headers here — that header is only how Next.js discovers a nonce to inject,
  // and we want no nonce on these pages so 'unsafe-inline' stays effective.
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    const csp = buildCsp({ mode: "static" });
    const cspReportOnly = buildCsp({ mode: "static", reportOnly: true });
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("Content-Security-Policy-Report-Only", cspReportOnly);
    return response;
  }

  // Nonce tier: /admin/* is always dynamically rendered, so Next.js stamps this
  // per-request nonce onto every <script> when it reads the request-header CSP.
  const nonce = generateNonce();
  const csp = buildCsp({ mode: "nonce", nonce });
  const cspReportOnly = buildCsp({ mode: "nonce", nonce, reportOnly: true });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Content-Security-Policy-Report-Only", cspReportOnly);
  return response;
}

export const config = {
  // Match everything except static assets, the favicon, and image-optim
  // routes so the CSP applies to every HTML response. Excluded paths still
  // get headers from next.config.ts.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)).*)",
  ],
};
