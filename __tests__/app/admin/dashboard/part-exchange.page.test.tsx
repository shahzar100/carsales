/**
 * Tests for src/app/(admin)/admin/dashboard/part-exchange/page.tsx
 *
 * Same shape as quotes / reservations: auth gate, optional `?status=`
 * whitelist (pending / valued / accepted / declined), hand rows to
 * PartExchangeTable.
 */
import React from "react";
import { render } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockRedirect = jest.fn(() => {
  throw new Error("REDIRECTED");
});
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));
jest.mock("@/lib/models", () => ({
  getPartExchangesCollection: jest.fn(async () => ({
    find: (filter: unknown) => mockFind(filter),
    countDocuments: (filter: unknown) => mockCountDocuments(filter),
  })),
  serializeDocument: (d: unknown) => ({ serialized: true, ...(d as object) }),
}));

let tableProps: any = null;
jest.mock("@/components/Admin/PartExchangeTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    tableProps = props;
    return <div data-testid="px-table" />;
  },
}));

import PartExchangePage from "@/app/(admin)/admin/dashboard/part-exchange/page";

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
});

describe("admin/dashboard/part-exchange page", () => {
  it("🔒 unauth → redirect, no DB read", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(
      PartExchangePage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("📋 valid ?status=valued threads through into the filter", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([{ _id: "px-1" }]));
    mockCountDocuments.mockResolvedValue(1);
    const ui = await PartExchangePage({
      searchParams: Promise.resolve({ status: "valued" }),
    });
    render(ui);
    expect(mockFind).toHaveBeenCalledWith({ status: "valued" });
    expect(tableProps.rows).toEqual([{ serialized: true, _id: "px-1" }]);
  });

  it("🔒 invalid ?status dropped from DB filter (but kept in URL state)", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    mockCountDocuments.mockResolvedValue(0);
    const ui = await PartExchangePage({
      searchParams: Promise.resolve({ status: "made-up" }),
    });
    render(ui);
    expect(mockFind).toHaveBeenCalledWith({});
    expect(tableProps.filter).toEqual({ status: "made-up" });
  });

  it("📋 sort + limit + serialize wiring", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const c = chain([{ _id: "a" }, { _id: "b" }]);
    mockFind.mockReturnValue(c);
    mockCountDocuments.mockResolvedValue(2);
    const ui = await PartExchangePage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(c.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(c.limit).toHaveBeenCalledWith(50);
    expect(tableProps.rows).toEqual([
      { serialized: true, _id: "a" },
      { serialized: true, _id: "b" },
    ]);
    expect(tableProps.pagination).toEqual({ page: 1, limit: 50, total: 2 });
  });
});
