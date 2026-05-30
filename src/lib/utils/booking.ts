import { v4 as uuidv4 } from "uuid";

export function generateBookingReference(): string {
  // Generate a unique booking reference in format: BK-XXXXXX
  const uuid = uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase();
  return `BK-${uuid}`;
}

export function generateQuoteReference(): string {
  // Generate a unique quote reference in format: QT-XXXXXX
  const uuid = uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase();
  return `QT-${uuid}`;
}

/**
 * (#30) Reservation reference — `RS-XXXXXX`. Same shape as bookings so
 * the lookup UI can validate against a regex family without per-type
 * branching.
 */
export function generateReservationReference(): string {
  const uuid = uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase();
  return `RS-${uuid}`;
}

/**
 * (#31) Part-exchange enquiry reference — `PX-XXXXXX`.
 */
export function generatePartExchangeReference(): string {
  const uuid = uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase();
  return `PX-${uuid}`;
}

/**
 * Format a date for booking-related UI (lookup page, confirmation emails).
 *
 * Uses UK long form — e.g. `"Saturday, 25 December 2024"`. The non-booking
 * formatters in `src/lib/utils/format.ts` are also en-GB; this one is kept
 * separate because the booking flow specifically wants the long form.
 *
 * `YYYY-MM-DD` inputs (the shape `<input type="date">` produces) are parsed
 * as a *local* calendar day. `new Date("2026-03-25")` parses as UTC
 * midnight, which in BST renders as 24 March — wrong day on every
 * confirmation email through the summer.
 */
export function formatDate(date: string): string {
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const d = ymd
    ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    : new Date(date);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a 24-hour booking slot key (e.g. `"09:00"`) as a UK 24-hour time
 * range covering the one-hour appointment window — `"09:00–10:00"`.
 *
 * The dash is an en-dash (U+2013), the standard separator for time ranges
 * in UK style guides. Unmapped values pass through unchanged.
 */
export function formatTime(time: string): string {
  const timeFormats: { [key: string]: string } = {
    "09:00": "09:00–10:00",
    "10:00": "10:00–11:00",
    "11:00": "11:00–12:00",
    "12:00": "12:00–13:00",
    "14:00": "14:00–15:00",
    "15:00": "15:00–16:00",
    "16:00": "16:00–17:00",
    "17:00": "17:00–18:00",
    "18:00": "18:00–19:00",
  };
  return timeFormats[time] || time;
}
