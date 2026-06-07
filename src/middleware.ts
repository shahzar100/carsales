import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware.
 *
 * Two concerns live here:
 *   1. CSRF protection for state-changing API calls (legacy behaviour).
 *   2. Per-request CSP nonce so we can drop `'unsafe-inline'` on script-src
 *      (Day 12.1 / Finding #12). The nonce is generated here, written to a
 *      request header so Next.js hydration scripts pick it up, and echoed
 *      into the CSP response header.
 *
 * Other security headers continue to live in next.config.ts; only the CSP
 * has to move because the nonce changes per request.
 */

function buildCsp(nonce: string, opts: { reportOnly: boolean } = { reportOnly: false }): string {
  // Read at call time (not module load) so the CSP follows the current
  // NODE_ENV and stays unit-testable across dev/prod.
  const isProduction = process.env.NODE_ENV === "production";
  // Optional custom CDN host (e.g. a CloudFront alias `cdn.example.com` that
  // isn't a `*.cloudfront.net` hostname). Mirrors next.config remotePatterns
  // so a custom-domain CDN isn't blocked by CSP.
  const cdnHost = process.env.CLOUDFRONT_DOMAIN
    ? ` https://${process.env.CLOUDFRONT_DOMAIN}`
    : "";
  // `'strict-dynamic'` lets scripts loaded by nonced scripts run without
  // their own nonce — required for Next.js's RSC payload script that injects
  // further script tags during hydration. The Cloudflare host is needed for
  // the Turnstile widget; frame-src is needed for the challenge iframe.
  //
  // style-src normally keeps `'unsafe-inline'`. Audited 2026-05-13: 12
  // non-email `style={{...}}` attributes, all with runtime-dynamic values
  // (skeleton widths, toast progress %, image-upload %, dynamic z-index)
  // that can't move to Tailwind classes. `motion/react` adds many more at
  // runtime. `next/font` also injects inline `<style>` blocks with
  // @font-face declarations to avoid CLS. Dropping `'unsafe-inline'` would
  // need every animated component rewritten — cost/benefit doesn't justify
  // it given style-src XSS is a much weaker class than the script-src XSS
  // the nonce above already closes.
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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isProduction ? "" : " 'unsafe-eval'"}`,
    styleSrc,
    // img-src mirrors connect-src + next.config remotePatterns so stored S3 /
    // CloudFront image URLs render even when not proxied through next/image.
    `img-src 'self' https://res.cloudinary.com https://*.cloudfront.net https://*.s3.eu-west-2.amazonaws.com https://s3.eu-west-2.amazonaws.com${cdnHost} data: blob:`,
    "font-src 'self' data:",
    // connect-src governs the admin image uploader's direct browser→S3 PUT
    // (ImageUploader.tsx). CSP host grammar allows a wildcard ONLY as the
    // left-most label, so the old `*.s3.*.amazonaws.com` (two wildcards) was
    // invalid and silently dropped by the browser — which blocked the upload
    // PUT. Region is fixed (AWS_REGION=eu-west-2); pin it and cover both
    // virtual-hosted (`<bucket>.s3.<region>`) and path-style (`s3.<region>`)
    // URLs, mirroring the two patterns in next.config.ts:remotePatterns.
    `connect-src 'self' https://*.s3.eu-west-2.amazonaws.com https://s3.eu-west-2.amazonaws.com https://challenges.cloudflare.com${cdnHost}`,
    "frame-src https://challenges.cloudflare.com",
    // frame-ancestors is meaningless in a report-only policy (browsers ignore
    // it and log a warning), so only emit it in the enforced CSP.
    ...(opts.reportOnly ? [] : ["frame-ancestors 'none'"]),
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

  // ── CSP nonce ──
  // Skip on API routes — they don't render HTML, so the CSP nonce isn't
  // needed and computing one on every API call is wasted work.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const nonce = generateNonce();
  const csp = buildCsp(nonce);
  const cspReportOnly = buildCsp(nonce, { reportOnly: true });

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
