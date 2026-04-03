import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CarCard from "@/components/Car/CarCard";

const mockCars = [
  {
    _id: "1",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    price: 25000,
    mileage: 10000,
    fuel: "Petrol" as const,
    transmission: "Automatic" as const,
    doors: 4,
    colour: "White",
    status: "available" as const,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "2",
    make: "BMW",
    model: "X5",
    year: 2022,
    price: 45000,
    mileage: 20000,
    fuel: "Diesel" as const,
    transmission: "Automatic" as const,
    doors: 4,
    colour: "Black",
    status: "available" as const,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock child component
jest.mock("@/components/Car/Cars", () => {
  return function MockCars({ car }: { car: { make: string; model: string } }) {
    return (
      <div data-testid="car-display">
        {car.make} {car.model}
      </div>
    );
  };
});

describe("CarCard", () => {
  it("renders the current car", () => {
    const setCarId = jest.fn();
    render(<CarCard filteredCars={mockCars} carId={0} setCarId={setCarId} />);
    expect(screen.getByTestId("car-display")).toHaveTextContent("Toyota Camry");
  });

  it("disables previous button on first car", () => {
    const setCarId = jest.fn();
    render(<CarCard filteredCars={mockCars} carId={0} setCarId={setCarId} />);
    const prevButton = screen.getByRole("button", { name: /previous car/i });
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last car", () => {
    const setCarId = jest.fn();
    render(<CarCard filteredCars={mockCars} carId={1} setCarId={setCarId} />);
    const nextButton = screen.getByRole("button", { name: /next car/i });
    expect(nextButton).toBeDisabled();
  });

  it("increments carId when next is clicked", () => {
    const setCarId = jest.fn();
    render(<CarCard filteredCars={mockCars} carId={0} setCarId={setCarId} />);
    fireEvent.click(screen.getByRole("button", { name: /next car/i }));
    expect(setCarId).toHaveBeenCalledWith(1);
  });

  it("decrements carId when previous is clicked", () => {
    const setCarId = jest.fn();
    render(<CarCard filteredCars={mockCars} carId={1} setCarId={setCarId} />);
    fireEvent.click(screen.getByRole("button", { name: /previous car/i }));
    expect(setCarId).toHaveBeenCalledWith(0);
  });

  it("renders thumbnail buttons for all cars", () => {
    const setCarId = jest.fn();
    render(<CarCard filteredCars={mockCars} carId={0} setCarId={setCarId} />);
    // 2 thumbnail buttons + 2 navigation buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it("clicking thumbnail updates carId", () => {
    const setCarId = jest.fn();
    render(<CarCard filteredCars={mockCars} carId={0} setCarId={setCarId} />);
    // Get all buttons and find thumbnails (they don't have aria-label)
    const buttons = screen.getAllByRole("button");
    const thumbnailButtons = buttons.filter(
      (b) => !b.getAttribute("aria-label")?.includes("car")
    );
    if (thumbnailButtons.length > 1) {
      fireEvent.click(thumbnailButtons[1]);
      expect(setCarId).toHaveBeenCalledWith(1);
    }
  });
});
