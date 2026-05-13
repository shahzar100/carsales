/**
 * @jest-environment node
 */
import { TOTP, Secret, URI } from "otpauth";
import {
  generateTotpEnrolment,
  verifyTotpCode,
} from "@/lib/utils/twoFactor";

describe("twoFactor", () => {
  describe("generateTotpEnrolment", () => {
    it("returns a base32 secret and a parseable otpauth URI", () => {
      const material = generateTotpEnrolment("alice@example.com");
      expect(material.secret).toMatch(/^[A-Z2-7]+=*$/);
      expect(material.uri).toMatch(
        /^otpauth:\/\/totp\/Morley%20Motor%20Company:alice/
      );
      // Round-trip: parse the URI and check it produces a 6-digit code
      const totp = URI.parse(material.uri) as TOTP;
      expect(totp.generate()).toMatch(/^\d{6}$/);
    });
  });

  describe("verifyTotpCode", () => {
    const secret = new Secret({ size: 20 }).base32;

    it("accepts the current code", () => {
      const totp = new TOTP({
        secret: Secret.fromBase32(secret),
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });
      const code = totp.generate();
      expect(verifyTotpCode(secret, code)).toBe(true);
    });

    it("rejects a wrong code", () => {
      expect(verifyTotpCode(secret, "000000")).toBe(false);
    });

    it("rejects badly-shaped input", () => {
      expect(verifyTotpCode(secret, "12345")).toBe(false); // too short
      expect(verifyTotpCode(secret, "abcdef")).toBe(false); // not digits
      expect(verifyTotpCode("", "123456")).toBe(false); // no secret
    });

    it("rejects when secret is garbage", () => {
      expect(verifyTotpCode("not-a-secret", "123456")).toBe(false);
    });
  });
});
