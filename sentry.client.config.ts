/**
 * Sentry client SDK initialisation.
 *
 * Loaded by Next.js into every client bundle. The init call is gated on
 * `NEXT_PUBLIC_SENTRY_DSN` (or `SENTRY_DSN` inlined at build time) so
 * deployments without a DSN configured are a true no-op — the SDK
 * registers nothing and `Sentry.captureException` becomes a quiet
 * passthrough rather than throwing.
 *
 * The matching server / edge configs live alongside this file.
 */
import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || "";

if (dsn) {
  Sentry.init({
    dsn,
    // Conservative defaults — the client can dial these up later.
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    environment: process.env.NODE_ENV,
    // Don't ship debug logs to the browser console in production.
    debug: false,
  });
}
