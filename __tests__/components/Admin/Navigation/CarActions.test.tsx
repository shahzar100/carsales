/**
 * Tests for src/components/Admin/Navigation/CarActions.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders an Actions dropdown with Edit / View / Delete;
 *   Edit points at the real admin edit route, View at the public listing;
 *   Delete opens a confirmation dialog (it no longer silently no-ops).
 */
import React from "react";
import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import CarActions from "@/components/Admin/Navigation/CarActions";
import { NavigationProvider } from "@/contexts/NavigationContext";
import type { CarInterface } from "@/lib/interfaces";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/admin/dashboard/cars",
}));
jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));

// NavLink children rely on NavigationContext for click side-effects.
const render = (ui: React.ReactElement) =>
  rtlRender(<NavigationProvider>{ui}</NavigationProvider>);

const car = {
  _id: "car-123",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
} as unknown as CarInterface;

describe("CarActions", () => {
  it("renders an Actions toggle button", () => {
    render(<CarActions car={car} />);
    expect(
      screen.getByRole("button", { name: /actions/i })
    ).toBeInTheDocument();
  });

  it("📋 Edit links to the real admin edit route; View to the public listing", () => {
    render(<CarActions car={car} />);
    const edit = screen.getByText("Edit Car").closest("a");
    const view = screen.getByText("View Listing").closest("a");
    expect(edit).toHaveAttribute(
      "href",
      "/admin/dashboard/cars/edit/car-123"
    );
    expect(view).toHaveAttribute("href", "/BrowseFleet/car-123");
  });

  it("📋 clicking Delete opens a confirmation dialog", () => {
    render(<CarActions car={car} />);
    expect(screen.queryByText("Delete car?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /delete car/i }));
    expect(screen.getByText("Delete car?")).toBeInTheDocument();
  });
});
