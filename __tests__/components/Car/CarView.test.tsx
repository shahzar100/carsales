/**
 * Tests for src/components/Car/CarView.tsx
 *
 * Standards coverage:
 * - 📋 Functional: wraps content in FilterProvider; renders Filters and
 *   the chosen view (card/table/list) for the filtered set; view-type
 *   buttons disable the active option; empty filter result shows the
 *   EmptyState
 */
import React from "react";
import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import CarView from "@/components/Car/CarView";
import type { CarInterface, CarViewingBooking } from "@/lib/interfaces";

const render = (ui: React.ReactElement) =>
  rtlRender(
    <NavigationProvider>
      <ToastProvider>{ui}</ToastProvider>
    </NavigationProvider>
  );

function makeCar(overrides: Partial<CarInterface> = {}): CarInterface {
  return {
    _id: Math.random().toString(36).slice(2),
    year: 2023,
    make: "Tesla",
    model: "Model 3",
    price: 30000,
    mileage: 12000,
    fuel: "Electric",
    transmission: "Automatic",
    doors: 4,
    colour: "White",
    status: "available",
    features: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as CarInterface;
}

const sampleCars: CarInterface[] = [
  makeCar({ make: "Tesla", model: "Model 3" }),
  makeCar({ make: "BMW", model: "320d" }),
];

const sampleBookings: CarViewingBooking[] = [];

describe("CarView", () => {
  it("📋 renders the Filters bar with the total count", () => {
    render(<CarView cars={sampleCars} bookings={sampleBookings} />);
    expect(screen.getByText(/2 of 2 vehicles/i)).toBeInTheDocument();
  });

  it("📋 defaults to the Card view (Card button disabled)", () => {
    render(<CarView cars={sampleCars} bookings={sampleBookings} />);
    const cardBtn = screen.getByRole("button", { name: /^card$/i });
    const tableBtn = screen.getByRole("button", { name: /^table$/i });
    const listBtn = screen.getByRole("button", { name: /^list$/i });
    expect(cardBtn).toBeDisabled();
    expect(tableBtn).not.toBeDisabled();
    expect(listBtn).not.toBeDisabled();
  });

  it("📋 switching to Table renders the table headers", () => {
    render(<CarView cars={sampleCars} bookings={sampleBookings} />);
    fireEvent.click(screen.getByRole("button", { name: /^table$/i }));
    expect(screen.getByText("Vehicle")).toBeInTheDocument();
    expect(screen.getByText("Year")).toBeInTheDocument();
  });

  it("📋 switching to List renders one card per car", () => {
    render(<CarView cars={sampleCars} bookings={sampleBookings} />);
    fireEvent.click(screen.getByRole("button", { name: /^list$/i }));
    expect(screen.getByText("Tesla Model 3")).toBeInTheDocument();
    expect(screen.getByText("BMW 320d")).toBeInTheDocument();
  });

  it("🎯 shows the empty state when there are no cars at all", () => {
    render(<CarView cars={[]} bookings={[]} />);
    expect(screen.getByText("No cars found")).toBeInTheDocument();
    expect(
      screen.getByText(/try adjusting your filters/i)
    ).toBeInTheDocument();
  });

  it("📋 card view shows the 'Bookings' heading below the card", () => {
    render(<CarView cars={sampleCars} bookings={sampleBookings} />);
    // "Bookings" appears in the heading + nearby copy.
    expect(screen.getAllByText(/Bookings/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/No bookings available/i)).toBeInTheDocument();
  });
});
