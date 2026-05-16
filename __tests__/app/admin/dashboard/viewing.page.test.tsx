/**
 * Tests for src/app/(admin)/admin/dashboard/viewing/page.tsx
 *
 * Server component that fetches initial bookings then hands them off to
 * the ViewingBookingsClient island.
 *
 * Standards coverage:
 * - 🔒 Security: unauth → redirect("/admin/login") before any DB read
 * - 📋 Functional: serialised bookings + sort by createdAt desc threaded
 *   into the client island's `initialBookings` prop
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockRedirect = jest.fn(() => {
  throw new Error("REDIRECTED");
});
const mockFind = jest.fn();

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));
jest.mock("@/lib/models", () => ({
  getCarViewingBookingsCollection: jest.fn(async () => ({
    find: (filter: unknown) => mockFind(filter),
  })),
  serializeDocument: (d: unknown) => ({ serialized: true, ...(d as object) }),
}));

let clientProps: any = null;
jest.mock("@/components/Admin/ViewingBookingsClient", () => ({
  __esModule: true,
  default: (props: unknown) => {
    clientProps = props;
    return <div data-testid="viewing-client" />;
  },
}));

import ViewingPage from "@/app/(admin)/admin/dashboard/viewing/page";

function chain(rows: unknown[]) {
  const c: any = {};
  c.sort = jest.fn().mockReturnValue(c);
  c.toArray = jest.fn().mockResolvedValue(rows);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  clientProps = null;
});

describe("admin/dashboard/viewing page", () => {
  it("🔒 unauth → redirect, no DB read", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(ViewingPage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("📋 fetches all bookings sorted by createdAt desc + serialises into the island", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    const c = chain([{ _id: "vb-1" }, { _id: "vb-2" }]);
    mockFind.mockReturnValue(c);

    const ui = await ViewingPage();
    render(ui);

    expect(mockFind).toHaveBeenCalledWith({});
    expect(c.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(clientProps.initialBookings).toEqual([
      { serialized: true, _id: "vb-1" },
      { serialized: true, _id: "vb-2" },
    ]);
    expect(screen.getByTestId("viewing-client")).toBeInTheDocument();
  });
});
