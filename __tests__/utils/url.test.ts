/**
 * @jest-environment node
 *
 * Unit tests for `safeExternalHref` (src/lib/utils/url.ts).
 *
 * The helper is the render-side defence in depth that pairs with the
 * server-side protocol check on the admin shop write handler. Every
 * `<a href>` that takes an admin-supplied URL should pass through it.
 *
 * The bypasses we explicitly test for (`javascript:` is the headline
 * one; `data:` and `vbscript:` round out the script-execution
 * schemes) all return cleanly from `new URL(...)` — the constructor
 * only validates the grammar, not the scheme. The protocol check is
 * the only line of defence here.
 */
import { safeExternalHref } from "@/lib/utils/url";

describe("safeExternalHref", () => {
  describe("rejects unsafe inputs by returning undefined", () => {
    it.each([
      ["javascript: payload", "javascript:alert(1)"],
      ["data: payload", "data:text/html,<script>alert(1)</script>"],
      ["vbscript: payload", "vbscript:msgbox(1)"],
      ["file: scheme", "file:///etc/passwd"],
      ["plain http", "http://example.com/"],
      ["empty string", ""],
      ["whitespace only", "   "],
      ["non-URL string", "not a url"],
    ])("%s", (_label, input) => {
      expect(safeExternalHref(input)).toBeUndefined();
    });

    it("null", () => {
      expect(safeExternalHref(null)).toBeUndefined();
    });

    it("undefined", () => {
      expect(safeExternalHref(undefined)).toBeUndefined();
    });

    it("non-string", () => {
      // Pretend a caller passes a non-string by widening the type;
      // mirrors the real-world shape where the helper guards against
      // whatever shape a stale DB row throws at it.
      expect(
        safeExternalHref(123 as unknown as string)
      ).toBeUndefined();
    });
  });

  describe("accepts valid https URLs unchanged", () => {
    it.each([
      "https://maps.google.com/?q=test",
      "https://example.com/path?query=value#fragment",
      "https://sub.domain.example.com:8443/deep/path",
    ])("%s", (input) => {
      expect(safeExternalHref(input)).toBe(input);
    });

    it("trims surrounding whitespace before returning", () => {
      expect(safeExternalHref("  https://example.com  ")).toBe(
        "https://example.com"
      );
    });
  });
});
