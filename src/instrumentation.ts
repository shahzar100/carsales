/**
 * Next.js instrumentation hook.
 *
 * Runs once when the server starts (both `next dev` and `next start`),
 * before any request is handled. We use it to:
 *
 *   1. Trigger the Zod-based environment validation in `src/lib/env.ts`
 *      so the process fails fast with a readable error if any required
 *      env var is missing or malformed.
 *   2. Initialise the Sentry SDK for the active runtime (Node.js or
 *      Edge). Init is gated inside each runtime config on `SENTRY_DSN`
 *      being set — if the env var is empty the import resolves cleanly
 *      and the SDK simply never registers, so deployments without a
 *      DSN configured are a true no-op.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
import type { captureRequestError as CaptureRequestError } from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // The act of importing `./lib/env` triggers `validateServerEnv()` at
    // its module top-level. If validation fails, the throw propagates
    // up here and aborts boot.
    const { serverEnv } = await import("./lib/env");

    // Touch a value so any tree-shaker/bundler keeps the import.
    void serverEnv.NODE_ENV;

    // Load the Node.js Sentry init. The file gates `Sentry.init` on the
    // DSN being present, so importing it without `SENTRY_DSN` set is a
    // safe no-op.
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Next.js request-error hook — wired through to Sentry so server-side
 * render errors and route handler errors surface with the request
 * context attached. When the SDK never initialised (no DSN), this is
 * still safe to call: `captureRequestError` short-circuits if Sentry
 * isn't running.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation#onrequesterror-optional
 */
export const onRequestError: typeof CaptureRequestError = async (
  err,
  request,
  context
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
