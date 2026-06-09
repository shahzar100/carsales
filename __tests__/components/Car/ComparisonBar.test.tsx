/**
 * Tests for src/components/Car/ComparisonBar.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders nothing when the comparison list is empty; renders a
 *   labelled <section> with a "N/3" count, one tile per compared car, and the
 *   Clear / Compare Now actions when 1+ cars are present. Remove buttons fire
 *   `removeFromCompare(String(_id))`; Clear fires `clearComparison()`.
 * - 🔒 Security / robustness: falls back to "/tesla.webp" when a car has no
 *   image; coerces a missing `_id` to an empty string when removing.
 * - 🎯 Usability: the bar exposes aria-label "Car comparison bar"; each remove
 *   control has a descriptive accessible name; the Compare Now CTA is a link to
 *   /Compare.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { CarInterface } from "@/lib/interfaces";

const removeFromCompare = jest.fn();
const clearComparison = jest.fn();
let comparedCars: CarInterface[] = [];

jest.mock("@/contexts/ComparisonContext", () => ({
  useComparison: () => ({
    comparedCars,
    removeFromCompare,
    clearComparison,
    addToCompare: jest.fn(),
    isInComparison: jest.fn(),
  }),
}));

import ComparisonBar from "@/components/Car/ComparisonBar";

// Minimal CarInterface factory — only the fields ComparisonBar reads matter,
// the rest satisfy the strict type.
function makeCar(overrides: Partial<CarInterface> = {}): CarInterface {
  return {
    _id: "car-1",
    make: "Tesla",
    model: "Model 3",
    year: 2022,
    price: 30000,
    mileage: 10000,
    fuel: "Electric",
    transmission: "Automatic",
    doors: 4,
    colour: "White",
    image: "https://cdn.example.com/tesla.jpg",
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date(),
    featured: false,
    ...overrides,
  };
}

beforeEach(() => {
  removeFromCompare.mockReset();
  clearComparison.mockReset();
  comparedCars = [];
});

describe("ComparisonBar", () => {
  it("📋 renders nothing when the comparison list is empty", () => {
    const { container } = render(<ComparisonBar />);
    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByRole("region", { name: /car comparison bar/i })
    ).not.toBeInTheDocument();
  });

  it("📋 renders the labelled bar with a count when one car is present", () => {
    comparedCars = [makeCar()];
    render(<ComparisonBar />);

    const bar = screen.getByRole("region", { name: /car comparison bar/i });
    expect(bar).toBeInTheDocument();
    expect(within(bar).getByText("1/3")).toBeInTheDocument();
    expect(within(bar).getByText("Tesla Model 3")).toBeInTheDocument();
    expect(within(bar).getByText("2022")).toBeInTheDocument();
  });

  it("📋 shows the count reflecting the number of compared cars", () => {
    comparedCars = [
      makeCar({ _id: "car-1", make: "Tesla", model: "Model 3" }),
      makeCar({ _id: "car-2", make: "BMW", model: "M3" }),
    ];
    render(<ComparisonBar />);

    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText("Tesla Model 3")).toBeInTheDocument();
    expect(screen.getByText("BMW M3")).toBeInTheDocument();
  });

  it("📋 renders one remove button per car and fires removeFromCompare(id)", () => {
    comparedCars = [
      makeCar({ _id: "car-1", make: "Tesla", model: "Model 3" }),
      makeCar({ _id: "car-2", make: "BMW", model: "M3" }),
    ];
    render(<ComparisonBar />);

    const removeButtons = screen.getAllByRole("button", {
      name: /remove .* from comparison/i,
    });
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", {
        name: /remove tesla model 3 from comparison/i,
      })
    );
    expect(removeFromCompare).toHaveBeenCalledTimes(1);
    expect(removeFromCompare).toHaveBeenCalledWith("car-1");
  });

  it("🔒 coerces a missing _id to an empty string when removing", () => {
    comparedCars = [makeCar({ _id: undefined, make: "Audi", model: "A4" })];
    render(<ComparisonBar />);

    fireEvent.click(
      screen.getByRole("button", { name: /remove audi a4 from comparison/i })
    );
    expect(removeFromCompare).toHaveBeenCalledWith("");
  });

  it("📋 Clear button fires clearComparison()", () => {
    comparedCars = [makeCar()];
    render(<ComparisonBar />);

    fireEvent.click(screen.getByRole("button", { name: /clear comparison/i }));
    expect(clearComparison).toHaveBeenCalledTimes(1);
  });

  it("🎯 renders the Compare Now CTA linking to /Compare", () => {
    comparedCars = [makeCar()];
    render(<ComparisonBar />);

    const cta = screen.getByRole("link", { name: /compare now/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/Compare");
  });

  it("🔒 falls back to /tesla.webp when a car has no image", () => {
    comparedCars = [makeCar({ image: undefined, make: "Kia", model: "EV6" })];
    render(<ComparisonBar />);

    const img = screen.getByRole("img", { name: /kia ev6/i });
    // next/image rewrites the src; the underlying optimisation URL still
    // encodes the original fallback path.
    expect(decodeURIComponent(img.getAttribute("src") || "")).toContain(
      "/tesla.webp"
    );
  });

  it("📋 uses the provided image src when present (alt = make + model)", () => {
    comparedCars = [
      makeCar({
        image: "https://cdn.example.com/m3.jpg",
        make: "BMW",
        model: "M3",
      }),
    ];
    render(<ComparisonBar />);

    const img = screen.getByRole("img", { name: /bmw m3/i });
    expect(decodeURIComponent(img.getAttribute("src") || "")).toContain(
      "https://cdn.example.com/m3.jpg"
    );
  });
});
