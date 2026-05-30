import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // DENY (rather than SAMEORIGIN) matches the new `frame-ancestors 'none'`
  // CSP directive — the site is never embedded in any iframe, internal or
  // external. Legacy browsers without CSP fall back to this header.
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // strict-origin-when-cross-origin is the modern default: same-origin
  // requests get the full URL as referrer, cross-origin HTTPS requests get
  // just the origin, and HTTPS→HTTP downgrades send no referrer at all.
  // Tightened from `origin-when-cross-origin` 2026-05-24.
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable every feature the app does not use. We do not request the
  // camera, microphone, geolocation, payment APIs, USB, serial, bluetooth,
  // HID, MIDI, or accelerometer/gyroscope at any point. Disabling them
  // means a compromised third-party script (none today, but the limit is
  // there) cannot prompt the user for them. `interest-cohort=()` and
  // `browsing-topics=()` opt out of Chrome's behavioural-ad APIs.
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), browsing-topics=(), camera=(), " +
      "display-capture=(), geolocation=(), gyroscope=(), hid=(), " +
      "interest-cohort=(), magnetometer=(), microphone=(), midi=(), " +
      "payment=(), publickey-credentials-get=(), screen-wake-lock=(), " +
      "serial=(), usb=(), xr-spatial-tracking=()",
  },
  // Cross-origin isolation. COEP is deliberately omitted: enabling
  // `require-corp` would block the Cloudflare Turnstile widget and S3
  // image hosts (neither sends CORP headers), and we have no SAB usage
  // to justify the breakage. `same-origin` for COOP isolates the
  // browsing-context group from any window.opener; `same-site` for CORP
  // still allows our own S3/CloudFront assets.
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  // Content-Security-Policy is set per-request in src/middleware.ts so it
  // can include a fresh `'nonce-...'` for script-src on every page render.
  // See Day 12.1.
];

const nextConfig: NextConfig = {
  // Strip the `X-Powered-By: Next.js` response header. ZAP baseline flagged
  // this 5× as framework disclosure; no functional consumer.
  poweredByHeader: false,
  // Tree-shake barrel imports from large packages — only the icons /
  // helpers actually referenced get bundled, not the whole library.
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  images: {
    // Serve AVIF first, then WebP — smaller payloads at the same quality.
    formats: ["image/avif", "image/webp"],
    // Optimised images are content-addressed; cache them hard (31 days).
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      // Explicit S3 fallback for environments without CloudFront.
      // The CSP `connect-src` already permits these hosts; this
      // aligns the two policies.
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      // Path-style S3 URLs (eu-west-2, etc.).
      {
        protocol: "https",
        hostname: "s3.*.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // /Enquiry duplicated /contact and
      // competed with it on search. 308 preserves any external SEO authority.
      { source: "/Enquiry", destination: "/contact", permanent: true },
    ];
  },
};

/**
 * Wrap the config with Sentry only when a DSN is available at build time.
 * Without a DSN, `withSentryConfig` still works but uploading source maps
 * requires `SENTRY_AUTH_TOKEN` — bailing out here keeps `next build`
 * green for the common pre-DSN deployment path.
 *
 * The Sentry SDK itself is gated separately inside
 * `sentry.{client,server,edge}.config.ts`, so even when we don't wrap,
 * the call sites in observability.ts continue to no-op cleanly.
 */
const sentryDsnAvailable = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);

export default sentryDsnAvailable
  ? withSentryConfig(nextConfig, {
      // The org/project slugs come from the Sentry dashboard once the
      // client provisions the account. They can also be supplied via
      // SENTRY_ORG / SENTRY_PROJECT env vars (which take precedence).
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Source-map upload only runs when SENTRY_AUTH_TOKEN is present;
      // without it the plugin warns but doesn't fail the build.
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      // Tunnel through a same-origin route to dodge ad-blockers eating
      // Sentry's outbound requests.
      tunnelRoute: "/monitoring",
      disableLogger: true,
      // Don't widen the bundle with the Sentry telemetry shim when the
      // client hasn't asked for it.
      telemetry: false,
    })
  : nextConfig;
