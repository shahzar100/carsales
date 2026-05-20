/**
 * CANONICAL APPOINTMENT TIME SLOTS
 *
 * The single source of truth for bookable appointment times, shared by
 * every booking form (service `BookingFlow`, customer `CarViewingForm`,
 * admin `AppointmentForm`) AND the server-side `validateAppointmentTime`
 * check. Because the forms and the validator both derive from this list,
 * a slot offered in a form is always a slot the API will accept — no more
 * "Invalid appointment time" after the customer has filled in every step.
 *
 * Slots are on-the-hour, 09:00–18:00; 13:00 is omitted (lunch). To offer
 * half-hour appointments, add the `:30` entries here — the forms and the
 * validator both pick them up automatically. (If `:30` slots are added,
 * also extend the range map in `formatTime` in `./booking.ts` so the
 * lookup page renders them as a proper one-hour range.)
 */
export const BOOKING_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export type BookingSlot = (typeof BOOKING_SLOTS)[number];

/**
 * Dropdown options with a plain `HH:MM` label — used by the service
 * `BookingFlow` and the admin `AppointmentForm`. (`CarViewingForm` builds
 * its own options with one-hour range labels.)
 */
export const BOOKING_SLOT_OPTIONS = BOOKING_SLOTS.map((value) => ({
  value,
  label: value,
}));

/** True when `time` is one of the canonical bookable slots. */
export function isValidBookingSlot(time: string): boolean {
  return (BOOKING_SLOTS as readonly string[]).includes(time);
}
