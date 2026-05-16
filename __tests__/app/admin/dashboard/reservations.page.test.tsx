/**
 * Tests for src/app/(admin)/admin/dashboard/reservations/page.tsx
 *
 * Same shape as the quotes admin page — auth gate, MongoDB read with an
 * optional `?status=` whitelist filter, then hand the serialised rows to
 * ReservationsTable. Different VALID_STATUSES list (pending / confirmed
 * / cancelled / expired vs quotes' pending / responded / accepted / expired).
 */
import React from "react";
import { render } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockRedirect = jest.fn((_url: string) => {
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
  getReservationsCollection: jest.fn(async () => ({
    find: (filter: unknown) => mockFind(filter),
    countDocuments: (filter: unknown) => mockCountDocuments(filter),
  })),
  serializeDocument: (d: unknown) => ({ serialized: true, ...(d as object) }),
}));

let tableProps: any = null;
jest.mock("@/components/Admin/ReservationsTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    tableProps = props;
    return <div data-testid="reservations-table" />;
  },
}));

import ReservationsPage from "@/app/(admin)/admin/dashboard/reservations/page";

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

describe("admin/dashboard/reservations page", () => {
  it("🔒 unauth → redirect, no DB read", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(
      ReservationsPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("📋 valid ?status=confirmed threads through", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([{ _id: "r1" }]));
    mockCountDocuments.mockResolvedValue(1);
    const ui = await ReservationsPage({
      searchParams: Promise.resolve({ status: "confirmed" }),
    });
    render(ui);
    expect(mockFind).toHaveBeenCalledWith({ status: "confirmed" });
    expect(tableProps.rows).toEqual([{ serialized: true, _id: "r1" }]);
    expect(tableProps.pagination).toEqual({ page: 1, limit: 50, total: 1 });
  });

  it("🔒 invalid ?status dropped from filter", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    mockCountDocuments.mockResolvedValue(0);
    const ui = await ReservationsPage({
      searchParams: Promise.resolve({ status: "weird" }),
    });
    render(ui);
    expect(mockFind).toHaveBeenCalledWith({});
    expect(tableProps.filter).toEqual({ status: "weird" });
  });

  it("📋 sort by createdAt desc + limit 50", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const c = chain([]);
    mockFind.mockReturnValue(c);
    mockCountDocuments.mockResolvedValue(0);
    const ui = await ReservationsPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(c.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(c.limit).toHaveBeenCalledWith(50);
  });
});
