import React from "react";
import { render, screen } from "@testing-library/react";
import CarViewing from "@/components/CarViewing";
import type { CarInterface } from "@/lib/interfaces";

// Mock ViewingContext — CarViewing seeds it on mount from `initialCar`.
jest.mock("@/contexts/ViewingContext", () => ({
  useViewing: jest.fn(),
}));

// Mock CarViewingForm — we're testing the CarViewing shell, not the form.
jest.mock("@/components/Main/Form/CarViewingForm", () => {
  return function MockCarViewingForm() {
    return <div data-testid="car-viewing-form">Car Viewing Form</div>;
  };
});

// CarViewing wraps the form in <BookingAuthGate> (account required).
// Pass-through the gate so the form renders deterministically.
jest.mock("@/components/Account/BookingAuthGate", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock VehicleDetails.
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

import { useViewing } from "@/contexts/ViewingContext";

const mockUseViewing = useViewing as jest.MockedFunction<typeof useViewing>;

const mockCar: CarInterface = {
  _id: "car-123",
  make: "Toyota",
  model: "Camry",
  year: 2023,
  price: 25000,
  mileage: 5000,
  fuel: "Petrol",
  transmission: "Automatic",
  doors: 4,
  colour: "Red",
  image: "/car.jpg",
  status: "available",
  featured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("CarViewing", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the car details and the booking form from the server-fetched car", () => {
    mockUseViewing.mockReturnValue({
      viewingBooking: {},
      updateViewingBooking: jest.fn(),
    } as unknown as ReturnType<typeof useViewing>);

    render(<CarViewing initialCar={mockCar} />);

    expect(screen.getByText("Book Your Car Viewing")).toBeInTheDocument();
    expect(screen.getByTestId("vehicle-details")).toHaveTextContent(
      "Toyota Camry"
    );
    expect(screen.getByTestId("car-viewing-form")).toBeInTheDocument();
  });

  it("seeds the viewing context from the server-fetched car on mount", () => {
    const updateViewingBooking = jest.fn();
    mockUseViewing.mockReturnValue({
      viewingBooking: {},
      updateViewingBooking,
    } as unknown as ReturnType<typeof useViewing>);

    render(<CarViewing initialCar={mockCar} />);

    // This is the fix for the "No Car Selected" bug — the form's submit
    // payload reads carId / carDetails from the context.
    expect(updateViewingBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        carId: "car-123",
        carDetails: expect.objectContaining({
          make: "Toyota",
          model: "Camry",
          year: 2023,
        }),
      })
    );
  });
});
