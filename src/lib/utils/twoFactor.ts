/**
 * TOTP (RFC 6238) helpers built on top of `otpauth`.
 *
 * The secret is a base32-encoded random string that lives on the AdminUser
 * document. The `otpauth://` URI is given to the user once during enrolment
 * — they scan it (or paste it) into Google Authenticator / 1Password /
 * Authy. From then on every login requires a fresh 6-digit code.
 *
 * Day 12.2 / Finding #14.
 */
import { Secret, TOTP } from "otpauth";

const ISSUER = "Morley Motor Company";
const DIGITS = 6;
const PERIOD = 30; // seconds
const WINDOW = 1; // accept the previous + next code for clock drift

export interface EnrolmentMaterial {
  /** base32-encoded shared secret to persist on the user record */
  secret: string;
  /** otpauth:// URI suitable for QR-code generation or manual entry */
  uri: string;
}

function buildTotp(secret: Secret, label: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: DIGITS,
    period: PERIOD,
    secret,
  });
}

/** Generate a fresh shared secret and the otpauth URI for enrolment. */
export function generateTotpEnrolment(label: string): EnrolmentMaterial {
  const secret = new Secret({ size: 20 });
  const totp = buildTotp(secret, label);
  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

/** Verify a 6-digit code against a stored base32 secret. */
export function verifyTotpCode(secretBase32: string, code: string): boolean {
  if (!secretBase32 || !/^\d{6}$/.test(code)) return false;
  try {
    const secret = Secret.fromBase32(secretBase32);
    const totp = buildTotp(secret, "verify");
    // delta === null when no match within ±window steps.
    const delta = totp.validate({ token: code, window: WINDOW });
    return delta !== null;
  } catch {
    return false;
  }
}
