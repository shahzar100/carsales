/**
 * Tests for src/components/Car/CarListCard.tsx
 *
 * Standards coverage:
 * - 📋 Functional: customer + admin variants render the right action set
 *   (customer: View Details + ShareButton + SaveCarButton; admin: Featured
 *   toggle + CarActions); per-status colour wiring; featured badge only
 *   when `car.featured`; image fallback; truncated feature list with
 *   "+N more" overflow
 * - 🎯 Usability: View Details link points at /BrowseFleet/<id>
 */
import React from "react";
import { render as rtlRender, screen } from "@testing-library/react";
import { NavigationProvider } from "@/contexts/NavigationContext";

const mockUseSavedCars = jest.fn(() => ({
  savedIds: [],
  isSaved: () => false,
  toggle: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
}));
jest.mock("@/contexts/SavedCarsContext", () => ({
  useSavedCars: () => mockUseSavedCars(),
}));

import CarListCard from "@/components/Car/CarListCard";
import type { CarInterface } from "@/lib/interfaces";

// CarActions (admin variant) nests NavLink → NavigationContext usage.
const render = (ui: React.ReactElement) =>
  rtlRender(<NavigationProvider>{ui}</NavigationProvider>);

const baseCar: CarInterface = {
  _id: "car-1",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
  price: 35000,
  mileage: 12345,
  fuel: "Electric",
  transmission: "Automatic",
  doors: 4,
  colour: "White",
  status: "available",
  features: ["AC", "Bluetooth", "Cruise", "Heated seats", "Lane assist", "Wireless charging"],
  description: "A great car.",
  featured: false,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
} as unknown as CarInterface;

describe("CarListCard", () => {
  beforeEach(() => {
    mockUseSavedCars.mockReturnValue({
      savedIds: [],
      isSaved: () => false,
      toggle: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    });
  });

  it("renders make, model, year, mileage, price for both variants", () => {
    render(<CarListCard car={baseCar} />);
    expect(screen.getByText("Tesla Model 3")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getAllByText(/12,345/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/£35,000/)[0]).toBeInTheDocument();
  });

  it("📋 customer variant: View Details link points at /BrowseFleet/<id>", () => {
    render(<CarListCard car={baseCar} variant="customer" />);
    const link = screen.getByText(/view details/i).closest("a");
    expect(link).toHaveAttribute("href", "/BrowseFleet/car-1");
  });

  it("📋 customer variant: SaveCarButton is rendered", () => {
    render(<CarListCard car={baseCar} variant="customer" />);
    expect(
      screen.getByRole("button", { name: /save this car/i })
    ).toBeInTheDocument();
  });

  it("📋 customer variant: shows the status dot + label", () => {
    render(<CarListCard car={baseCar} variant="customer" />);
    expect(screen.getByText(/available/i)).toBeInTheDocument();
  });

  it("📋 admin variant: status badge with per-status colour shows up", () => {
    const { container } = render(
      <CarListCard car={{ ...baseCar, status: "sold" }} variant="admin" />
    );
    // The status badge text appears.
    expect(screen.getByText(/sold/i)).toBeInTheDocument();
    // Sold uses bg-red-100; the badge element has that class somewhere.
    expect(container.innerHTML).toContain("bg-red-100");
  });

  it("📋 admin variant: no SaveCarButton; CarActions present", () => {
    render(<CarListCard car={baseCar} variant="admin" />);
    expect(
      screen.queryByRole("button", { name: /save this car/i })
    ).not.toBeInTheDocument();
    // CarActions renders a NavButton with text "Actions".
    expect(
      screen.getByRole("button", { name: /actions/i })
    ).toBeInTheDocument();
  });

  it("📋 Featured badge only renders when car.featured=true", () => {
    const { rerender } = render(
      <CarListCard car={baseCar} variant="customer" />
    );
    expect(screen.queryByText(/featured/i)).not.toBeInTheDocument();
    rerender(
      <CarListCard car={{ ...baseCar, featured: true }} variant="customer" />
    );
    expect(screen.getByText(/featured/i)).toBeInTheDocument();
  });

  it("📋 features list truncates to 5 and shows '+N more' overflow", () => {
    render(<CarListCard car={baseCar} variant="customer" />);
    expect(screen.getByText("AC")).toBeInTheDocument();
    expect(screen.getByText("Lane assist")).toBeInTheDocument();
    expect(screen.queryByText("Wireless charging")).not.toBeInTheDocument();
    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });

  it("🎯 falls back to /tesla.webp placeholder image when no image is set", () => {
    render(<CarListCard car={baseCar} variant="customer" />);
    const img = screen.getByAltText("Tesla Model 3");
    expect(img.getAttribute("src")).toContain("tesla.webp");
  });

  it("📋 customer variant: omits status badge in the top-left corner", () => {
    const { container } = render(
      <CarListCard car={baseCar} variant="customer" />
    );
    // Only one "available" appears (the customer bottom dot label); the
    // admin variant would also have it as a top-left badge.
    expect(screen.getAllByText(/available/i)).toHaveLength(1);
    expect(container.querySelectorAll(".bg-emerald-100").length).toBe(0);
  });
});
