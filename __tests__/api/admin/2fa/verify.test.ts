/**
 * @jest-environment node
 *
 * Tests for /api/admin/2fa/verify (src/app/api/admin/2fa/verify/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: only the session's pending secret can be promoted; codes are
 *   validated via TOTP (mocked here so the test is deterministic); session
 *   pendingTotpSecret is cleared after success
 * - 📋 Functional: success persists totpEnabled + totpSecret and audit-logs
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/2fa/verify/route";
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

const mockVerifyTotpCode = jest.fn();
jest.mock("@/lib/utils/twoFactor", () => ({
  verifyTotpCode: (...args: unknown[]) => mockVerifyTotpCode(...args),
  generateTotpEnrolment: jest.fn(),
}));

const mockRecordAudit = jest.fn();
jest.mock("@/lib/utils/audit", () => ({
  recordAudit: (...args: unknown[]) => mockRecordAudit(...args),
}));

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/admin/2fa/verify", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/admin/2fa/verify", () => {
  beforeEach(() => {
    mockSession.isLoggedIn = false;
    mockSession.username = undefined;
    delete mockSession.pendingTotpSecret;
    mockSession.save.mockReset();
    mockVerifyTotpCode.mockReset();
    mockRecordAudit.mockReset();
  });

  it("🔒 returns 401 when there is no session", async () => {
    const res = await POST(makeRequest({ code: "123456" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no enrolment has been started", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "u";
    // No pendingTotpSecret on the session
    const res = await POST(makeRequest({ code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "u";
    mockSession.pendingTotpSecret = "JBSWY3DPEHPK3PXP";
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the code field is missing or not a string", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "u";
    mockSession.pendingTotpSecret = "JBSWY3DPEHPK3PXP";
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("🔒 returns 401 when the TOTP code does not validate", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "u";
    mockSession.pendingTotpSecret = "JBSWY3DPEHPK3PXP";
    mockVerifyTotpCode.mockReturnValue(false);
    const res = await POST(makeRequest({ code: "000000" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when the user is missing from the DB", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "ghost-2fa";
    mockSession.pendingTotpSecret = "JBSWY3DPEHPK3PXP";
    mockVerifyTotpCode.mockReturnValue(true);
    const res = await POST(makeRequest({ code: "123456" }));
    expect(res.status).toBe(404);
  });

  it("🔒 returns 409 when the user is already 2FA-enrolled (re-enrol hijack guard)", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "already-enrolled";
    mockSession.pendingTotpSecret = "ATTACKER-CONTROLLED-SECRET";
    mockVerifyTotpCode.mockReturnValue(true);

    const { adminUsers, client } = await getTestCollections();
    await adminUsers.insertOne({
      username: "already-enrolled",
      passwordHash: "x",
      totpEnabled: true,
      totpSecret: "ORIGINAL-USER-SECRET",
    } as never);
    await client.close();

    const res = await POST(makeRequest({ code: "123456" }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already enabled");

    // The legitimate secret must be untouched — no DB write happened.
    const { adminUsers: u2, client: c2 } = await getTestCollections();
    const saved = await u2.findOne({ username: "already-enrolled" });
    expect(saved?.totpSecret).toBe("ORIGINAL-USER-SECRET");
    expect(saved?.totpEnabled).toBe(true);
    await c2.close();

    expect(mockRecordAudit).not.toHaveBeenCalled();
  });

  it("persists totpEnabled + secret, clears pending, and audit-logs on success", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "promotable";
    mockSession.pendingTotpSecret = "JBSWY3DPEHPK3PXP";
    mockVerifyTotpCode.mockReturnValue(true);

    const { adminUsers, client } = await getTestCollections();
    await adminUsers.insertOne({
      username: "promotable",
      passwordHash: "x",
    } as never);
    await client.close();

    const res = await POST(makeRequest({ code: "123456" }));
    expect(res.status).toBe(200);

    const { adminUsers: u2, client: c2 } = await getTestCollections();
    const saved = await u2.findOne({ username: "promotable" });
    expect(saved?.totpEnabled).toBe(true);
    expect(saved?.totpSecret).toBe("JBSWY3DPEHPK3PXP");
    await c2.close();

    expect(mockSession.pendingTotpSecret).toBeUndefined();
    expect(mockSession.save).toHaveBeenCalled();
    expect(mockRecordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: "promotable",
        action: "admin.2fa_enabled",
      })
    );
  });
});
