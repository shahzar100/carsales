/**
 * Lightweight error / event logging shim.
 *
 * Today this just calls console.* with structured context. The seam exists
 * so that wiring Sentry (or Datadog, or New Relic) is a one-file edit:
 * implement `logError` and `logEvent` here, leave every call site alone.
 *
 * Sentry wiring is documented in SETUP.md → "Sentry (production error
 * tracking)". The DSN is read from env (SENTRY_DSN) but the SDK is not
 * yet installed — installing @sentry/nextjs and uncommenting the
 * Sentry.captureException / Sentry.addBreadcrumb lines is the only edit
 * required at every call site. (Day 5 / Fix 5.1.)
 */

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
 * Log an error with structured context. Use at every catch boundary that
 * isn't already a thrown server error response.
 */
export function logError(
  error: unknown,
  context: LogContext = {}
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[error]", {
    message,
    stack,
    ...redactObject(context),
  });
}

/**
 * Log an event (info-level). For audit trails like "admin {x} reset password
 * for {y}" — small bursts, mostly for forensic value.
 */
export function logEvent(
  name: string,
  context: LogContext = {}
): void {
  console.log(`[event] ${name}`, redactObject(context));
}
