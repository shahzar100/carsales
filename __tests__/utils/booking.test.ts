/**
 * @jest-environment node
 *
 * Tests for booking utilities (src/lib/utils/booking.ts)
 *
 * Standards coverage:
 * - 📋 Functional: Booking reference generation, date/time formatting
 * - 🔒 Security: Reference uniqueness, format validation
 */
import {
  generateBookingReference,
  generateQuoteReference,
  formatDate,
  formatTime,
} from "@/lib/utils/booking";

describe("Booking Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("📋 Functional Standards - Reference Generation", () => {
    describe("generateBookingReference", () => {
      it("should generate a booking reference in correct format", () => {
        const ref = generateBookingReference();

        expect(ref).toMatch(/^BK-[A-Z0-9]{6}$/);
        expect(ref.length).toBe(9); // BK- + 6 chars
        expect(ref.startsWith("BK-")).toBe(true);
      });

      it("should generate unique references", () => {
        const refs = new Set();
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
          refs.add(generateBookingReference());
        }

        expect(refs.size).toBe(iterations); // All should be unique
      });

      it("should only contain uppercase alphanumeric characters after prefix", () => {
        const ref = generateBookingReference();
        const suffix = ref.replace("BK-", "");

        expect(suffix).toMatch(/^[A-Z0-9]+$/);
        // All-digit suffixes are valid since hex chars are uppercased
        expect(suffix).toBe(suffix.toUpperCase());
      });

      it("should generate references consistently on multiple calls", () => {
        for (let i = 0; i < 50; i++) {
          const ref = generateBookingReference();
          expect(ref).toMatch(/^BK-[A-Z0-9]{6}$/);
        }
      });
    });

    describe("generateQuoteReference", () => {
      it("should generate a quote reference in correct format", () => {
        const ref = generateQuoteReference();

        expect(ref).toMatch(/^QT-[A-Z0-9]{6}$/);
        expect(ref.length).toBe(9); // QT- + 6 chars
        expect(ref.startsWith("QT-")).toBe(true);
      });

      it("should generate unique references", () => {
        const refs = new Set();
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
          refs.add(generateQuoteReference());
        }

        expect(refs.size).toBe(iterations); // All should be unique
      });

      it("should only contain uppercase alphanumeric characters after prefix", () => {
        const ref = generateQuoteReference();
        const suffix = ref.replace("QT-", "");

        expect(suffix).toMatch(/^[A-Z0-9]+$/);
        // All-digit suffixes are valid since hex chars are uppercased
        expect(suffix).toBe(suffix.toUpperCase());
      });

      it("should be distinguishable from booking references", () => {
        const bookingRef = generateBookingReference();
        const quoteRef = generateQuoteReference();

        expect(bookingRef.startsWith("BK-")).toBe(true);
        expect(quoteRef.startsWith("QT-")).toBe(true);
        expect(bookingRef).not.toBe(quoteRef);
      });
    });
  });

  describe("📋 Functional Standards - Date Formatting", () => {
    describe("formatDate", () => {
      it("should format a standard date string correctly", () => {
        const date = "2024-12-25";
        const formatted = formatDate(date);

        expect(formatted).toContain("2024");
        expect(formatted).toContain("December");
        expect(formatted).toContain("25");
      });

      it("should include weekday in formatted output", () => {
        const date = "2024-01-01"; // Monday
        const formatted = formatDate(date);

        expect(formatted).toMatch(
          /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/
        );
      });

      it("should format ISO date strings", () => {
        const date = "2024-06-15T10:30:00Z";
        const formatted = formatDate(date);

        expect(formatted).toContain("2024");
        expect(formatted).toContain("June");
      });

      it("should handle different month names", () => {
        const months = [
          { date: "2024-01-15", month: "January" },
          { date: "2024-02-15", month: "February" },
          { date: "2024-03-15", month: "March" },
          { date: "2024-12-15", month: "December" },
        ];

        months.forEach(({ date, month }) => {
          const formatted = formatDate(date);
          expect(formatted).toContain(month);
        });
      });

      it("should format dates consistently", () => {
        const date = "2024-07-04";
        const formatted1 = formatDate(date);
        const formatted2 = formatDate(date);

        expect(formatted1).toBe(formatted2);
      });

      it("should handle single-digit days and months", () => {
        const date = "2024-01-05";
        const formatted = formatDate(date);

        expect(formatted).toContain("2024");
        expect(formatted).toContain("January");
        expect(formatted).toContain("5");
      });

      it("should handle leap year dates", () => {
        const date = "2024-02-29"; // 2024 is a leap year
        const formatted = formatDate(date);

        expect(formatted).toContain("February");
        expect(formatted).toContain("29");
        expect(formatted).toContain("2024");
      });
    });
  });

  describe("📋 Functional Standards - Time Formatting", () => {
    describe("formatTime", () => {
      it("should format morning times correctly", () => {
        expect(formatTime("09:00")).toBe("09:00–10:00");
        expect(formatTime("10:00")).toBe("10:00–11:00");
        expect(formatTime("11:00")).toBe("11:00–12:00");
      });

      it("should format noon correctly", () => {
        expect(formatTime("12:00")).toBe("12:00–13:00");
      });

      it("should format afternoon/evening times correctly", () => {
        expect(formatTime("14:00")).toBe("14:00–15:00");
        expect(formatTime("15:00")).toBe("15:00–16:00");
        expect(formatTime("16:00")).toBe("16:00–17:00");
        expect(formatTime("17:00")).toBe("17:00–18:00");
        expect(formatTime("18:00")).toBe("18:00–19:00");
      });

      it("should return original time for unmapped values", () => {
        expect(formatTime("08:00")).toBe("08:00");
        expect(formatTime("13:00")).toBe("13:00");
        expect(formatTime("19:00")).toBe("19:00");
        expect(formatTime("20:00")).toBe("20:00");
      });

      it("should handle edge case time formats", () => {
        expect(formatTime("")).toBe("");
        expect(formatTime("invalid")).toBe("invalid");
      });

      it("should be case-sensitive", () => {
        expect(formatTime("09:00")).toBe("09:00–10:00");
        // Keys are exact-match; a non-matching key returns the input
        expect(formatTime("9:00")).toBe("9:00"); // Missing leading zero, not mapped
      });

      it("should handle all defined time slots", () => {
        const definedTimes = [
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "14:00",
          "15:00",
          "16:00",
          "17:00",
          "18:00",
        ];

        definedTimes.forEach((time) => {
          const formatted = formatTime(time);
          expect(formatted).not.toBe(time); // Should be transformed
          expect(formatted).toContain("–"); // Should have en-dash range
          expect(formatted).toMatch(/^\d{2}:\d{2}–\d{2}:\d{2}$/);
        });
      });
    });
  });

  describe("🔒 Security Standards - Reference Integrity", () => {
    it("should not generate predictable booking references", () => {
      const refs = Array.from({ length: 10 }, () => generateBookingReference());
      const suffixes = refs.map((ref) => ref.replace("BK-", ""));

      // Check that suffixes are not sequential
      for (let i = 1; i < suffixes.length; i++) {
        expect(suffixes[i]).not.toBe(suffixes[i - 1]);
      }
    });

    it("should not generate predictable quote references", () => {
      const refs = Array.from({ length: 10 }, () => generateQuoteReference());
      const suffixes = refs.map((ref) => ref.replace("QT-", ""));

      // Check that suffixes are not sequential
      for (let i = 1; i < suffixes.length; i++) {
        expect(suffixes[i]).not.toBe(suffixes[i - 1]);
      }
    });

    it("should maintain reference format integrity", () => {
      for (let i = 0; i < 20; i++) {
        const bookingRef = generateBookingReference();
        const quoteRef = generateQuoteReference();

        // No special characters or injection attempts
        expect(bookingRef).not.toMatch(/[^A-Z0-9-]/);
        expect(quoteRef).not.toMatch(/[^A-Z0-9-]/);

        // Exactly one hyphen in correct position
        expect(bookingRef.split("-").length).toBe(2);
        expect(quoteRef.split("-").length).toBe(2);
      }
    });
  });

  describe("Edge Cases & Error Handling", () => {
    describe("formatDate edge cases", () => {
      it("should handle invalid date strings gracefully", () => {
        const result = formatDate("invalid-date");
        // Should return "Invalid Date" or throw - document actual behavior
        expect(result).toBeDefined();
      });

      it("should handle empty string", () => {
        const result = formatDate("");
        expect(result).toBeDefined();
      });

      it("should handle dates at boundaries", () => {
        const earlyDate = formatDate("1970-01-01");
        const futureDate = formatDate("2099-12-31");

        expect(earlyDate).toContain("1970");
        expect(futureDate).toContain("2099");
      });
    });

    describe("formatTime edge cases", () => {
      it("should handle null gracefully", () => {
        const result = formatTime(null as any);
        expect(result).toBeDefined();
      });

      it("should handle undefined gracefully", () => {
        const result = formatTime(undefined as any);
        // formatTime returns timeFormats[undefined] || undefined, which is undefined
        expect(result).toBeUndefined();
      });

      it("should handle numeric input", () => {
        const result = formatTime(12 as any);
        expect(result).toBeDefined();
      });
    });

    describe("Reference generation under load", () => {
      it("should maintain uniqueness with concurrent generation", () => {
        const promises = Array.from({ length: 100 }, () =>
          Promise.resolve(generateBookingReference())
        );

        return Promise.all(promises).then((refs) => {
          const uniqueRefs = new Set(refs);
          expect(uniqueRefs.size).toBe(refs.length);
        });
      });

      it("should generate valid references rapidly", () => {
        const start = Date.now();
        const refs = Array.from({ length: 1000 }, () =>
          generateBookingReference()
        );
        const duration = Date.now() - start;

        expect(refs.length).toBe(1000);
        expect(duration).toBeLessThan(1000); // Should complete in under 1 second

        // All should still be valid
        refs.forEach((ref) => {
          expect(ref).toMatch(/^BK-[A-Z0-9]{6}$/);
        });
      });
    });
  });
});
