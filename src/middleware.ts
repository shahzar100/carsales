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

const isProduction = process.env.NODE_ENV === "production";

function buildCsp(nonce: string): string {
  // `'strict-dynamic'` lets scripts loaded by nonced scripts run without
  // their own nonce — required for Next.js's RSC payload script that injects
  // further script tags during hydration. The Cloudflare host is needed for
  // the Turnstile widget; frame-src is needed for the challenge iframe.
  //
  // style-src keeps `'unsafe-inline'`. Audited 2026-05-13: 12 non-email
  // `style={{...}}` attributes, all with runtime-dynamic values
  // (skeleton widths, toast progress %, image-upload %, dynamic z-index)
  // that can't move to Tailwind classes. `next/font` also injects inline
  // `<style>` blocks with @font-face declarations to avoid CLS. Dropping
  // `'unsafe-inline'` would need a per-build hash allow-list and a
  // refactor of every dynamic inline style — the cost/benefit doesn't
  // justify it given style-src XSS is a much weaker class of attack than
  // the script-src XSS that the nonce above already closes.
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isProduction ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://res.cloudinary.com https://*.cloudfront.net data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.s3.*.amazonaws.com https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
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

    if (!isCronRoute) {
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
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
