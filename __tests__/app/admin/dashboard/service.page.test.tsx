/**
 * Tests for src/app/(admin)/admin/dashboard/service/page.tsx
 *
 * Server Component shell — auth gate + initial-data fetch then hands off
 * to ServiceBookingsClient. The CRUD UI lives in the client.
 *
 * Standards coverage:
 * - 🔒 Security: unauth → redirect("/admin/login") before any DB read
 * - 📋 Functional: docs are sorted by createdAt desc and serialised
 *   before being passed to the client
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockRedirect = jest.fn((_url: string) => {
  throw new Error("REDIRECTED");
});
const mockToArray = jest.fn();
const sortSpy = jest.fn();

jest.mock("@/lib/utils/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));
jest.mock("@/lib/models", () => ({
  getServiceAppointmentsCollection: jest.fn(async () => ({
    find: () => ({
      sort: (s: unknown) => {
        sortSpy(s);
        return { toArray: () => mockToArray() };
      },
    }),
  })),
  serializeDocument: (d: unknown) => ({ ...(d as object) }),
}));

let clientProps: any = null;
jest.mock("@/components/Admin/ServiceBookingsClient", () => ({
  __esModule: true,
  default: (props: unknown) => {
    clientProps = props;
    return <div data-testid="service-client" />;
  },
}));

import ServicePage from "@/app/(admin)/admin/dashboard/service/page";

beforeEach(() => {
  jest.clearAllMocks();
  clientProps = null;
});

describe("(admin)/admin/dashboard/service page", () => {
  it("🔒 unauth → redirect, no DB read", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(ServicePage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockToArray).not.toHaveBeenCalled();
  });

  it("📋 sorts by createdAt desc + threads initialBookings into ServiceBookingsClient", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockToArray.mockResolvedValue([
      { _id: "b1", customerName: "Alice" },
      { _id: "b2", customerName: "Bob" },
    ]);
    const ui = await ServicePage();
    render(ui);
    expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
    expect(screen.getByTestId("service-client")).toBeInTheDocument();
    expect(clientProps.initialBookings).toHaveLength(2);
    expect(clientProps.initialBookings[0].customerName).toBe("Alice");
  });

  it("📋 empty collection → client receives an empty array", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockToArray.mockResolvedValue([]);
    const ui = await ServicePage();
    render(ui);
    expect(clientProps.initialBookings).toEqual([]);
  });
});
