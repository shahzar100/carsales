/**
 * Tests for src/app/(admin)/admin/dashboard/users/page.tsx
 *
 * - 🔒 Security: requires authentication AND manager+ (staff are redirected
 *   to /admin/dashboard, never see the roster)
 * - 🔒 Security: the secret-free summary is what crosses to the client —
 *   passwordHash / resetToken never reach the island props
 * - 📋 Functional: current username + role are threaded to the island
 */
import React from "react";
import { render } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockHasMinimumRole = jest.fn();
const mockGetSession = jest.fn();
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`REDIRECTED:${url}`);
});
const mockFind = jest.fn();

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
  hasMinimumRole: (role: string) => mockHasMinimumRole(role),
  getSession: () => mockGetSession(),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));
jest.mock("@/lib/models", () => ({
  getAdminUsersCollection: jest.fn(async () => ({
    find: (filter: unknown, opts: unknown) => mockFind(filter, opts),
  })),
}));

let clientProps: any = null;
jest.mock("@/components/Admin/UsersClient", () => ({
  __esModule: true,
  default: (props: unknown) => {
    clientProps = props;
    return <div data-testid="users-client" />;
  },
}));

import UsersPage from "@/app/(admin)/admin/dashboard/users/page";

function chain(docs: unknown[]) {
  const c: any = {};
  c.sort = jest.fn().mockReturnValue(c);
  c.toArray = jest.fn().mockResolvedValue(docs);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  clientProps = null;
  mockGetSession.mockResolvedValue({ username: "admin1", role: "admin" });
});

describe("admin/dashboard/users page", () => {
  it("🔒 unauthenticated → /admin/login", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(UsersPage()).rejects.toThrow("REDIRECTED:/admin/login");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("🔒 authed staff (below manager) → /admin/dashboard", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(false);
    await expect(UsersPage()).rejects.toThrow("REDIRECTED:/admin/dashboard");
    expect(mockHasMinimumRole).toHaveBeenCalledWith("manager");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("🔒 manager+ renders, and secrets never reach the island", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    mockFind.mockReturnValue(
      chain([
        {
          _id: { toString: () => "u1" },
          username: "bob",
          email: "bob@example.com",
          role: "manager",
          passwordHash: "$2b$12$leak",
          resetToken: "tok",
          totpEnabled: true,
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      ])
    );

    const ui = await UsersPage();
    render(ui);

    expect(mockFind).toHaveBeenCalledWith(
      {},
      { projection: { passwordHash: 0, totpSecret: 0 } }
    );
    const u = clientProps.initialUsers[0];
    expect(u.username).toBe("bob");
    expect(u.pendingSetup).toBe(true);
    expect(u.twoFactorEnabled).toBe(true);
    expect(u).not.toHaveProperty("passwordHash");
    expect(u).not.toHaveProperty("resetToken");
    expect(clientProps.currentUsername).toBe("admin1");
    expect(clientProps.currentRole).toBe("admin");
  });
});
