/**
 * Tests for src/app/(admin)/admin/dashboard/cars/page.tsx
 *
 * Server component that wraps CarView with an "Export CSV" link. Only the
 * link is exercised here — the CarView component is mocked to keep the
 * test focused.
 *
 * Standards coverage:
 * - 📋 Functional: renders an Export CSV link pointing at /api/admin/cars/export
 */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/models", () => ({
  getCarsCollection: jest.fn(async () => ({
    find: () => ({ toArray: async () => [] }),
  })),
  getCarViewingBookingsCollection: jest.fn(async () => ({
    find: () => ({ toArray: async () => [] }),
  })),
  serializeDocument: (d: unknown) => d,
}));

jest.mock("@/components/Car/CarView", () => ({
  __esModule: true,
  default: () => <div data-testid="car-view" />,
}));

import CarsPage from "@/app/(admin)/admin/dashboard/cars/page";

describe("admin/dashboard/cars page", () => {
  it("📋 renders an Export CSV link pointing at /api/admin/cars/export", async () => {
    const ui = await CarsPage();
    render(ui);

    const link = screen.getByTestId("export-cars-csv") as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/api/admin/cars/export");
    expect(link.hasAttribute("download")).toBe(true);
  });
});
