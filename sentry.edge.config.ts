/**
 * Sentry edge runtime SDK initialisation.
 *
 * Imported from `src/instrumentation.ts` when `NEXT_RUNTIME === "edge"`.
 * Same DSN gate as the server config — without `SENTRY_DSN` set the
 * SDK never initialises and the call is effectively a no-op.
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
