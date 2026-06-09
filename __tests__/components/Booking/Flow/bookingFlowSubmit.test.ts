/**
 * @jest-environment node
 *
 * Tests for the booking-flow orchestration helpers
 * (src/components/Booking/Flow/bookingFlowSubmit.ts).
 *
 * Standards coverage:
 * - 📋 Functional: vehicle/schedule/contact validators return the correct
 *   message-or-null; submitBooking posts the right payload to the right
 *   endpoint per purpose ("quote" vs "book") and resolves with the reference.
 * - 🛡️ Security: submitBooking forwards the turnstileToken and surfaces the
 *   server-provided error verbatim (with a safe fallback) on failure.
 * - 👤 Usability: every invalid-input branch yields a human-readable error
 *   string; "quote" purpose deliberately bypasses date/time scheduling.
 */
import {
  validateVehicle,
  validateSchedule,
  validateContact,
  submitBooking,
} from "@/components/Booking/Flow/bookingFlowSubmit";
import { INITIAL, today } from "@/components/Booking/Flow/bookingFlowTypes";
import type { BookingState } from "@/components/Booking/Flow/bookingFlowTypes";
import type { LucideIcon } from "lucide-react";

// Small helper: a fully-valid base state we can override per test.
const CURRENT_YEAR = 2026;

const validBase: BookingState = {
  ...INITIAL,
  service: "detailing",
  packageId: "bronze",
  vehicleMake: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: "2020",
  vehicleReg: "AB12 CDE",
  date: "2099-01-01",
  time: "10:00",
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "07123 456789",
  purpose: "book",
};

describe("bookingFlowSubmit", () => {
  describe("validateVehicle", () => {
    it("returns null when make, model, and a valid year are present", () => {
      expect(validateVehicle(validBase, CURRENT_YEAR)).toBeNull();
    });

    it("requires the vehicle make (rejects empty / whitespace-only)", () => {
      expect(
        validateVehicle({ ...validBase, vehicleMake: "" }, CURRENT_YEAR)
      ).toBe("Vehicle make is required");
      expect(
        validateVehicle({ ...validBase, vehicleMake: "   " }, CURRENT_YEAR)
      ).toBe("Vehicle make is required");
    });

    it("requires the vehicle model (rejects empty / whitespace-only)", () => {
      expect(
        validateVehicle({ ...validBase, vehicleModel: "" }, CURRENT_YEAR)
      ).toBe("Vehicle model is required");
      expect(
        validateVehicle({ ...validBase, vehicleModel: "  " }, CURRENT_YEAR)
      ).toBe("Vehicle model is required");
    });

    it("requires the vehicle year", () => {
      expect(
        validateVehicle({ ...validBase, vehicleYear: "" }, CURRENT_YEAR)
      ).toBe("Vehicle year is required");
    });

    it("rejects a year before 1900", () => {
      expect(
        validateVehicle({ ...validBase, vehicleYear: "1899" }, CURRENT_YEAR)
      ).toBe(`Year must be between 1900 and ${CURRENT_YEAR + 1}`);
    });

    it("rejects a year beyond currentYear + 1", () => {
      expect(
        validateVehicle(
          { ...validBase, vehicleYear: String(CURRENT_YEAR + 2) },
          CURRENT_YEAR
        )
      ).toBe(`Year must be between 1900 and ${CURRENT_YEAR + 1}`);
    });

    it("accepts the inclusive boundaries 1900 and currentYear + 1", () => {
      expect(
        validateVehicle({ ...validBase, vehicleYear: "1900" }, CURRENT_YEAR)
      ).toBeNull();
      expect(
        validateVehicle(
          { ...validBase, vehicleYear: String(CURRENT_YEAR + 1) },
          CURRENT_YEAR
        )
      ).toBeNull();
    });
  });

  describe("validateSchedule", () => {
    it("bypasses all scheduling checks when purpose is 'quote'", () => {
      // Even with no date and no time, a quote needs no appointment.
      const quote: BookingState = {
        ...validBase,
        purpose: "quote",
        date: "",
        time: "",
      };
      expect(validateSchedule(quote)).toBeNull();
    });

    it("requires a date for a booking", () => {
      expect(validateSchedule({ ...validBase, date: "" })).toBe(
        "Please select a date"
      );
    });

    it("rejects a date in the past", () => {
      expect(validateSchedule({ ...validBase, date: "2000-01-01" })).toBe(
        "Date cannot be in the past"
      );
    });

    it("accepts today's date as not-in-the-past", () => {
      // today() is the lower bound; equal-to-today must pass the < check.
      expect(
        validateSchedule({ ...validBase, date: today(), time: "10:00" })
      ).toBeNull();
    });

    it("requires a time when the date is valid", () => {
      expect(
        validateSchedule({ ...validBase, date: "2099-01-01", time: "" })
      ).toBe("Please select a time");
    });

    it("returns null for a complete future booking", () => {
      expect(validateSchedule(validBase)).toBeNull();
    });
  });

  describe("validateContact", () => {
    it("returns null for a complete, well-formed contact", () => {
      expect(validateContact(validBase)).toBeNull();
    });

    it("requires the full name", () => {
      expect(validateContact({ ...validBase, name: "" })).toBe(
        "Full name is required"
      );
      expect(validateContact({ ...validBase, name: "   " })).toBe(
        "Full name is required"
      );
    });

    it("requires an email address", () => {
      expect(validateContact({ ...validBase, email: "" })).toBe(
        "Email address is required"
      );
      expect(validateContact({ ...validBase, email: "  " })).toBe(
        "Email address is required"
      );
    });

    it("rejects a malformed email address", () => {
      expect(validateContact({ ...validBase, email: "not-an-email" })).toBe(
        "Please enter a valid email address"
      );
      expect(validateContact({ ...validBase, email: "missing@domain" })).toBe(
        "Please enter a valid email address"
      );
      expect(validateContact({ ...validBase, email: "a b@c.com" })).toBe(
        "Please enter a valid email address"
      );
    });

    it("requires a phone number", () => {
      expect(validateContact({ ...validBase, phone: "" })).toBe(
        "Phone number is required"
      );
      expect(validateContact({ ...validBase, phone: "   " })).toBe(
        "Phone number is required"
      );
    });

    it("rejects a malformed phone number (too short / illegal chars)", () => {
      expect(validateContact({ ...validBase, phone: "123" })).toBe(
        "Please enter a valid phone number"
      );
      expect(validateContact({ ...validBase, phone: "07abc123456" })).toBe(
        "Please enter a valid phone number"
      );
    });

    it("accepts phone numbers with spaces, plus, parens, and dashes", () => {
      expect(
        validateContact({ ...validBase, phone: "+44 (0)7123-456789" })
      ).toBeNull();
    });
  });

  describe("submitBooking", () => {
    const selectedService = { key: "detailing" as const };
    const selectedPackage = {
      id: "bronze",
      name: "Bronze",
      description: "Entry detailing package",
      duration: "1 hour",
      price: "£50",
      // `icon` is required on PackageCardData; submitBooking never reads it,
      // so a typed placeholder keeps the fixture valid without a runtime icon.
      icon: (() => null) as unknown as LucideIcon,
    };

    afterEach(() => {
      jest.restoreAllMocks();
      // Clear the fetch mock between tests.
      // @ts-expect-error - test-only global assignment cleanup
      delete global.fetch;
    });

    function mockFetchOk(data: Record<string, unknown>) {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data }),
      });
      global.fetch = fetchMock as unknown as typeof fetch;
      return fetchMock;
    }

    describe("purpose: 'quote'", () => {
      it("POSTs to /api/bookings/quote with the quote payload and returns quoteReference", async () => {
        const fetchMock = mockFetchOk({ quoteReference: "Q-1" });

        const ref = await submitBooking({
          data: { ...validBase, purpose: "quote", serviceDetails: "Notes" },
          selectedService,
          selectedPackage,
          turnstileToken: "tok-123",
        });

        expect(ref).toBe("Q-1");
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("/api/bookings/quote");
        expect(init.method).toBe("POST");
        expect(init.headers["Content-Type"]).toBe("application/json");

        const body = JSON.parse(init.body);
        expect(body.customerInfo).toEqual({
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "07123 456789",
        });
        expect(body.serviceType).toBe("Detailing — Bronze");
        expect(body.serviceDetails).toBe("Notes");
        expect(body.vehicle).toEqual({
          make: "Toyota",
          model: "Corolla",
          year: "2020",
          registration: "AB12 CDE",
        });
        expect(body.turnstileToken).toBe("tok-123");
        // Quote payload carries no appointment fields.
        expect(body.appointmentDate).toBeUndefined();
        expect(body.appointmentTime).toBeUndefined();
      });

      it("defaults serviceDetails to '' and registration to undefined when absent", async () => {
        const fetchMock = mockFetchOk({ quoteReference: "Q-2" });

        await submitBooking({
          data: {
            ...validBase,
            purpose: "quote",
            serviceDetails: "",
            vehicleReg: "",
          },
          selectedService,
          selectedPackage,
          turnstileToken: undefined,
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.serviceDetails).toBe("");
        // empty reg → undefined → dropped by JSON.stringify
        expect("registration" in body.vehicle).toBe(false);
        expect("turnstileToken" in body).toBe(false);
      });

      it("throws the server error message when result.success is false", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ success: false, error: "Rate limited" }),
        }) as unknown as typeof fetch;

        await expect(
          submitBooking({
            data: { ...validBase, purpose: "quote" },
            selectedService,
            selectedPackage,
            turnstileToken: "tok",
          })
        ).rejects.toThrow("Rate limited");
      });

      it("throws a fallback message when the response is not ok and no error is given", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ success: false }),
        }) as unknown as typeof fetch;

        await expect(
          submitBooking({
            data: { ...validBase, purpose: "quote" },
            selectedService,
            selectedPackage,
            turnstileToken: undefined,
          })
        ).rejects.toThrow("Failed to submit quote request");
      });
    });

    describe("purpose: 'book'", () => {
      it("POSTs to /api/bookings/service with appointment fields and returns bookingReference", async () => {
        const fetchMock = mockFetchOk({ bookingReference: "BK-1" });

        const ref = await submitBooking({
          data: { ...validBase, serviceDetails: "Extra notes" },
          selectedService,
          selectedPackage,
          turnstileToken: "tok-xyz",
        });

        expect(ref).toBe("BK-1");
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("/api/bookings/service");
        expect(init.method).toBe("POST");

        const body = JSON.parse(init.body);
        expect(body.serviceType).toBe("Detailing — Bronze");
        expect(body.appointmentDate).toBe("2099-01-01");
        expect(body.appointmentTime).toBe("10:00");
        expect(body.turnstileToken).toBe("tok-xyz");
        // serviceDetails is assembled from vehicle + reg + notes, newline-joined.
        expect(body.serviceDetails).toBe(
          "Vehicle: 2020 Toyota Corolla\nReg: AB12 CDE\nExtra notes"
        );
      });

      it("omits the Reg line and empty notes from the assembled serviceDetails", async () => {
        const fetchMock = mockFetchOk({ bookingReference: "BK-2" });

        await submitBooking({
          data: { ...validBase, vehicleReg: "", serviceDetails: "" },
          selectedService,
          selectedPackage,
          turnstileToken: undefined,
        });

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        // Only the vehicle line survives the .filter(Boolean).
        expect(body.serviceDetails).toBe("Vehicle: 2020 Toyota Corolla");
      });

      it("throws the server error message when result.success is false", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ success: false, error: "Slot taken" }),
        }) as unknown as typeof fetch;

        await expect(
          submitBooking({
            data: validBase,
            selectedService,
            selectedPackage,
            turnstileToken: "tok",
          })
        ).rejects.toThrow("Slot taken");
      });

      it("throws a fallback message when the response is not ok and no error is given", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ success: false }),
        }) as unknown as typeof fetch;

        await expect(
          submitBooking({
            data: validBase,
            selectedService,
            selectedPackage,
            turnstileToken: undefined,
          })
        ).rejects.toThrow("Failed to book service");
      });
    });

    it("builds the service label from the selected service key and package name", async () => {
      const fetchMock = mockFetchOk({ bookingReference: "BK-3" });

      await submitBooking({
        data: validBase,
        selectedService: { key: "tints" as const },
        selectedPackage: { ...selectedPackage, name: "Carbon 35%" },
        turnstileToken: "t",
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.serviceType).toBe("Window Tint — Carbon 35%");
    });
  });
});
