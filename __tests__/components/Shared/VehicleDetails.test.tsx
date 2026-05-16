/**
 * Tests for src/components/Shared/VehicleDetails.tsx
 *
 * Standards coverage:
 * - 📋 Functional: title shown by default, optional via showTitle prop;
 *   year/make/model concatenated; price/mileage/fuel/doors/colour cells
 *   only render when the underlying field is set; image fallback to
 *   /tesla.webp when no `image` is supplied
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import VehicleDetails from "@/components/Shared/VehicleDetails";

describe("VehicleDetails", () => {
  it("renders the 'Vehicle Details' title by default", () => {
    render(<VehicleDetails vehicle={{ make: "Tesla", model: "Model 3" }} />);
    expect(screen.getByText("Vehicle Details")).toBeInTheDocument();
  });

  it("hides the title when showTitle=false", () => {
    render(
      <VehicleDetails
        vehicle={{ make: "Tesla", model: "Model 3" }}
        showTitle={false}
      />
    );
    expect(screen.queryByText("Vehicle Details")).not.toBeInTheDocument();
  });

  it("concatenates year, make, model in the heading", () => {
    render(
      <VehicleDetails
        vehicle={{ year: 2023, make: "Tesla", model: "Model 3" }}
      />
    );
    expect(screen.getByText(/2023 Tesla Model 3/)).toBeInTheDocument();
  });

  it("omits the year prefix when no year is supplied", () => {
    render(
      <VehicleDetails vehicle={{ make: "Tesla", model: "Model 3" }} />
    );
    const heading = screen.getByText(/Tesla Model 3/);
    expect(heading.textContent?.trim()).toBe("Tesla Model 3");
  });

  it("renders price/mileage/fuel/doors/colour cells when the fields are present", () => {
    render(
      <VehicleDetails
        vehicle={{
          make: "Tesla",
          model: "Model 3",
          price: 35000,
          mileage: 12345,
          fuel: "Electric",
          doors: 4,
          colour: "White",
        }}
      />
    );
    expect(screen.getByText(/£35,000/)).toBeInTheDocument();
    expect(screen.getByText(/12,345 miles/)).toBeInTheDocument();
    expect(screen.getByText("Electric")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();
  });

  it("hides each spec cell when its field is missing", () => {
    render(
      <VehicleDetails vehicle={{ make: "X", model: "Y" }} />
    );
    expect(screen.queryByText(/£/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mileage/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fuel Type/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Doors/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Colour/)).not.toBeInTheDocument();
  });

  it("falls back to the placeholder image when no `image` is supplied", () => {
    render(
      <VehicleDetails vehicle={{ make: "Tesla", model: "Model 3" }} />
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", expect.stringContaining("tesla.webp"));
    expect(img).toHaveAttribute("alt", "Tesla Model 3");
  });
});
