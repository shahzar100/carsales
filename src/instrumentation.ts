/**
 * Next.js instrumentation hook.
 *
 * Runs once when the server starts (both `next dev` and `next start`),
 * before any request is handled. We use it to trigger the Zod-based
 * environment validation in `src/lib/env.ts` so the process fails fast
 * with a readable error if any required env var is missing or malformed,
 * rather than crashing later inside an API route with a cryptic
 * `undefined` reference.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run on the Node.js server runtime — env validation is irrelevant
  // for Edge runtime and would import Node-only modules (zod is fine,
  // but keeping the guard makes the intent explicit).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // The act of importing `./lib/env` triggers `validateServerEnv()` at
    // its module top-level. If validation fails, the throw propagates
    // up here and aborts boot.
    const { serverEnv } = await import("./lib/env");

    // Touch a value so any tree-shaker/bundler keeps the import.
    void serverEnv.NODE_ENV;
  }
}
