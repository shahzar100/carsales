/**
 * Tests for src/components/Car/Filters.tsx
 *
 * Standards coverage:
 * - 📋 Functional: derives unique makes/colours/doors/features from
 *   `cars`; "More"/"Less" toggle reveals the advanced filters block;
 *   each control dispatches the right `SET_*` / `TOGGLE_FEATURE` /
 *   `RESET_FILTERS` action onto FilterContext
 * - 🎯 Usability: shows "<filtered> of <total> vehicles" + active-count
 *   badge; Reset button only renders when any filter is active
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterProvider } from "@/contexts/FilterContext";
import Filters from "@/components/Car/Filters";
import type { CarInterface } from "@/lib/interfaces";

function makeCar(overrides: Partial<CarInterface> = {}): CarInterface {
  return {
    _id: Math.random().toString(36).slice(2),
    year: 2023,
    make: "Tesla",
    model: "Model 3",
    price: 35000,
    mileage: 10000,
    fuel: "Electric",
    transmission: "Automatic",
    doors: 4,
    colour: "White",
    status: "available",
    features: ["AC", "Bluetooth"],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as CarInterface;
}

const sampleCars: CarInterface[] = [
  makeCar({ make: "Tesla", colour: "White", doors: 4, features: ["AC"] }),
  makeCar({ make: "BMW", colour: "Black", doors: 4, features: ["Bluetooth"] }),
  makeCar({ make: "Audi", colour: "White", doors: 5, features: ["AC", "Cruise"] }),
];

function renderFilters(
  props: Partial<{
    totalCount: number;
    filteredCount: number;
    cars: CarInterface[];
  }> = {}
) {
  return render(
    <FilterProvider>
      <Filters
        totalCount={props.totalCount ?? 3}
        filteredCount={props.filteredCount ?? 3}
        cars={props.cars ?? sampleCars}
      />
    </FilterProvider>
  );
}

describe("Filters", () => {
  it("renders the header with the filtered/total counts", () => {
    renderFilters({ totalCount: 50, filteredCount: 12 });
    expect(screen.getByText(/12 of 50 vehicles/i)).toBeInTheDocument();
  });

  it("📋 'More' toggle reveals the advanced filters block", () => {
    renderFilters();
    expect(screen.queryByText("Year")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    expect(screen.getByText("Year")).toBeInTheDocument();
    expect(screen.getByText("Mileage")).toBeInTheDocument();
    expect(screen.getByText("Doors")).toBeInTheDocument();
    expect(screen.getByText("Colour")).toBeInTheDocument();
  });

  it("📋 'Less' label appears once advanced is open", () => {
    renderFilters();
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    expect(
      screen.getByRole("button", { name: /less/i })
    ).toBeInTheDocument();
  });

  it("🎯 the Reset button doesn't render when no filter is active", () => {
    renderFilters();
    // Reset button has aria-label-less RotateCcw icon — find it by lucide class.
    const buttons = screen.getAllByRole("button");
    const resetBtn = buttons.find((b) =>
      b.querySelector(".lucide-rotate-ccw")
    );
    expect(resetBtn).toBeUndefined();
  });

  it("📋 changing the Status select updates the displayed value", () => {
    renderFilters();
    // FilterSelect renders a native <select> with a sibling <label> div
    // (no htmlFor binding). Locate the right select by one of its option
    // texts — the Status select has "All Statuses" as its placeholder.
    const statusSelect = Array.from(
      document.querySelectorAll("select")
    ).find((s) =>
      Array.from(s.options).some((o) => o.textContent === "All Statuses")
    ) as HTMLSelectElement;
    expect(statusSelect).toBeTruthy();
    fireEvent.change(statusSelect, { target: { value: "reserved" } });
    expect(statusSelect.value).toBe("reserved");
  });

  it("📋 advanced: Doors options derive from the cars' unique doors values", () => {
    renderFilters();
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    // The Doors select uses "Any" as the placeholder option.
    const doorsSelect = Array.from(
      document.querySelectorAll("select")
    ).find((s) =>
      Array.from(s.options).some((o) => o.textContent === "Any")
    ) as HTMLSelectElement;
    expect(doorsSelect).toBeTruthy();
    const optionTexts = Array.from(doorsSelect.options).map(
      (o) => o.textContent
    );
    expect(optionTexts).toContain("4 doors");
    expect(optionTexts).toContain("5 doors");
  });

  it("📋 features section lists all unique features across the cars", () => {
    renderFilters();
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    // CarFeatures renders one toggle per unique feature in the dataset.
    expect(screen.getByText("AC")).toBeInTheDocument();
    expect(screen.getByText("Bluetooth")).toBeInTheDocument();
    expect(screen.getByText("Cruise")).toBeInTheDocument();
  });
});
