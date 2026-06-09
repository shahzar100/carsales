/**
 * @jest-environment node
 *
 * Tests for PATCH/DELETE /api/admin/users/[id]
 * (src/app/api/admin/users/[id]/route.ts) — the access-level change and
 * account-removal routes.
 *
 * The interesting surface is the privilege guards, so that's where the
 * coverage concentrates:
 *  - admin-only gate (403 below admin)
 *  - per-IP rate limit (429)
 *  - self-protection (can't change own level / delete own account)
 *  - role ceiling (can't grant above your own level)
 *  - last-admin lockout (can't demote or delete the final admin)
 *  - happy path writes + audit trail
 */

const mockHasMinimumRole = jest.fn();
const mockGetSession = jest.fn();
jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: jest.fn(),
  hasMinimumRole: (...a: unknown[]) => mockHasMinimumRole(...a),
  getSession: (...a: unknown[]) => mockGetSession(...a),
}));

const mockFindOne = jest.fn();
const mockCountDocuments = jest.fn();
const mockUpdateOne = jest.fn().mockResolvedValue({});
const mockDeleteOne = jest.fn().mockResolvedValue({});
const mockInsertOne = jest.fn().mockResolvedValue({});
jest.mock("@/lib/models", () => ({
  getAdminUsersCollection: jest.fn(async () => ({
    findOne: (...a: unknown[]) => mockFindOne(...a),
    countDocuments: (...a: unknown[]) => mockCountDocuments(...a),
    updateOne: (...a: unknown[]) => mockUpdateOne(...a),
    deleteOne: (...a: unknown[]) => mockDeleteOne(...a),
    insertOne: (...a: unknown[]) => mockInsertOne(...a),
  })),
}));

const mockCheck = jest
  .fn()
  .mockResolvedValue({ allowed: true, resetIn: 0 });
jest.mock("@/lib/utils/rateLimit", () => ({
  createRateLimiter: () => ({
    check: (...a: unknown[]) => mockCheck(...a),
    reset: jest.fn(),
  }),
}));

const mockRecordAudit = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/utils/audit", () => ({
  recordAudit: (...a: unknown[]) => mockRecordAudit(...a),
}));

import { NextRequest } from "next/server";
import { PATCH, DELETE } from "@/app/api/admin/users/[id]/route";

const VALID_ID = "507f1f77bcf86cd799439011";

function patchReq(body: unknown, id = VALID_ID) {
  const req = new NextRequest(`http://localhost:3000/api/admin/users/${id}`, {
    method: "PATCH",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return PATCH(req, { params: Promise.resolve({ id }) });
}

function deleteReq(id = VALID_ID) {
  const req = new NextRequest(`http://localhost:3000/api/admin/users/${id}`, {
    method: "DELETE",
  });
  return DELETE(req, { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockHasMinimumRole.mockResolvedValue(true);
  mockGetSession.mockResolvedValue({ username: "admin1", role: "admin" });
  mockCheck.mockResolvedValue({ allowed: true, resetIn: 0 });
  mockUpdateOne.mockResolvedValue({});
  mockDeleteOne.mockResolvedValue({});
});

describe("PATCH /api/admin/users/[id] — change access level", () => {
  it("🔒 403 when the caller is below admin", async () => {
    mockHasMinimumRole.mockResolvedValue(false);
    const res = await patchReq({ role: "staff" });
    expect(res.status).toBe(403);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("🔒 429 when the per-IP cap is hit", async () => {
    mockCheck.mockResolvedValueOnce({ allowed: false, resetIn: 60_000 });
    const res = await patchReq({ role: "staff" });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("📋 400 on a malformed object id", async () => {
    const res = await patchReq({ role: "staff" }, "not-an-id");
    expect(res.status).toBe(400);
  });

  it("📋 400 on an invalid role", async () => {
    const res = await patchReq({ role: "superuser" });
    expect(res.status).toBe(400);
  });

  it("📋 404 when the target user doesn't exist", async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await patchReq({ role: "staff" });
    expect(res.status).toBe(404);
  });

  it("🔒 400 when changing your own access level", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "admin1",
      role: "manager",
    });
    const res = await patchReq({ role: "staff" });
    expect(res.status).toBe(400);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("🔒 403 role ceiling — caller can't grant above their own level", async () => {
    // Gate is mocked open, but the session role is manager → granting admin
    // must still be refused by the ceiling guard.
    mockGetSession.mockResolvedValue({ username: "mgr", role: "manager" });
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "staff",
    });
    const res = await patchReq({ role: "admin" });
    expect(res.status).toBe(403);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("📋 200 no-op when the user already has that role (no write)", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "manager",
    });
    const res = await patchReq({ role: "manager" });
    expect(res.status).toBe(200);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("🔒 409 when demoting the last remaining admin", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "admin",
    });
    mockCountDocuments.mockResolvedValue(1);
    const res = await patchReq({ role: "staff" });
    expect(res.status).toBe(409);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("✅ demotes an admin when another admin exists, and audits it", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "admin",
    });
    mockCountDocuments.mockResolvedValue(2);
    const res = await patchReq({ role: "staff" });
    expect(res.status).toBe(200);
    expect(mockUpdateOne).toHaveBeenCalledTimes(1);
    const [, update] = mockUpdateOne.mock.calls[0];
    expect(update.$set.role).toBe("staff");
    expect(mockRecordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "user.role_change",
        targetType: "user",
        metadata: expect.objectContaining({ target: "bob", to: "staff" }),
      })
    );
  });

  it("🔒 self-heals a demotion that races to zero admins (post-write revert → 409)", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "admin",
    });
    // Fast-path count passes (2), but the post-write recheck finds zero.
    mockCountDocuments
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);
    const res = await patchReq({ role: "staff" });
    expect(res.status).toBe(409);
    // Wrote the demotion, then rolled it back to admin.
    expect(mockUpdateOne).toHaveBeenCalledTimes(2);
    expect(mockUpdateOne.mock.calls[1][1].$set.role).toBe("admin");
    expect(mockRecordAudit).not.toHaveBeenCalled();
  });

  it("✅ promotes a staff user to admin (no last-admin check needed)", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "staff",
    });
    const res = await patchReq({ role: "admin" });
    expect(res.status).toBe(200);
    expect(mockUpdateOne).toHaveBeenCalledTimes(1);
    expect(mockUpdateOne.mock.calls[0][1].$set.role).toBe("admin");
    expect(mockCountDocuments).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/users/[id] — remove account", () => {
  it("🔒 403 when the caller is below admin", async () => {
    mockHasMinimumRole.mockResolvedValue(false);
    const res = await deleteReq();
    expect(res.status).toBe(403);
    expect(mockDeleteOne).not.toHaveBeenCalled();
  });

  it("🔒 429 when the per-IP cap is hit", async () => {
    mockCheck.mockResolvedValueOnce({ allowed: false, resetIn: 60_000 });
    const res = await deleteReq();
    expect(res.status).toBe(429);
  });

  it("📋 400 on a malformed object id", async () => {
    const res = await deleteReq("nope");
    expect(res.status).toBe(400);
  });

  it("📋 404 when the target user doesn't exist", async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await deleteReq();
    expect(res.status).toBe(404);
  });

  it("🔒 400 when deleting your own account", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "admin1",
      role: "admin",
    });
    const res = await deleteReq();
    expect(res.status).toBe(400);
    expect(mockDeleteOne).not.toHaveBeenCalled();
  });

  it("🔒 409 when deleting the last remaining admin", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "admin",
    });
    mockCountDocuments.mockResolvedValue(1);
    const res = await deleteReq();
    expect(res.status).toBe(409);
    expect(mockDeleteOne).not.toHaveBeenCalled();
  });

  it("✅ removes a non-admin user and audits it", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "staff",
    });
    const res = await deleteReq();
    expect(res.status).toBe(200);
    expect(mockDeleteOne).toHaveBeenCalledTimes(1);
    expect(mockCountDocuments).not.toHaveBeenCalled();
    expect(mockRecordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.delete", targetType: "user" })
    );
  });

  it("✅ removes an admin when another admin exists", async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_ID,
      username: "bob",
      role: "admin",
    });
    mockCountDocuments.mockResolvedValue(2);
    const res = await deleteReq();
    expect(res.status).toBe(200);
    expect(mockDeleteOne).toHaveBeenCalledTimes(1);
  });

  it("🔒 self-heals a deletion that races to zero admins (re-insert → 409)", async () => {
    const doc = { _id: VALID_ID, username: "bob", role: "admin" };
    mockFindOne.mockResolvedValue(doc);
    // Fast-path count passes (2), post-delete recheck finds zero.
    mockCountDocuments
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0);
    const res = await deleteReq();
    expect(res.status).toBe(409);
    expect(mockDeleteOne).toHaveBeenCalledTimes(1);
    // Restored the row it just removed.
    expect(mockInsertOne).toHaveBeenCalledWith(doc);
    expect(mockRecordAudit).not.toHaveBeenCalled();
  });
});
