/**
 * @jest-environment node
 *
 * Tests for /api/admin/2fa/disable (src/app/api/admin/2fa/disable/route.ts)
 *
 * Standards coverage:
 * - 🔒 Security: requires re-entry of the current password (a stolen session
 *   alone cannot disable 2FA); clears both totpEnabled and totpSecret on
 *   success; audit-logs every disable.
 * - 📋 Functional: password mismatch → 401; success → 200.
 */
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/2fa/disable/route";
import { getTestCollections } from "../../../utils/testUtils";

const mockSession = {
  isLoggedIn: false,
  username: undefined as string | undefined,
};

jest.mock("@/lib/utils/auth", () => {
  const actual = jest.requireActual("@/lib/utils/auth");
  return {
    ...actual,
    getSession: jest.fn(async () => mockSession),
  };
});

const mockRecordAudit = jest.fn();
jest.mock("@/lib/utils/audit", () => ({
  recordAudit: (...args: unknown[]) => mockRecordAudit(...args),
}));

// Rate limiter is module-level state in the real implementation. Mock
// it allow-all for the suite; the 429 test below installs its own
// block-all stub.
const mockRateLimitCheck = jest
  .fn()
  .mockResolvedValue({ allowed: true, remaining: 4, resetIn: 0 });
jest.mock("@/lib/utils/rateLimit", () => ({
  createRateLimiter: () => ({
    check: (...args: unknown[]) => mockRateLimitCheck(...args),
    reset: jest.fn().mockResolvedValue(undefined),
  }),
}));

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/admin/2fa/disable", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

async function seedAdmin(username: string, plainPassword: string) {
  const { adminUsers, client } = await getTestCollections();
  await adminUsers.insertOne({
    username,
    passwordHash: await bcrypt.hash(plainPassword, 4),
    totpEnabled: true,
    totpSecret: "JBSWY3DPEHPK3PXP",
  } as never);
  await client.close();
}

describe("POST /api/admin/2fa/disable", () => {
  beforeEach(() => {
    mockSession.isLoggedIn = false;
    mockSession.username = undefined;
    mockRecordAudit.mockReset();
    mockRateLimitCheck
      .mockReset()
      .mockResolvedValue({ allowed: true, remaining: 4, resetIn: 0 });
  });

  it("🔒 returns 429 when the per-IP disable-attempt cap is hit", async () => {
    mockRateLimitCheck.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetIn: 60_000,
    });
    mockSession.isLoggedIn = true;
    mockSession.username = "u";
    const res = await POST(makeRequest({ password: "anything" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("🔒 returns 401 when not signed in", async () => {
    const res = await POST(makeRequest({ password: "x" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for malformed JSON body", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "u";
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password field is missing", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "u";
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the user is missing from the DB", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "ghost-2fa-d";
    const res = await POST(makeRequest({ password: "anything" }));
    expect(res.status).toBe(404);
  });

  it("🔒 returns 401 on wrong password (session cookie alone isn't enough)", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "admin-2fa";
    await seedAdmin("admin-2fa", "correct-password");
    const res = await POST(makeRequest({ password: "wrong-password" }));
    expect(res.status).toBe(401);
  });

  it("clears totpEnabled + totpSecret on success and audit-logs", async () => {
    mockSession.isLoggedIn = true;
    mockSession.username = "admin-2fa-2";
    await seedAdmin("admin-2fa-2", "correct-password");

    const res = await POST(makeRequest({ password: "correct-password" }));
    expect(res.status).toBe(200);

    const { adminUsers, client } = await getTestCollections();
    const saved = await adminUsers.findOne({ username: "admin-2fa-2" });
    expect(saved?.totpEnabled).toBe(false);
    expect(saved?.totpSecret).toBeUndefined();
    expect(saved?.updatedAt).toBeInstanceOf(Date);
    await client.close();

    expect(mockRecordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: "admin-2fa-2",
        action: "admin.2fa_disabled",
      })
    );
  });
});
