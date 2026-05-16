/**
 * Tests for validation utilities (src/lib/utils/validation.ts)
 *
 * Standards coverage:
 * - 📋 Functional: All validation/sanitization functions
 * - 🔒 Security: XSS prevention, injection prevention, input sanitization
 */

import {
  validateEmail,
  validatePhone,
  validateBookingReference,
  sanitizeName,
  validateFutureDate,
  validateAppointmentTime,
  checkRateLimit,
  cleanupRateLimits,
} from "@/lib/utils/validation";

describe("validation utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // (#4) `sanitizeString` removed — it was a denylist masquerading as XSS
  // protection. React escapes on render, and the routes apply Zod `.max()`
  // for length. Anti-XSS character stripping at input time was producing
  // false confidence rather than safety.

  // ── validateEmail ──────────────────────────────────────────

  describe("validateEmail", () => {
    it("should validate a correct email", () => {
      const result = validateEmail("user@example.com");
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe("user@example.com");
    });

    it("should convert email to lowercase", () => {
      const result = validateEmail("User@Example.COM");
      expect(result.sanitized).toBe("user@example.com");
    });

    it("should reject invalid emails", () => {
      const invalidEmails = [
        "not-an-email",
        "@missing-local.com",
        "missing@.com",
        "missing@domain",
        "",
        "spaces in@email.com",
      ];
      for (const email of invalidEmails) {
        expect(validateEmail(email).valid).toBe(false);
      }
    });

    it("should accept valid email formats", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "user123@test.io",
      ];
      for (const email of validEmails) {
        expect(validateEmail(email).valid).toBe(true);
      }
    });

    it("should reject XSS-style payloads as invalid (regex denies < and >)", () => {
      // validateEmail is intentionally NOT an anti-XSS sanitizer (see
      // src/lib/utils/validation.ts header). It instead rejects the
      // payload at the regex boundary because `<` and `>` are not
      // allowed in the local-part character class. React escapes any
      // output at render time.
      const result = validateEmail('<script>alert("xss")</script>@evil.com');
      expect(result.valid).toBe(false);
    });
  });

  // ── validatePhone ──────────────────────────────────────────

  describe("validatePhone", () => {
    it("should validate a correct phone number", () => {
      const result = validatePhone("555-0123");
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe("555-0123");
    });

    it("should accept various phone formats", () => {
      const validPhones = [
        "555-0123",
        "(555) 123-4567",
        "+1 555 123 4567",
        "5551234567",
      ];
      for (const phone of validPhones) {
        expect(validatePhone(phone).valid).toBe(true);
      }
    });

    it("should reject invalid phone numbers", () => {
      const invalidPhones = ["123", "abc", ""];
      for (const phone of invalidPhones) {
        expect(validatePhone(phone).valid).toBe(false);
      }
    });

    it("should strip non-phone characters", () => {
      const result = validatePhone("555-abc-0123");
      expect(result.sanitized).not.toContain("a");
      expect(result.sanitized).not.toContain("b");
      expect(result.sanitized).not.toContain("c");
    });

    it("should truncate to 20 characters", () => {
      const longPhone = "1".repeat(30);
      expect(validatePhone(longPhone).sanitized.length).toBeLessThanOrEqual(20);
    });
  });

  // ── validateBookingReference ────────────────────────────────

  describe("validateBookingReference", () => {
    it("should validate correct BK references", () => {
      expect(validateBookingReference("BK-ABC123")).toBe(true);
      expect(validateBookingReference("BK-ZZZZZ9")).toBe(true);
    });

    it("should validate correct QT references", () => {
      expect(validateBookingReference("QT-ABC123")).toBe(true);
      expect(validateBookingReference("QT-000000")).toBe(true);
    });

    it("should reject invalid references", () => {
      expect(validateBookingReference("")).toBe(false);
      expect(validateBookingReference("INVALID")).toBe(false);
      expect(validateBookingReference("BK-abc123")).toBe(false); // lowercase
      expect(validateBookingReference("XX-ABC123")).toBe(false); // wrong prefix
      expect(validateBookingReference("BK-ABCDEFG")).toBe(false); // too long
      expect(validateBookingReference("BK-ABC1")).toBe(false); // too short
    });
  });

  // ── sanitizeName ───────────────────────────────────────────

  describe("sanitizeName", () => {
    it("should keep valid name characters", () => {
      expect(sanitizeName("John Doe")).toBe("John Doe");
      expect(sanitizeName("O'Brien")).toBe("O'Brien");
      expect(sanitizeName("Mary-Jane")).toBe("Mary-Jane");
    });

    it("should remove numbers and special characters", () => {
      expect(sanitizeName("John123")).toBe("John");
      expect(sanitizeName("Test!@#$%^&*")).toBe("Test");
    });

    it("should remove XSS payloads", () => {
      expect(sanitizeName('<script>alert("xss")</script>')).toBe(
        "scriptalertxssscript"
      );
    });

    it("should truncate to 100 characters", () => {
      const longName = "A".repeat(200);
      expect(sanitizeName(longName).length).toBeLessThanOrEqual(100);
    });

    it("should handle empty string", () => {
      expect(sanitizeName("")).toBe("");
    });
  });

  // ── validateFutureDate ─────────────────────────────────────

  describe("validateFutureDate", () => {
    it("should accept a future date within one year", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(validateFutureDate(tomorrow.toISOString())).toBe(true);
    });

    it("should reject a past date", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(validateFutureDate(yesterday.toISOString())).toBe(false);
    });

    it("should reject a date more than one year in the future", () => {
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      expect(validateFutureDate(twoYearsFromNow.toISOString())).toBe(false);
    });

    it("should reject invalid date strings", () => {
      expect(validateFutureDate("not-a-date")).toBe(false);
      expect(validateFutureDate("")).toBe(false);
    });
  });

  // ── validateAppointmentTime ────────────────────────────────

  describe("validateAppointmentTime", () => {
    it("should accept valid appointment times", () => {
      const validTimes = [
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
      for (const time of validTimes) {
        expect(validateAppointmentTime(time)).toBe(true);
      }
    });

    it("should reject invalid times", () => {
      expect(validateAppointmentTime("08:00")).toBe(false);
      expect(validateAppointmentTime("13:00")).toBe(false);
      expect(validateAppointmentTime("19:00")).toBe(false);
      expect(validateAppointmentTime("09:30")).toBe(false);
      expect(validateAppointmentTime("")).toBe(false);
      expect(validateAppointmentTime("invalid")).toBe(false);
    });
  });

  // ── checkRateLimit ─────────────────────────────────────────

  describe("checkRateLimit", () => {
    it("should allow first request", async () => {
      const result = await checkRateLimit("test-unique-1", 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should track request count and decrement remaining", async () => {
      const id = "test-unique-2";
      await checkRateLimit(id, 5, 60000);
      const result = await checkRateLimit(id, 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });

    it("should deny when rate limit exceeded", async () => {
      const id = "test-unique-3";
      for (let i = 0; i < 3; i++) {
        await checkRateLimit(id, 3, 60000);
      }
      const result = await checkRateLimit(id, 3, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should use default values", async () => {
      const result = await checkRateLimit("test-unique-4");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // default max is 10
    });
  });

  // ── cleanupRateLimits ──────────────────────────────────────

  describe("cleanupRateLimits", () => {
    it("should not throw when called", () => {
      expect(() => cleanupRateLimits()).not.toThrow();
    });

    it("should clean up expired rate limit entries", async () => {
      // Create a rate limit entry with a very short window (1ms)
      const id = "test-cleanup-expired";
      await checkRateLimit(id, 10, 1);

      // Wait for it to expire
      const start = Date.now();
      while (Date.now() - start < 5) {
        // busy wait for 5ms to ensure expiry
      }

      // Clean up
      cleanupRateLimits();

      // After cleanup, the entry should be gone - new request gets fresh limits
      const result = await checkRateLimit(id, 10, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // Fresh start, 10-1 = 9
    });

    it("should not clean up non-expired entries", async () => {
      const id = "test-cleanup-active";
      await checkRateLimit(id, 5, 60000); // 60s window
      await checkRateLimit(id, 5, 60000);

      cleanupRateLimits();

      // Entry should still exist - next request continues from count 2
      const result = await checkRateLimit(id, 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5-3 = 2
    });
  });
});
