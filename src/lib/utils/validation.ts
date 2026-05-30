/**
 * INPUT VALIDATION HELPERS
 *
 * Routes do structural validation with Zod (length, type, enum). These
 * helpers add the domain-specific checks that Zod's primitives can't
 * express on their own:
 *
 *   - `validateEmail`    — RFC-ish email regex + lowercasing + trim
 *   - `validatePhone`    — strip non-numeric junk + bounded length
 *   - `sanitizeName`     — character whitelist for human names
 *   - `validateFutureDate` / `validateAppointmentTime` — booking domain
 *
 * Important: these are NOT anti-XSS sanitisers. React escapes output on
 * render, so we don't denylist `<`, `javascript:`, etc. — that approach
 * produces false confidence and missed bypasses. The previous
 * `sanitizeString` helper has been removed; use Zod `.max()` on the
 * route's schema instead.
 */

/**
 * Validate an email and return its normalised (trimmed, lowercased) form.
 * Doesn't claim to be RFC-5322 perfect — good enough to reject obvious
 * garbage at the route boundary while keeping legitimate addresses.
 */
export function validateEmail(email: string): {
  valid: boolean;
  sanitized: string;
} {
  if (typeof email !== "string") return { valid: false, sanitized: "" };
  const sanitized = email.trim().slice(0, 254).toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return { valid: emailRegex.test(sanitized), sanitized };
}

/**
 * Strip a phone number down to digits, +, spaces, and brackets, then
 * verify it looks plausible. Stored as-typed so admins can dial it back
 * without reformatting.
 */
export function validatePhone(phone: string): {
  valid: boolean;
  sanitized: string;
} {
  if (typeof phone !== "string") return { valid: false, sanitized: "" };
  const sanitized = phone.replace(/[^\d+\s()-]/g, "").slice(0, 20);
  const phoneRegex = /^[\d\s+()-]{7,20}$/;
  return { valid: phoneRegex.test(sanitized), sanitized };
}

/**
 * Validate booking reference format (`BK-XXXXXX` or `QT-XXXXXX`).
 */
export function validateBookingReference(ref: string): boolean {
  if (typeof ref !== "string") return false;
  return /^(BK|QT)-[A-Z0-9]{6}$/.test(ref);
}

/**
 * Sanitise a personal name. This is a CHARACTER WHITELIST for what's
 * allowed in a name field, not an XSS filter. Trims, caps length at
 * 100, keeps letters / spaces / hyphens / apostrophes.
 */
export function sanitizeName(name: string): string {
  if (typeof name !== "string") return "";
  return name
    .trim()
    .slice(0, 100)
    .replace(/[^a-zA-Z\s'-]/g, "");
}

/**
 * Validate that a date string is today or later AND within one year.
 *
 * Parses `YYYY-MM-DD` as a local calendar date so
 * a booking for "today" stays accepted up to local midnight — UTC-based
 * comparison previously rejected today's date during BST evenings.
 */
export function validateFutureDate(dateStr: string): boolean {
  try {
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    const date = ymd
      ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
      : new Date(dateStr);
    if (Number.isNaN(date.getTime())) return false;

    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);

    const oneYearFromNow = new Date(todayLocal);
    oneYearFromNow.setFullYear(todayLocal.getFullYear() + 1);

    return date >= todayLocal && date < oneYearFromNow;
  } catch {
    return false;
  }
}

/**
 * Validate that an appointment time is one of the known slots.
 */
export function validateAppointmentTime(time: string): boolean {
  return isValidBookingSlot(time);
}

/**
 * Legacy rate-limit shim — delegates to `createRateLimiter` so behaviour
 * stays consistent across the codebase. Prefer importing `createRateLimiter`
 * from `@/lib/utils/rateLimit` directly in new code.
 */
import { isValidBookingSlot } from "./bookingSlots";
import { createRateLimiter } from "./rateLimit";

const legacyRateLimitCache = new Map<
  string,
  ReturnType<typeof createRateLimiter>
>();

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  const bucketKey = `legacy:${maxRequests}:${windowMs}`;
  let limiter = legacyRateLimitCache.get(bucketKey);
  if (!limiter) {
    limiter = createRateLimiter(bucketKey, { maxRequests, windowMs });
    legacyRateLimitCache.set(bucketKey, limiter);
  }
  const { allowed, remaining } = await limiter.check(identifier);
  return { allowed, remaining };
}

/**
 * @deprecated No-op — the underlying limiter purges lazily on every check.
 * Kept to avoid breaking existing callers.
 */
export function cleanupRateLimits() {
  // Intentionally empty.
}
