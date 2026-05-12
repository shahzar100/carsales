/**
 * Display formatting helpers for the customer-facing site and admin dashboard.
 *
 * Locale: en-GB (matches the business — Morley Motor Company is UK-based).
 * Currency: GBP.
 *
 * Note: booking-specific time-slot formatting and en-US long-form date
 * formatting live in `src/lib/utils/booking.ts` and are intentionally kept
 * separate. Those formats are baked into email templates and the booking
 * lookup UX, so they stay where they are.
 */

const GBP_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("en-GB");

/**
 * Format a number as GBP with no decimals — e.g. `12500` → `"£12,500"`.
 *
 * Returns `"£0"` for null/undefined/NaN so callers don't have to guard.
 */
export function formatPrice(price: number | null | undefined): string {
  if (price == null || Number.isNaN(price)) return "£0";
  return GBP_FORMATTER.format(price);
}

/**
 * Format a mileage figure as a localised number — e.g. `42000` → `"42,000"`.
 *
 * Does not include a unit suffix; pass through `${formatMileage(mi)} miles`
 * at the call site so the noun matches the surrounding copy.
 */
export function formatMileage(mileage: number | null | undefined): string {
  if (mileage == null || Number.isNaN(mileage)) return "0";
  return NUMBER_FORMATTER.format(mileage);
}

/**
 * Date format style.
 *
 * - `"short"`  → `"15 Jun 2024"`           (tables, list cards)
 * - `"medium"` → `"Sat, 15 Jun"`           (dashboard activity)
 * - `"long"`   → `"Saturday, 15 June 2024"` (booking confirmations,
 *                                            customer-facing summaries)
 */
export type DateFormatStyle = "short" | "medium" | "long";

const DATE_FORMAT_OPTIONS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> =
  {
    short: { day: "2-digit", month: "short", year: "numeric" },
    medium: { weekday: "short", day: "numeric", month: "short" },
    long: {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  };

/**
 * Format a date string or Date as a UK-locale date.
 *
 * Returns `"—"` for empty/null/invalid input so it's safe to use directly
 * in tables and cards without conditional rendering.
 */
export function formatDate(
  date: string | Date | null | undefined,
  style: DateFormatStyle = "short"
): string {
  if (date == null || date === "") return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", DATE_FORMAT_OPTIONS[style]);
}

/**
 * Format a 24-hour time string (`"HH:MM"`) as a 12-hour time with meridiem.
 *
 * E.g. `"09:00"` → `"9:00 AM"`, `"14:30"` → `"2:30 PM"`.
 *
 * For booking-specific time-range slots (`"15:00–16:00"`), use `formatTime`
 * from `src/lib/utils/booking.ts` instead — that one is keyed to the fixed
 * slot grid the booking forms use and returns the full one-hour window.
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return time;
  const hour = parseInt(match[1], 10);
  const minute = match[2];
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return time;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${minute} ${meridiem}`;
}

/**
 * Format a date as a relative time string — `"4 min ago"`, `"2 days ago"`,
 * `"in 3 hours"`, `"just now"`.
 *
 * Useful for activity feeds and "last updated" timestamps. For absolute
 * dates (booking dates, listing creation) use {@link formatDate} instead.
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  now: Date = new Date()
): string {
  if (date == null || date === "") return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = d.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const isPast = diffMs < 0;

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;

  if (absMs < 30 * SECOND) return "just now";

  const pick = (value: number, unit: string): string => {
    const rounded = Math.floor(value);
    const plural = rounded === 1 ? unit : `${unit}s`;
    return isPast ? `${rounded} ${plural} ago` : `in ${rounded} ${plural}`;
  };

  if (absMs < MINUTE) return pick(absMs / SECOND, "second");
  if (absMs < HOUR) return pick(absMs / MINUTE, "minute");
  if (absMs < DAY) return pick(absMs / HOUR, "hour");
  if (absMs < WEEK) return pick(absMs / DAY, "day");
  return formatDate(d, "short");
}
