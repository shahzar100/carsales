/**
 * @jest-environment node
 *
 * Tests for /api/admin/2fa/enroll (src/app/api/admin/2fa/enroll/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: enrolment is session-gated; pending secret only lives on the
 *   session until verified; cannot re-enrol when 2FA is already on.
 * - 📋 Functional: returns a base32 secret + otpauth:// URI.
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/2fa/enroll/route";
import { getTestCollections } from "../../../utils/testUtils";

const mockSession: {
  isLoggedIn: boolean;
  username: string | undefined;
  pendingTotpSecret?: string;
  save: jest.Mock;
} = {
  isLoggedIn: false,
  username: undefined,
  save: jest.fn(),
};

jest.mock("@/lib/utils/auth", () => ({
  getSession: jest.fn(async () => mockSession),
}));

// Rate limiter is module-level state — share an allow-all stub across
// the suite so unrelated tests aren't gated on the IP cap. A dedicated
// 429 test below installs its own block-all stub.
const mockRateLimitCheck = jest
  .fn()
  .mockResolvedValue({ allowed: true, remaining: 4, resetIn: 0 });
jest.mock("@/lib/utils/rateLimit", () => ({
  createRateLimiter: () => ({
    check: (...args: unknown[]) => mockRateLimitCheck(...args),
    reset: jest.fn().mockResolvedValue(undefined),
  }),
}));

function makeRequest() {
  return new NextRequest("http://localhost:3000/api/admin/2fa/enroll", {
    method: "POST",
  });
}

describe("POST /api/admin/2fa/enroll", () => {
  beforeEach(() => {
    mockSession.isLoggedIn = false;
    mockSession.username = undefined;
    delete mockSession.pendingTotpSecret;
    mockSession.save.mockReset();
    mockRateLimitCheck
      .mockReset()
      .mockResolvedValue({ allowed: true, remaining: 4, resetIn: 0 });
  });

  it("🔒 returns 429 when the per-IP enroll cap is hit", async () => {
    mockRateLimitCheck.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetIn: 60_000,
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("🔒 returns 401 when there is no session", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 404 when the user is missing from the DB", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "ghost";
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });

  it("returns 409 when 2FA is already enabled on the account", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "twofa-on";

    const { adminUsers, client } = await getTestCollections();
    await adminUsers.insertOne({
      username: "twofa-on",
      passwordHash: "x",
      totpEnabled: true,
      totpSecret: "JBSWY3DPEHPK3PXP",
    } as never);
    await client.close();

    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it("returns a base32 secret + otpauth URI and parks the secret on the session", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "fresh";
    const { adminUsers, client } = await getTestCollections();
    await adminUsers.insertOne({
      username: "fresh",
      passwordHash: "x",
    } as never);
    await client.close();

    const res = await POST(makeRequest());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.secret).toMatch(/^[A-Z2-7]+=*$/); // base32
    expect(json.uri).toMatch(/^otpauth:\/\/totp\//);
    expect(json.uri).toContain("issuer=");

    // The pending secret must NOT have been persisted to the user — it
    // only lives on the session until verify() consumes it.
    expect(mockSession.pendingTotpSecret).toBe(json.secret);
    expect(mockSession.save).toHaveBeenCalled();

    const { adminUsers: u2, client: c2 } = await getTestCollections();
    const saved = await u2.findOne({ username: "fresh" });
    expect(saved?.totpSecret).toBeUndefined();
    expect(saved?.totpEnabled).toBeFalsy();
    await c2.close();
  });
});
