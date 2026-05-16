/**
 * Tests for src/app/(admin)/admin/dashboard/audit/page.tsx
 *
 * Standards coverage:
 * - 🔒 Security: requires authentication AND admin role
 *   (manager/staff are redirected to /admin/dashboard, not the audit page)
 * - 📋 Functional: empty / whitespace filters dropped (not pushed into
 *   the Mongo query); targetType whitelist enforced; cursor parses as
 *   ISO date and becomes `{ $lt: <date> }`; bad cursor silently ignored;
 *   over-fetches by 1 so we know whether `nextCursor` is needed; distinct
 *   actors/actions are sorted
 */
import React from "react";
import { render } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockHasMinimumRole = jest.fn();
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`REDIRECTED:${url}`);
});
const mockFind = jest.fn();
const mockDistinct = jest.fn();

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
  hasMinimumRole: (role: string) => mockHasMinimumRole(role),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));
jest.mock("@/lib/models", () => ({
  getAuditLogsCollection: jest.fn(async () => ({
    find: (filter: unknown) => mockFind(filter),
    distinct: (field: string) => mockDistinct(field),
  })),
  serializeDocument: (d: unknown) => ({ ...(d as object) }),
}));

let tableProps: any = null;
jest.mock("@/components/Admin/AuditLogTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    tableProps = props;
    return <div data-testid="audit-table" />;
  },
}));

import AuditPage from "@/app/(admin)/admin/dashboard/audit/page";

function chain(rows: unknown[]) {
  const c: any = {};
  c.sort = jest.fn().mockReturnValue(c);
  c.limit = jest.fn().mockReturnValue(c);
  c.toArray = jest.fn().mockResolvedValue(rows);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  tableProps = null;
  mockDistinct.mockResolvedValue([]);
});

describe("admin/dashboard/audit page", () => {
  it("🔒 unauth → /admin/login", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(
      AuditPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("REDIRECTED:/admin/login");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("🔒 authed but not admin → /admin/dashboard (no audit data shown)", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(false);
    await expect(
      AuditPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("REDIRECTED:/admin/dashboard");
    expect(mockHasMinimumRole).toHaveBeenCalledWith("admin");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("📋 no filters → empty Mongo filter, sort desc, fetches 51 (PAGE_SIZE+1)", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    const c = chain([]);
    mockFind.mockReturnValue(c);
    const ui = await AuditPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(mockFind).toHaveBeenCalledWith({});
    expect(c.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(c.limit).toHaveBeenCalledWith(51);
  });

  it("📋 whitespace-only actor/action filters are dropped", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    await AuditPage({
      searchParams: Promise.resolve({ actor: "   ", action: "\t" }),
    });
    expect(mockFind).toHaveBeenCalledWith({});
  });

  it("📋 trims actor + action filters when supplied", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    await AuditPage({
      searchParams: Promise.resolve({
        actor: "  alice  ",
        action: " car.update ",
      }),
    });
    expect(mockFind).toHaveBeenCalledWith({
      actor: "alice",
      action: "car.update",
    });
  });

  it("🔒 unknown targetType is silently dropped from the filter", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    await AuditPage({
      searchParams: Promise.resolve({ targetType: "not-a-thing" }),
    });
    expect(mockFind).toHaveBeenCalledWith({});
  });

  it("📋 valid targetType passes through (whitelist enforced)", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    await AuditPage({
      searchParams: Promise.resolve({ targetType: "booking" }),
    });
    expect(mockFind).toHaveBeenCalledWith({ targetType: "booking" });
  });

  it("📋 cursor parses to a Date and becomes `{ createdAt: { $lt: <Date> } }`", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    const cursor = "2026-05-01T10:30:00.000Z";
    await AuditPage({
      searchParams: Promise.resolve({ cursor }),
    });
    const [filter] = mockFind.mock.calls[0];
    expect((filter as any).createdAt.$lt).toBeInstanceOf(Date);
    expect((filter as any).createdAt.$lt.toISOString()).toBe(cursor);
  });

  it("🔒 bad cursor (NaN) silently dropped — no DB error", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    await AuditPage({
      searchParams: Promise.resolve({ cursor: "not-a-date" }),
    });
    expect(mockFind).toHaveBeenCalledWith({});
  });

  it("📋 51 rows back → 50 returned + nextCursor set from the 50th's createdAt", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    const rows = Array.from({ length: 51 }, (_, i) => ({
      _id: `r${i}`,
      createdAt: new Date(2026, 4, 1 + i),
    }));
    mockFind.mockReturnValue(chain(rows));
    const ui = await AuditPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(tableProps.rows).toHaveLength(50);
    expect(tableProps.nextCursor).toBe(rows[49].createdAt);
  });

  it("📋 fewer than 51 rows → nextCursor is null (no more pages)", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    const rows = [{ _id: "r1", createdAt: new Date() }];
    mockFind.mockReturnValue(chain(rows));
    const ui = await AuditPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(tableProps.rows).toHaveLength(1);
    expect(tableProps.nextCursor).toBeNull();
  });

  it("📋 distinct actors + actions are sorted before being passed in", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockHasMinimumRole.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    mockDistinct
      .mockResolvedValueOnce(["charlie", "alice", "bob"])
      .mockResolvedValueOnce(["car.delete", "car.create", "user.create"]);
    const ui = await AuditPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(tableProps.actors).toEqual(["alice", "bob", "charlie"]);
    expect(tableProps.actions).toEqual([
      "car.create",
      "car.delete",
      "user.create",
    ]);
  });
});
