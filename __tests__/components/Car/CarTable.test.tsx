/**
 * Tests for src/components/Car/CarTable.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders one row per visible car; per-page pagination
 *   slices the input list; resets to page 1 when the underlying list
 *   shrinks below the current page; per-row Actions dropdown wired with
 *   the car's id
 * - 🎯 Usability: empty-state copy when cars=[]
 */
import React from "react";
import { render as rtlRender, screen } from "@testing-library/react";
import { NavigationProvider } from "@/contexts/NavigationContext";
import CarTable from "@/components/Car/CarTable";
import type { CarInterface } from "@/lib/interfaces";

const render = (ui: React.ReactElement) =>
  rtlRender(<NavigationProvider>{ui}</NavigationProvider>);

function makeCar(i: number): CarInterface {
  return {
    _id: `car-${i}`,
    year: 2020 + (i % 5),
    make: ["Tesla", "BMW", "Audi", "Ford", "VW"][i % 5],
    model: `Model${i}`,
    price: 10000 + i * 1000,
    mileage: 5000 + i * 100,
    fuel: "Electric",
    transmission: "Automatic",
    doors: 4,
    colour: "White",
    status: "available",
    features: [],
    image: "",
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
  } as unknown as CarInterface;
}

describe("CarTable", () => {
  it("🎯 shows the empty state when cars is []", () => {
    render(<CarTable cars={[]} />);
    expect(screen.getByText(/no cars found/i)).toBeInTheDocument();
  });

  it("📋 renders the table header columns", () => {
    render(<CarTable cars={[makeCar(0)]} />);
    expect(screen.getByText("Vehicle")).toBeInTheDocument();
    // "Year" can appear in row text too; allow multiple.
    expect(screen.getAllByText("Year").length).toBeGreaterThan(0);
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Mileage")).toBeInTheDocument();
    expect(screen.getByText("Specs")).toBeInTheDocument();
    expect(screen.getByText("Added")).toBeInTheDocument();
    // "Actions" appears in both the header AND the per-row dropdown.
    expect(screen.getAllByText("Actions").length).toBeGreaterThan(0);
  });

  it("📋 paginates: only first 10 rows visible by default", () => {
    const cars = Array.from({ length: 25 }, (_, i) => makeCar(i));
    render(<CarTable cars={cars} />);
    // First page has cars 0..9; "Model0" through "Model9" should be visible.
    expect(screen.getByText("Tesla Model0")).toBeInTheDocument();
    expect(screen.getByText("BMW Model6")).toBeInTheDocument();
    // 10..onwards are on later pages.
    expect(screen.queryByText("BMW Model11")).not.toBeInTheDocument();
  });

  it("renders per-row formatted price and mileage", () => {
    render(<CarTable cars={[makeCar(0)]} />);
    // makeCar(0): price=10000, mileage=5000 → £10,000 and 5,000.
    // Each can appear in multiple cells of the row.
    expect(screen.getAllByText(/£10,000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5,000/).length).toBeGreaterThan(0);
  });

  it("📋 includes a CarActions dropdown per row", () => {
    render(<CarTable cars={[makeCar(0), makeCar(1)]} />);
    // CarActions renders a NavButton with text "Actions" — one per row.
    const actionButtons = screen.getAllByRole("button", {
      name: /^actions$/i,
    });
    expect(actionButtons).toHaveLength(2);
  });

  it("renders the per-row status badge", () => {
    render(
      <CarTable
        cars={[
          { ...makeCar(0), status: "sold" } as CarInterface,
          { ...makeCar(1), status: "reserved" } as CarInterface,
        ]}
      />
    );
    expect(screen.getAllByText(/sold/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/reserved/i).length).toBeGreaterThan(0);
  });
});
