/**
 * @jest-environment node
 *
 * Tests for display formatting utilities (src/lib/utils/format.ts).
 *
 * Standards coverage:
 * - 📋 Functional: Locale-aware price/mileage/date/time formatting
 * - 🛡️ Edge: Null/undefined/invalid input is handled, not thrown
 */
import {
  formatPrice,
  formatMileage,
  formatDate,
  formatTime,
  formatRelativeTime,
} from "@/lib/utils/format";

describe("format utilities", () => {
  describe("formatPrice", () => {
    it("formats a number as GBP with no decimals", () => {
      expect(formatPrice(12500)).toBe("£12,500");
      expect(formatPrice(0)).toBe("£0");
      expect(formatPrice(1_000_000)).toBe("£1,000,000");
    });

    it("rounds fractional pounds to whole numbers", () => {
      // 12500.50 → "£12,501" or "£12,500" depending on Node ICU rounding mode;
      // either is acceptable, so just assert formatting shape.
      const result = formatPrice(12500.5);
      expect(result).toMatch(/^£12,50[01]$/);
    });

    it("returns £0 for null, undefined, or NaN", () => {
      expect(formatPrice(null)).toBe("£0");
      expect(formatPrice(undefined)).toBe("£0");
      expect(formatPrice(NaN)).toBe("£0");
    });
  });

  describe("formatMileage", () => {
    it("formats with thousand separators, no unit", () => {
      expect(formatMileage(42000)).toBe("42,000");
      expect(formatMileage(0)).toBe("0");
      expect(formatMileage(123)).toBe("123");
    });

    it("returns '0' for null, undefined, or NaN", () => {
      expect(formatMileage(null)).toBe("0");
      expect(formatMileage(undefined)).toBe("0");
      expect(formatMileage(NaN)).toBe("0");
    });
  });

  describe("formatDate", () => {
    it("defaults to short style — DD MMM YYYY", () => {
      const result = formatDate("2024-06-15");
      expect(result).toMatch(/15 Jun 2024/);
    });

    it("supports medium style — Wkd, D MMM", () => {
      const result = formatDate("2024-06-15", "medium");
      // "Sat, 15 Jun" — locale-dependent comma; assert key tokens
      expect(result).toContain("15");
      expect(result).toContain("Jun");
    });

    it("supports long style with full weekday and month", () => {
      const result = formatDate("2024-06-15", "long");
      expect(result).toContain("Saturday");
      expect(result).toContain("June");
      expect(result).toContain("2024");
    });

    it("accepts a Date instance", () => {
      const d = new Date("2024-06-15T10:00:00Z");
      expect(formatDate(d)).toContain("Jun");
    });

    it("returns em dash for null, undefined, empty string, or invalid date", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
      expect(formatDate("not-a-date")).toBe("—");
    });
  });

  describe("formatTime", () => {
    it("formats 24-hour input as 12-hour with meridiem", () => {
      expect(formatTime("09:00")).toBe("9:00 AM");
      expect(formatTime("14:30")).toBe("2:30 PM");
      expect(formatTime("00:15")).toBe("12:15 AM");
      expect(formatTime("12:00")).toBe("12:00 PM");
      expect(formatTime("23:59")).toBe("11:59 PM");
    });

    it("returns empty string for null, undefined, empty input", () => {
      expect(formatTime(null)).toBe("");
      expect(formatTime(undefined)).toBe("");
      expect(formatTime("")).toBe("");
    });

    it("returns the input unchanged for unparseable strings", () => {
      expect(formatTime("not-a-time")).toBe("not-a-time");
      expect(formatTime("25:00")).toBe("25:00"); // out of range hour
    });
  });

  describe("formatRelativeTime", () => {
    const NOW = new Date("2026-05-09T12:00:00Z");

    it("returns 'just now' for differences under 30 seconds", () => {
      expect(formatRelativeTime(new Date("2026-05-09T11:59:50Z"), NOW)).toBe(
        "just now"
      );
      expect(formatRelativeTime(new Date("2026-05-09T12:00:10Z"), NOW)).toBe(
        "just now"
      );
    });

    it("formats past minutes/hours/days", () => {
      expect(formatRelativeTime(new Date("2026-05-09T11:55:00Z"), NOW)).toBe(
        "5 minutes ago"
      );
      expect(formatRelativeTime(new Date("2026-05-09T09:00:00Z"), NOW)).toBe(
        "3 hours ago"
      );
      expect(formatRelativeTime(new Date("2026-05-07T12:00:00Z"), NOW)).toBe(
        "2 days ago"
      );
    });

    it("formats future minutes/hours/days", () => {
      expect(formatRelativeTime(new Date("2026-05-09T12:05:00Z"), NOW)).toBe(
        "in 5 minutes"
      );
      expect(formatRelativeTime(new Date("2026-05-09T15:00:00Z"), NOW)).toBe(
        "in 3 hours"
      );
    });

    it("uses singular vs plural correctly", () => {
      expect(formatRelativeTime(new Date("2026-05-09T11:59:00Z"), NOW)).toBe(
        "1 minute ago"
      );
      expect(formatRelativeTime(new Date("2026-05-09T11:00:00Z"), NOW)).toBe(
        "1 hour ago"
      );
    });

    it("falls back to absolute date for differences over a week", () => {
      const result = formatRelativeTime(
        new Date("2026-04-01T12:00:00Z"),
        NOW
      );
      expect(result).toContain("Apr");
      expect(result).toContain("2026");
    });

    it("returns empty string for null/undefined/empty/invalid input", () => {
      expect(formatRelativeTime(null, NOW)).toBe("");
      expect(formatRelativeTime(undefined, NOW)).toBe("");
      expect(formatRelativeTime("", NOW)).toBe("");
      expect(formatRelativeTime("not-a-date", NOW)).toBe("");
    });
  });
});
