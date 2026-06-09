/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/users (src/app/api/admin/users/route.ts) — the
 * roster listing for the access-management page.
 *
 * The security-critical property is that secrets never cross the API
 * boundary: the response must omit `passwordHash`, `totpSecret`, and
 * `resetToken` even if the underlying document still carries them.
 */

const mockHasMinimumRole = jest.fn();
jest.mock("@/lib/utils/auth", () => ({
  hasMinimumRole: (...a: unknown[]) => mockHasMinimumRole(...a),
  // POST in the same module imports these — stub so the module loads.
  getSession: jest.fn(),
  hashPassword: jest.fn(),
}));

const mockFind = jest.fn();
function chain(docs: unknown[]) {
  const c: Record<string, unknown> = {};
  c.sort = jest.fn().mockReturnValue(c);
  c.toArray = jest.fn().mockResolvedValue(docs);
  return c;
}
jest.mock("@/lib/models", () => ({
  getAdminUsersCollection: jest.fn(async () => ({
    find: (...a: unknown[]) => mockFind(...a),
  })),
}));

import { GET } from "@/app/api/admin/users/route";

beforeEach(() => {
  jest.clearAllMocks();
  mockHasMinimumRole.mockResolvedValue(true);
});

describe("GET /api/admin/users", () => {
  it("🔒 403 when the caller is below manager", async () => {
    mockHasMinimumRole.mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(403);
    expect(mockHasMinimumRole).toHaveBeenCalledWith("manager");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("🔒 projects secrets out of the Mongo query", async () => {
    mockFind.mockReturnValue(chain([]));
    await GET();
    expect(mockFind).toHaveBeenCalledWith(
      {},
      { projection: { passwordHash: 0, totpSecret: 0 } }
    );
  });

  it("🔒 never returns passwordHash / totpSecret / resetToken in the payload", async () => {
    mockFind.mockReturnValue(
      chain([
        {
          _id: { toString: () => "abc123" },
          username: "bob",
          email: "bob@example.com",
          role: "manager",
          passwordHash: "$2b$12$leakme",
          totpSecret: "SECRET",
          resetToken: "deadbeef",
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      ])
    );
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    const user = data.users[0];
    expect(user.username).toBe("bob");
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("totpSecret");
    expect(user).not.toHaveProperty("resetToken");
  });

  it("📋 derives pendingSetup from the reset token and twoFactorEnabled from totpEnabled", async () => {
    mockFind.mockReturnValue(
      chain([
        {
          _id: { toString: () => "1" },
          username: "pending",
          email: "p@example.com",
          role: "staff",
          resetToken: "tok",
          totpEnabled: false,
          createdAt: new Date("2026-01-02T00:00:00Z"),
        },
        {
          _id: { toString: () => "2" },
          username: "active",
          email: "a@example.com",
          role: "admin",
          totpEnabled: true,
          createdAt: new Date("2026-01-03T00:00:00Z"),
          lastLogin: new Date("2026-02-01T00:00:00Z"),
        },
      ])
    );
    const res = await GET();
    const { users } = await res.json();

    expect(users[0]).toMatchObject({
      username: "pending",
      pendingSetup: true,
      twoFactorEnabled: false,
    });
    expect(users[1]).toMatchObject({
      username: "active",
      pendingSetup: false,
      twoFactorEnabled: true,
    });
    // Dates are serialised to ISO strings across the boundary.
    expect(typeof users[1].lastLogin).toBe("string");
  });
});
