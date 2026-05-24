/**
 * Sentry server (Node.js runtime) SDK initialisation.
 *
 * Imported from `src/instrumentation.ts` when `NEXT_RUNTIME === "nodejs"`.
 * Gated on `SENTRY_DSN` so the SDK is silent — and adds zero overhead —
 * until the client provisions a real DSN in their environment.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || "";

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    debug: false,
  });
}
