/**
 * Error / event logging shim, wired to Sentry.
 *
 * Public API (`logError`, `logEvent`) is intentionally stable — every
 * call site in the codebase imports from this module, so the signatures
 * must not change.
 *
 * Behaviour:
 *  - Always logs structured, PII-redacted output to console (preserves
 *    the existing dev experience and gives us a fallback for any
 *    environment where Sentry is unavailable).
 *  - When a Sentry DSN is configured at boot (`SENTRY_DSN` on the server,
 *    `NEXT_PUBLIC_SENTRY_DSN` in the browser bundle), `logError`
 *    additionally calls `Sentry.captureException` and `logEvent`
 *    additionally records a `Sentry.addBreadcrumb` so the event trail
 *    is attached to any subsequent captured exception.
 *  - When no DSN is set, the Sentry calls short-circuit: the SDK's
 *    `init` never ran, so its capture functions are quiet no-ops.
 *    This means the client can ship without `SENTRY_DSN` and the
 *    observability layer just falls back to console logging.
 *
 * The Sentry SDK is imported eagerly. Its `Sentry.init` (in
 * `sentry.client.config.ts` / `sentry.server.config.ts` /
 * `sentry.edge.config.ts`) is the actual env-var gate.
 */
import * as Sentry from "@sentry/nextjs";

type LogContext = Record<string, unknown>;

/**
 * Redacts known-PII keys from the context object before logging. Add keys
 * here as the surface area grows. The point is that log calls don't have
 * to remember which fields are sensitive.
 */
const PII_KEYS = new Set([
  "email",
  "customerEmail",
  "customerName",
  "customerPhone",
  "phone",
  "password",
  "passwordHash",
  "token",
  "sessionToken",
  "Authorization",
  "authorization",
  "cookie",
  "Cookie",
]);

function redactObject(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = PII_KEYS.has(k) ? "[redacted]" : redact(v);
  }
  return out;
}

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);
  return redactObject(value as Record<string, unknown>);
}

/**
 * True when a Sentry DSN was provided at boot. Used to skip the (cheap
 * but pointless) capture calls when the SDK is dormant — they would be
 * no-ops anyway, this just makes the intent explicit.
 */
const sentryEnabled = Boolean(
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
);

/**
 * Log an error with structured context. Use at every catch boundary that
 * isn't already a thrown server error response.
 */
export function logError(
  error: unknown,
  context: LogContext = {}
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const safeContext = redactObject(context);

  console.error("[error]", {
    message,
    stack,
    ...safeContext,
  });

  if (sentryEnabled) {
    Sentry.captureException(error, {
      extra: safeContext,
    });
  }
}

/**
 * Log an event (info-level). For audit trails like "admin {x} reset password
 * for {y}" — small bursts, mostly for forensic value.
 */
export function logEvent(
  name: string,
  context: LogContext = {}
): void {
  const safeContext = redactObject(context);
  console.log(`[event] ${name}`, safeContext);

  if (sentryEnabled) {
    // Breadcrumbs trail every captured exception with the recent event
    // history — much more useful than a standalone capture for audit logs.
    Sentry.addBreadcrumb({
      category: "event",
      message: name,
      level: "info",
      data: safeContext,
    });
  }
}
