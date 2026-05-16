/**
 * Tests for src/app/(admin)/admin/dashboard/quotes/page.tsx
 *
 * Standards coverage:
 * - 🔒 Security: unauth → redirect("/admin/login") before any DB read
 * - 📋 Functional: passes empty filter when no `?status=`; valid status
 *   threads through; invalid status is silently dropped (not pushed into
 *   the filter); fetches sorted by createdAt desc + limit 50; serialises
 *   docs before handing to the table
 */
import React from "react";
import { render, screen } from "@testing-library/react";

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
  getQuotesCollection: jest.fn(async () => ({
    find: (filter: unknown) => mockFind(filter),
    countDocuments: (filter: unknown) => mockCountDocuments(filter),
  })),
  serializeDocument: (d: unknown) => ({ serialized: true, ...(d as object) }),
}));

let tableProps: any = null;
jest.mock("@/components/Admin/QuotesTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    tableProps = props;
    return <div data-testid="quotes-table" />;
  },
}));

import QuotesPage from "@/app/(admin)/admin/dashboard/quotes/page";

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

describe("admin/dashboard/quotes page", () => {
  it("🔒 unauth → redirect, no DB read", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(
      QuotesPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("📋 no ?status → empty filter passed to find/count", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    mockCountDocuments.mockResolvedValue(0);

    const ui = await QuotesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(mockFind).toHaveBeenCalledWith({});
    expect(mockCountDocuments).toHaveBeenCalledWith({});
    expect(tableProps.filter).toEqual({ status: undefined });
    expect(tableProps.pagination).toEqual({ page: 1, limit: 50, total: 0 });
  });

  it("📋 valid ?status=pending threads through into the filter", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([{ _id: "q1" }]));
    mockCountDocuments.mockResolvedValue(1);

    const ui = await QuotesPage({
      searchParams: Promise.resolve({ status: "pending" }),
    });
    render(ui);

    expect(mockFind).toHaveBeenCalledWith({ status: "pending" });
    expect(mockCountDocuments).toHaveBeenCalledWith({ status: "pending" });
    expect(tableProps.rows).toEqual([{ serialized: true, _id: "q1" }]);
    expect(tableProps.filter).toEqual({ status: "pending" });
  });

  it("🔒 invalid ?status is silently dropped (not pushed into filter)", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockFind.mockReturnValue(chain([]));
    mockCountDocuments.mockResolvedValue(0);

    const ui = await QuotesPage({
      searchParams: Promise.resolve({ status: "not-a-real-status" }),
    });
    render(ui);

    expect(mockFind).toHaveBeenCalledWith({});
    // But the filter prop still reflects the URL value for the form state.
    expect(tableProps.filter).toEqual({ status: "not-a-real-status" });
  });

  it("📋 sort + limit + serialize wiring is correct", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const c = chain([{ _id: "q1" }, { _id: "q2" }]);
    mockFind.mockReturnValue(c);
    mockCountDocuments.mockResolvedValue(2);

    const ui = await QuotesPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(c.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(c.limit).toHaveBeenCalledWith(50);
    expect(tableProps.rows).toEqual([
      { serialized: true, _id: "q1" },
      { serialized: true, _id: "q2" },
    ]);
    expect(screen.getByTestId("quotes-table")).toBeInTheDocument();
  });
});
