/**
 * Tests for src/components/Home/LatestArrivals.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders one card per car; each card links to
 *   /BrowseFleet/<id>; "View all" link at the top; renders nothing when
 *   the cars array is empty (so the homepage doesn't show an empty
 *   section on a fresh DB)
 * - 🎯 Usability: falls back to placeholder image when `image` is missing
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import LatestArrivals from "@/components/Home/LatestArrivals";
import type { CarInterface } from "@/lib/interfaces";

const sampleCars: CarInterface[] = [
  {
    _id: "car-1",
    year: 2023,
    make: "Tesla",
    model: "Model 3",
    price: 35000,
    mileage: 12345,
    fuel: "Electric",
    doors: 4,
    colour: "White",
    status: "available",
    features: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as CarInterface,
  {
    _id: "car-2",
    year: 2022,
    make: "BMW",
    model: "320d",
    price: 24000,
    mileage: 30000,
    fuel: "Diesel",
    doors: 4,
    colour: "Black",
    status: "available",
    features: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as CarInterface,
];

describe("LatestArrivals", () => {
  it("📋 renders nothing when the cars list is empty", () => {
    const { container } = render(<LatestArrivals cars={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the section heading and a 'View all' link", () => {
    render(<LatestArrivals cars={sampleCars} />);
    expect(screen.getByText("Latest Arrivals")).toBeInTheDocument();
    const viewAll = screen.getByText(/view all/i).closest("a");
    expect(viewAll).toHaveAttribute("href", "/BrowseFleet");
  });

  it("renders one card per car with the right href, year, make, model, price", () => {
    render(<LatestArrivals cars={sampleCars} />);
    const tesla = screen.getByText("Tesla Model 3").closest("a");
    const bmw = screen.getByText("BMW 320d").closest("a");
    expect(tesla).toHaveAttribute("href", "/BrowseFleet/car-1");
    expect(bmw).toHaveAttribute("href", "/BrowseFleet/car-2");
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("2022")).toBeInTheDocument();
    expect(screen.getByText(/£35,000/)).toBeInTheDocument();
    expect(screen.getByText(/£24,000/)).toBeInTheDocument();
  });

  it("🎯 falls back to the placeholder image when a car has no `image`", () => {
    render(<LatestArrivals cars={[sampleCars[0]]} />);
    const img = screen.getByAltText("Tesla Model 3");
    expect(img.getAttribute("src")).toContain("tesla.webp");
  });

  it("shows mileage and colour in the metadata line", () => {
    render(<LatestArrivals cars={[sampleCars[0]]} />);
    expect(
      screen.getByText(/12,345 miles/)
    ).toBeInTheDocument();
    expect(screen.getByText(/12,345 miles/).textContent).toContain("White");
  });
});
