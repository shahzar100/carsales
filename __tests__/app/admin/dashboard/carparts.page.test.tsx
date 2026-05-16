/**
 * Tests for src/app/(admin)/admin/dashboard/carparts/page.tsx
 *
 * Server Component shell — auth gate + initial-inventory fetch then
 * hands off to CarPartsClient. CRUD UI lives in the client.
 *
 * Standards coverage:
 * - 🔒 Security: unauth → redirect("/admin/login") before any DB read
 * - 📋 Functional: docs are sorted by createdAt desc and serialised
 *   before being passed to the client
 */
import React from "react";
import { render, screen } from "@testing-library/react";

const mockIsAuthenticated = jest.fn();
const mockRedirect = jest.fn(() => {
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
  getCarPartsCollection: jest.fn(async () => ({
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
jest.mock("@/components/Admin/CarPartsClient", () => ({
  __esModule: true,
  default: (props: unknown) => {
    clientProps = props;
    return <div data-testid="carparts-client" />;
  },
}));

import CarPartsPage from "@/app/(admin)/admin/dashboard/carparts/page";

beforeEach(() => {
  jest.clearAllMocks();
  clientProps = null;
});

describe("(admin)/admin/dashboard/carparts page", () => {
  it("🔒 unauth → redirect, no DB read", async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    await expect(CarPartsPage()).rejects.toThrow("REDIRECTED");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
    expect(mockToArray).not.toHaveBeenCalled();
  });

  it("📋 sorts by createdAt desc + threads initialParts into CarPartsClient", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockToArray.mockResolvedValue([
      { _id: "p1", name: "Brake Pads" },
      { _id: "p2", name: "Air Filter" },
    ]);
    const ui = await CarPartsPage();
    render(ui);
    expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
    expect(screen.getByTestId("carparts-client")).toBeInTheDocument();
    expect(clientProps.initialParts).toHaveLength(2);
    expect(clientProps.initialParts[0].name).toBe("Brake Pads");
  });

  it("📋 empty collection → client receives an empty array", async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockToArray.mockResolvedValue([]);
    const ui = await CarPartsPage();
    render(ui);
    expect(clientProps.initialParts).toEqual([]);
  });
});
