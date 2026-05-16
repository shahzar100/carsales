/**
 * @jest-environment node
 *
 * Tests for src/lib/utils/emailVerification.ts
 *
 * Standards coverage:
 * - 🔒 Security: only the SHA-256 *hash* of the token is persisted; plaintext
 *   is delivered exclusively via the email side channel
 * - 📋 Functional: no-ops for unknown / already-verified users; expiry stamped
 *   ~24h ahead
 * - 🎯 Usability: email-send failures are logged but never propagated to the
 *   caller (so a flaky mailer can't block sign-up)
 */

jest.mock("server-only", () => ({}));

const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
jest.mock("@/lib/models", () => ({
  getUsersCollection: jest.fn(async () => ({
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
  })),
}));

const mockSendEmail = jest.fn();
jest.mock("@/emails/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

jest.mock("@/emails/VerifyEmail", () => ({
  VerifyEmail: function VerifyEmailMock() {
    return null;
  },
}));

const mockLogError = jest.fn();
jest.mock("@/lib/utils/observability", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
  logEvent: jest.fn(),
}));

import {
  hashVerifyToken,
  sendVerificationEmail,
} from "@/lib/utils/emailVerification";

describe("hashVerifyToken", () => {
  it("returns a stable SHA-256 hex digest", () => {
    expect(hashVerifyToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("is deterministic for the same input", () => {
    expect(hashVerifyToken("repeat")).toBe(hashVerifyToken("repeat"));
  });

  it("yields different digests for different inputs", () => {
    expect(hashVerifyToken("a")).not.toBe(hashVerifyToken("b"));
  });
});

describe("sendVerificationEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true });
  });

  it("no-ops silently when the user is not found", async () => {
    mockFindOne.mockResolvedValue(null);
    await sendVerificationEmail("nobody@example.com");
    expect(mockUpdateOne).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("no-ops silently when the user is already verified", async () => {
    mockFindOne.mockResolvedValue({
      _id: "u1",
      email: "ok@example.com",
      emailVerified: new Date(),
    });
    await sendVerificationEmail("ok@example.com");
    expect(mockUpdateOne).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("🔒 persists only the SHA-256 hash of the token (never the plaintext)", async () => {
    mockFindOne.mockResolvedValue({
      _id: "u1",
      email: "new@example.com",
      name: "New User",
    });

    await sendVerificationEmail("new@example.com");

    const setUpdate = mockUpdateOne.mock.calls[0][1].$set;
    // Plain token sent to email
    const plainToken = mockSendEmail.mock.calls[0][0].react.props.verifyToken;
    expect(typeof plainToken).toBe("string");
    expect(plainToken).toHaveLength(64); // 32 bytes hex
    // Stored value must be the hash, not the plaintext
    expect(setUpdate.verifyToken).toBe(hashVerifyToken(plainToken));
    expect(setUpdate.verifyToken).not.toBe(plainToken);
  });

  it("stamps verifyTokenExpiry ~24h in the future", async () => {
    mockFindOne.mockResolvedValue({
      _id: "u1",
      email: "x@example.com",
      name: null,
    });
    const before = Date.now();
    await sendVerificationEmail("x@example.com");
    const after = Date.now();
    const expiry = mockUpdateOne.mock.calls[0][1].$set
      .verifyTokenExpiry as Date;
    const ttl = expiry.getTime() - before;
    expect(ttl).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 50);
    expect(expiry.getTime() - after).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it("falls back to name 'there' when the user has no display name", async () => {
    mockFindOne.mockResolvedValue({
      _id: "u1",
      email: "y@example.com",
      name: null,
    });
    await sendVerificationEmail("y@example.com");
    expect(mockSendEmail.mock.calls[0][0].react.props.name).toBe("there");
  });

  it("logs send failures via observability but does not throw", async () => {
    mockFindOne.mockResolvedValue({
      _id: "u1",
      email: "z@example.com",
      name: "Z",
    });
    mockSendEmail.mockResolvedValue({
      success: false,
      error: new Error("mailer offline"),
    });
    await expect(
      sendVerificationEmail("z@example.com")
    ).resolves.toBeUndefined();
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError.mock.calls[0][1]).toMatchObject({
      route: "sendVerificationEmail",
      action: "email_send_failed",
    });
  });
});
