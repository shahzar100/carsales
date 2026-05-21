/**
 * BUSINESS HOURS — open / closed status
 *
 * Derives "are we open right now / when do we open / close" from the
 * `businessInfo.hours` map (e.g. `{ monday: "9:00 AM - 6:00 PM", … }`)
 * instead of hard-coding "Open now / 7pm" into the UI. Keeping the source
 * of truth in the admin-editable business info means the displayed status
 * stays correct when the hours change.
 */

import type { BusinessHours } from "@/lib/interfaces";

export interface OpenStatus {
  /** True if `now` falls within today's opening window. */
  isOpen: boolean;
  /** Today's closing time as written ("6:00 PM"), or null if closed/unknown. */
  closesAt: string | null;
  /** Today's opening time as written ("9:00 AM"), or null if closed/unknown. */
  opensAt: string | null;
}

// Date.getDay(): 0 = Sunday … 6 = Saturday.
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/**
 * Parse a clock string — "9:00 AM", "6 PM", "17:00" — to minutes since
 * midnight. Returns null for anything it can't parse (incl. "Closed").
 */
function parseClock(raw: string): number | null {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(raw.trim());
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "am" && hours === 12) hours = 0;
    if (meridiem === "pm" && hours !== 12) hours += 12;
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Given a business-hours map and a moment in time, report whether the
 * business is currently open plus today's open / close times.
 *
 * Missing input, a missing day, a "Closed" day, or an unparseable entry
 * all return a safe `{ isOpen: false, closesAt: null, opensAt: null }` —
 * callers render a neutral fallback rather than a wrong claim.
 */
export function getOpenStatus(
  hours: Partial<BusinessHours> | null | undefined,
  now: Date = new Date()
): OpenStatus {
  const closed: OpenStatus = { isOpen: false, closesAt: null, opensAt: null };
  if (!hours) return closed;

  const todayRaw = hours[DAY_KEYS[now.getDay()]];
  if (!todayRaw || /closed/i.test(todayRaw)) return closed;

  // Split "9:00 AM - 6:00 PM" on a hyphen / en dash / em dash.
  const parts = todayRaw.split(/\s*[-–—]\s*/);
  if (parts.length !== 2) return closed;

  const open = parseClock(parts[0]);
  const close = parseClock(parts[1]);
  if (open === null || close === null) return closed;

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return {
    isOpen: minutesNow >= open && minutesNow < close,
    opensAt: parts[0].trim(),
    closesAt: parts[1].trim(),
  };
}
