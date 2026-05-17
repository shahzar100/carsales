import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
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
  images: {
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
      // Day 3 / WEBSITE_REVIEW #10, #46. /Enquiry duplicated /contact and
      // competed with it on search. 308 preserves any external SEO authority.
      { source: "/Enquiry", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
