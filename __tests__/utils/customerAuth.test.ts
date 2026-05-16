/**
 * @jest-environment node
 *
 * Tests for src/lib/utils/customerAuth.ts
 *
 * Standards coverage:
 * - 🔒 Security: customer identity comes from the signed Auth.js session,
 *   never from the request body (booking routes use this to overwrite
 *   user-supplied email — verify the contract on the *helper*).
 * - 📋 Functional: email is lowercased; missing email yields null.
 */

// `server-only` is a build-time directive — neutralise it in unit tests so
// the customerAuth import doesn't error out.
jest.mock("server-only", () => ({}));

const mockAuth = jest.fn();
jest.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

import { getCustomerIdentity } from "@/lib/utils/customerAuth";

describe("getCustomerIdentity", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("returns null when there is no session at all", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getCustomerIdentity()).resolves.toBeNull();
  });

  it("returns null when the session has no user", async () => {
    mockAuth.mockResolvedValue({});
    await expect(getCustomerIdentity()).resolves.toBeNull();
  });

  it("returns null when user.email is missing or empty", async () => {
    mockAuth.mockResolvedValue({ user: { name: "Jane" } });
    await expect(getCustomerIdentity()).resolves.toBeNull();
    mockAuth.mockResolvedValue({ user: { email: "" } });
    await expect(getCustomerIdentity()).resolves.toBeNull();
  });

  it("returns the lower-cased email and the name when present", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "Jane.Doe@Example.COM", name: "Jane Doe" },
    });
    await expect(getCustomerIdentity()).resolves.toEqual({
      email: "jane.doe@example.com",
      name: "Jane Doe",
    });
  });

  it("returns name=null when the provider didn't supply one", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "x@example.com" },
    });
    await expect(getCustomerIdentity()).resolves.toEqual({
      email: "x@example.com",
      name: null,
    });
  });

  it("🔒 always normalises email casing so equality checks across the codebase agree", async () => {
    // The dashboard matches bookings by account email — if any caller
    // bypassed the helper and stored a mixed-case email, that booking
    // would be invisible to the customer. The contract is: this helper
    // is the only sanctioned producer of the canonical email.
    mockAuth.mockResolvedValue({
      user: { email: "MIXED@CASE.com", name: null },
    });
    const result = await getCustomerIdentity();
    expect(result?.email).toBe("mixed@case.com");
    expect(result?.email).toBe(result?.email.toLowerCase());
  });
});
