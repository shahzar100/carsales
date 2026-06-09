/**
 * Tests for src/components/Car/CompareContent.tsx
 *
 * The side-by-side car comparison view. It reads everything from
 * useComparison() (ComparisonContext), so that hook is mocked with a
 * controllable comparedCars array and spy callbacks. The component renders
 * BOTH a mobile stacked view (lg:hidden) and a desktop table (hidden
 * lg:block); jsdom ignores the responsive utility classes, so both are in
 * the DOM at once — assertions use getAllBy* and scope to the <table> when a
 * desktop-only element is needed.
 *
 * Standards coverage:
 * - 📋 Functional: empty state renders the "No cars to compare" CTA pointing
 *   at /BrowseFleet; populated state renders spec rows (price GBP-formatted,
 *   year, mileage "N miles", fuel, transmission, "N doors", colour) plus a
 *   features union row; per-car remove buttons call removeFromCompare(id);
 *   "Clear All" calls clearComparison; vehicle count + pluralisation header.
 * - 🔒 Security / robustness: a car with a missing _id still produces a
 *   remove button that calls removeFromCompare("") (no crash on undefined id).
 * - 🎯 Usability: valuesAreDifferent → highlightClass adds the amber ring on
 *   spec cells that differ across cars, and omits it when all cars share the
 *   same value; features the car lacks render struck-through in its column;
 *   "Add More" link points at /BrowseFleet.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { CarInterface } from "@/lib/interfaces";

// Controllable mock of the comparison context. Tests mutate `state` before
// rendering; the component reads it through the mocked hook.
const mockRemoveFromCompare = jest.fn();
const mockClearComparison = jest.fn();

const state: { comparedCars: CarInterface[] } = { comparedCars: [] };

jest.mock("@/contexts/ComparisonContext", () => ({
  useComparison: () => ({
    comparedCars: state.comparedCars,
    removeFromCompare: (id: string) => mockRemoveFromCompare(id),
    clearComparison: () => mockClearComparison(),
    addToCompare: jest.fn(),
    isInComparison: jest.fn(() => false),
  }),
}));

import CompareContent from "@/components/Car/CompareContent";

const makeCar = (overrides: Partial<CarInterface>): CarInterface =>
  ({
    _id: "car-1",
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    price: 35000,
    mileage: 12345,
    fuel: "Electric",
    transmission: "Automatic",
    doors: 4,
    colour: "White",
    image: "/main.webp",
    features: ["Bluetooth", "Heated seats"],
    status: "available",
    featured: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  }) as unknown as CarInterface;

// Mirror the component's GBP formatter so assertions are not hard-coded to a
// particular Node ICU spacing/symbol.
const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const grid = (n: number) => new Intl.NumberFormat("en-GB").format(n);

const desktopTable = () => screen.getByRole("table");

beforeEach(() => {
  jest.clearAllMocks();
  state.comparedCars = [];
});

describe("CompareContent — empty state", () => {
  it("📋 renders the empty state with a Browse Fleet CTA when no cars", () => {
    state.comparedCars = [];
    render(<CompareContent />);

    expect(screen.getByText(/no cars to compare/i)).toBeInTheDocument();
    expect(
      screen.getByText(/add up to 3 cars to compare them side by side/i)
    ).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /browse fleet/i });
    expect(cta).toHaveAttribute("href", "/BrowseFleet");

    // No comparison table is rendered in the empty branch.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/comparing/i)).not.toBeInTheDocument();
  });
});

describe("CompareContent — populated state", () => {
  // Two cars that differ in every value-bearing field so the highlight branch
  // is exercised broadly, with distinct feature sets for the union row.
  const carA = makeCar({
    _id: "car-a",
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    price: 35000,
    mileage: 12345,
    fuel: "Electric",
    transmission: "Automatic",
    doors: 4,
    colour: "White",
    features: ["Bluetooth", "Heated seats"],
  });
  const carB = makeCar({
    _id: "car-b",
    make: "BMW",
    model: "320d",
    year: 2020,
    price: 22000,
    mileage: 48000,
    fuel: "Diesel",
    transmission: "Manual",
    doors: 5,
    colour: "Black",
    features: ["Bluetooth", "Sunroof"],
  });

  it("📋 header shows the vehicle count, pluralised", () => {
    state.comparedCars = [carA, carB];
    render(<CompareContent />);
    expect(screen.getByText(/comparing 2 vehicles/i)).toBeInTheDocument();
  });

  it("📋 header is singular for exactly one car", () => {
    state.comparedCars = [carA];
    render(<CompareContent />);
    // "vehicle" with no trailing "s".
    expect(screen.getByText(/comparing 1 vehicle$/i)).toBeInTheDocument();
  });

  it("📋 renders spec labels and the features union row in the desktop table", () => {
    state.comparedCars = [carA, carB];
    render(<CompareContent />);
    const table = within(desktopTable());

    for (const label of [
      "Price",
      "Year",
      "Mileage",
      "Fuel",
      "Transmission",
      "Doors",
      "Colour",
      "Features",
    ]) {
      expect(table.getByText(label)).toBeInTheDocument();
    }
  });

  it("📋 formats price as GBP and mileage with 'miles' / 'doors' suffixes", () => {
    state.comparedCars = [carA, carB];
    render(<CompareContent />);

    // Price appears in both mobile card and desktop cell → at least one each.
    expect(screen.getAllByText(gbp(35000)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(gbp(22000)).length).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText(`${grid(12345)} miles`).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(`${grid(48000)} miles`).length
    ).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText("4 doors").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("5 doors").length).toBeGreaterThanOrEqual(1);
  });

  it("🎯 differing spec cells get the amber highlight; identical cells do not", () => {
    // Same year, same fuel; everything else differs.
    const same = makeCar({
      _id: "car-c",
      year: 2023,
      fuel: "Electric",
      price: 40000,
      mileage: 9000,
      transmission: "Automatic",
      doors: 4,
      colour: "Blue",
      features: ["Bluetooth"],
    });
    const sameToo = makeCar({
      _id: "car-d",
      year: 2023,
      fuel: "Electric",
      price: 41000,
      mileage: 11000,
      transmission: "Automatic",
      doors: 5,
      colour: "Grey",
      features: ["Sunroof"],
    });
    state.comparedCars = [same, sameToo];
    render(<CompareContent />);

    const table = desktopTable();

    // Price differs → highlighted cell present.
    const priceCell = within(table).getAllByText(gbp(40000))[0];
    expect(priceCell.className).toMatch(/bg-amber-50/);

    // Year is identical across both cars → no highlight on year cells.
    const yearCells = within(table).getAllByText("2023");
    for (const cell of yearCells) {
      expect(cell.className).not.toMatch(/bg-amber-50/);
    }
  });

  it("🎯 no spec cells are highlighted when every value matches", () => {
    const twin1 = makeCar({ _id: "t1" });
    const twin2 = makeCar({ _id: "t2", make: "Tesla", model: "Model 3" });
    state.comparedCars = [twin1, twin2];
    render(<CompareContent />);

    const table = desktopTable();
    // valuesAreDifferent is false for all getters → no amber anywhere.
    expect(table.innerHTML).not.toMatch(/bg-amber-50/);
  });

  it("📋 features union row marks owned features and strikes through missing ones", () => {
    state.comparedCars = [carA, carB];
    render(<CompareContent />);
    const table = desktopTable();

    // Union = Bluetooth, Heated seats, Sunroof. Each appears for every car
    // column in the features row; carA lacks Sunroof → struck through.
    const struck = within(table)
      .getAllByText("Sunroof")
      .filter((el) => el.className.includes("line-through"));
    expect(struck.length).toBeGreaterThanOrEqual(1);

    const owned = within(table)
      .getAllByText("Sunroof")
      .filter((el) => el.className.includes("text-red-700"));
    expect(owned.length).toBeGreaterThanOrEqual(1);
  });

  it("📋 per-car remove buttons call removeFromCompare with the car id", () => {
    state.comparedCars = [carA, carB];
    render(<CompareContent />);

    // Each car has a remove button in both mobile and desktop views.
    const removeA = screen.getAllByRole("button", {
      name: /remove tesla model 3 from comparison/i,
    });
    expect(removeA.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(removeA[0]);
    expect(mockRemoveFromCompare).toHaveBeenCalledWith("car-a");

    const removeB = screen.getAllByRole("button", {
      name: /remove bmw 320d from comparison/i,
    });
    fireEvent.click(removeB[0]);
    expect(mockRemoveFromCompare).toHaveBeenCalledWith("car-b");
  });

  it("📋 Clear All triggers clearComparison; Add More links to /BrowseFleet", () => {
    state.comparedCars = [carA, carB];
    render(<CompareContent />);

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(mockClearComparison).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("link", { name: /add more/i })).toHaveAttribute(
      "href",
      "/BrowseFleet"
    );
  });

  it("🔒 a car with no _id still yields a remove button calling removeFromCompare('')", () => {
    const noId = makeCar({ _id: undefined, make: "Audi", model: "A4" });
    state.comparedCars = [noId];
    render(<CompareContent />);

    const remove = screen.getAllByRole("button", {
      name: /remove audi a4 from comparison/i,
    });
    expect(remove.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(remove[0]);
    expect(mockRemoveFromCompare).toHaveBeenCalledWith("");
  });

  it("🎯 the features row is omitted when no car has any features", () => {
    const bare1 = makeCar({ _id: "b1", features: [] });
    const bare2 = makeCar({ _id: "b2", features: undefined });
    state.comparedCars = [bare1, bare2];
    render(<CompareContent />);

    // Spec labels still render, but the union "Features" row should not.
    const table = within(desktopTable());
    expect(table.getByText("Price")).toBeInTheDocument();
    expect(table.queryByText("Features")).not.toBeInTheDocument();
  });

  it("🎯 falls back to /tesla.webp for a car missing an image", () => {
    const noImg = makeCar({ _id: "ni", image: undefined });
    state.comparedCars = [noImg];
    render(<CompareContent />);
    // next/image renders an <img>; at least one should resolve to the
    // fallback asset path.
    const imgs = screen.getAllByRole("img") as HTMLImageElement[];
    expect(
      imgs.some((img) => decodeURIComponent(img.src).includes("/tesla.webp"))
    ).toBe(true);
  });
});
