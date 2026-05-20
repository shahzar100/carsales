/**
 * Tests for the canonical booking-slot constant (src/lib/utils/bookingSlots.ts)
 *
 * The key invariant: every slot the forms offer is a slot the server-side
 * `validateAppointmentTime` accepts. Day 2 of DAY_PLAN_NEW.md introduced
 * the shared constant precisely to keep these two in lockstep.
 */
import {
  BOOKING_SLOTS,
  BOOKING_SLOT_OPTIONS,
  isValidBookingSlot,
} from "@/lib/utils/bookingSlots";
import { validateAppointmentTime } from "@/lib/utils/validation";

describe("bookingSlots", () => {
  it("exposes on-the-hour slots from 09:00 to 18:00, lunch (13:00) excluded", () => {
    expect(BOOKING_SLOTS).toContain("09:00");
    expect(BOOKING_SLOTS).toContain("18:00");
    expect(BOOKING_SLOTS).not.toContain("13:00");
    // No half-hour slots in the canonical list (see file header).
    expect(BOOKING_SLOTS).not.toContain("09:30");
  });

  it("BOOKING_SLOT_OPTIONS mirrors BOOKING_SLOTS with value === label", () => {
    expect(BOOKING_SLOT_OPTIONS).toHaveLength(BOOKING_SLOTS.length);
    for (const opt of BOOKING_SLOT_OPTIONS) {
      expect(opt.value).toBe(opt.label);
      expect(BOOKING_SLOTS).toContain(opt.value as (typeof BOOKING_SLOTS)[number]);
    }
  });

  it("isValidBookingSlot accepts every canonical slot", () => {
    for (const slot of BOOKING_SLOTS) {
      expect(isValidBookingSlot(slot)).toBe(true);
    }
  });

  it("isValidBookingSlot rejects times outside the canonical list", () => {
    expect(isValidBookingSlot("13:00")).toBe(false);
    expect(isValidBookingSlot("09:30")).toBe(false);
    expect(isValidBookingSlot("08:00")).toBe(false);
    expect(isValidBookingSlot("19:00")).toBe(false);
    expect(isValidBookingSlot("")).toBe(false);
    expect(isValidBookingSlot("invalid")).toBe(false);
  });

  it("every canonical slot passes the server-side validateAppointmentTime", () => {
    // The whole point of the shared constant: a slot a form can offer is
    // always a slot the booking API will accept.
    for (const slot of BOOKING_SLOTS) {
      expect(validateAppointmentTime(slot)).toBe(true);
    }
  });
});
