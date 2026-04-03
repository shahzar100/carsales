import React from "react";
import { render, screen } from "@testing-library/react";
import CarViewing from "@/components/CarViewing";

// Mock ViewingContext
jest.mock("@/backend/ViewingContext", () => ({
  useViewing: jest.fn(),
}));

// Mock CarViewingForm
jest.mock("@/components/Main/Form/CarViewingForm", () => {
  return function MockCarViewingForm() {
    return <div data-testid="car-viewing-form">Car Viewing Form</div>;
  };
});

// Mock VehicleDetails
jest.mock("@/components/Shared/VehicleDetails", () => {
  return function MockVehicleDetails({
    vehicle,
  }: {
    vehicle: Record<string, unknown>;
  }) {
    return (
      <div data-testid="vehicle-details">
        {vehicle.make as string} {vehicle.model as string}
      </div>
    );
  };
});

import { useViewing } from "@/backend/ViewingContext";

const mockUseViewing = useViewing as jest.MockedFunction<typeof useViewing>;

describe("CarViewing", () => {
  it("renders no car selected when no viewing booking", () => {
    mockUseViewing.mockReturnValue({
      viewingBooking: { carDetails: null },
      updateViewingBooking: jest.fn(),
    } as unknown as ReturnType<typeof useViewing>);

    render(<CarViewing />);
    expect(screen.getByText("No Car Selected")).toBeInTheDocument();
  });

  it("renders Browse Our Fleet link when no car selected", () => {
    mockUseViewing.mockReturnValue({
      viewingBooking: { carDetails: null },
      updateViewingBooking: jest.fn(),
    } as unknown as ReturnType<typeof useViewing>);

    render(<CarViewing />);
    expect(screen.getByText("Browse Our Fleet")).toHaveAttribute(
      "href",
      "/BrowseFleet"
    );
  });

  it("renders car details and form when car is selected", () => {
    mockUseViewing.mockReturnValue({
      viewingBooking: {
        carDetails: {
          make: "Toyota",
          model: "Camry",
          year: 2023,
          price: 25000,
          image: "/car.jpg",
          fuel: "Petrol",
          doors: 4,
          colour: "Red",
          mileage: 5000,
        },
      },
      updateViewingBooking: jest.fn(),
    } as unknown as ReturnType<typeof useViewing>);

    render(<CarViewing />);
    expect(screen.getByText("Book Your Car Viewing")).toBeInTheDocument();
    expect(screen.getByTestId("vehicle-details")).toBeInTheDocument();
    expect(screen.getByTestId("car-viewing-form")).toBeInTheDocument();
  });
});
