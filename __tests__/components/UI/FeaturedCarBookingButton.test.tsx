/**
 * Tests for src/components/UI/FeaturedCarBookingButton.tsx
 *
 * Standards coverage:
 * - 📋 Functional: link points at `/Booking/<carId>`; click prefills the
 *   ViewingContext booking with the car details before navigation; image
 *   falls back to /tesla.webp when the car has no image
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewingProvider } from "@/contexts/ViewingContext";
import FeaturedCarBookingButton from "@/components/UI/FeaturedCarBookingButton";
import type { CarInterface } from "@/lib/interfaces";

function renderWithViewing(ui: React.ReactElement) {
  return render(<ViewingProvider>{ui}</ViewingProvider>);
}

const car: CarInterface = {
  _id: "car-1",
  year: 2023,
  make: "Tesla",
  model: "Model 3",
  price: 35000,
  mileage: 10000,
  fuel: "Electric",
  doors: 4,
  colour: "White",
  status: "available",
  image: "https://cdn/x.jpg",
  features: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as CarInterface;

describe("FeaturedCarBookingButton", () => {
  it("📋 link points at /Booking/<carId>", () => {
    renderWithViewing(<FeaturedCarBookingButton car={car} />);
    const link = screen.getByText(/book viewing/i).closest("a");
    expect(link).toHaveAttribute("href", "/Booking/car-1");
  });

  it("📋 click stores the car details into ViewingContext (verified via a sibling Probe)", () => {
    const Probe = () => {
      const ctx = require("@/contexts/ViewingContext").useViewing();
      return (
        <span data-testid="probe">
          {ctx.viewingBooking.carDetails?.make ?? ""}
        </span>
      );
    };
    renderWithViewing(
      <>
        <FeaturedCarBookingButton car={car} />
        <Probe />
      </>
    );
    // No selection yet.
    expect(screen.getByTestId("probe").textContent).toBe("");
    fireEvent.click(screen.getByText(/book viewing/i));
    expect(screen.getByTestId("probe").textContent).toBe("Tesla");
  });

  it("📋 image fallback to /tesla.webp when car.image is empty", () => {
    const carNoImage = { ...car, image: undefined } as unknown as CarInterface;
    const Probe = () => {
      const ctx = require("@/contexts/ViewingContext").useViewing();
      return (
        <span data-testid="probe-image">
          {ctx.viewingBooking.carDetails?.image ?? ""}
        </span>
      );
    };
    renderWithViewing(
      <>
        <FeaturedCarBookingButton car={carNoImage} />
        <Probe />
      </>
    );
    fireEvent.click(screen.getByText(/book viewing/i));
    expect(screen.getByTestId("probe-image").textContent).toBe(
      "/tesla.webp"
    );
  });
});
