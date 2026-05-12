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
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://res.cloudinary.com https://*.cloudfront.net data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.s3.*.amazonaws.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
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
