import React from "react";
import { render, screen } from "@testing-library/react";
import Cars from "@/components/Car/Cars";

// Mock Button component
jest.mock("@/components/Helpful/Buttons/Button", () => {
  return function MockButton({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return <button {...props}>{children}</button>;
  };
});

const mockCar = {
  _id: "1",
  make: "Toyota",
  model: "Camry",
  year: 2023,
  price: 25000,
  mileage: 15000,
  fuel: "Petrol" as const,
  transmission: "Automatic" as const,
  doors: 4,
  colour: "White",
  status: "available" as const,
  featured: true,
  features: ["Air Conditioning", "Bluetooth", "Cruise Control"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Cars", () => {
  const defaultProps = {
    car: mockCar,
    carId: 0,
    setCarId: jest.fn(),
    length: 5,
  };

  it("renders car title", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("2023 Toyota Camry")).toBeInTheDocument();
  });

  it("renders formatted price", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("£25,000")).toBeInTheDocument();
  });

  it("renders car specifications", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Petrol")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("available")).toBeInTheDocument();
  });

  it("renders featured badge when car is featured", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("does not render featured badge when car is not featured", () => {
    render(<Cars {...defaultProps} car={{ ...mockCar, featured: false }} />);
    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  it("renders car features", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Air Conditioning")).toBeInTheDocument();
    expect(screen.getByText("Bluetooth")).toBeInTheDocument();
    expect(screen.getByText("Cruise Control")).toBeInTheDocument();
  });

  it("renders car count indicator", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
  });

  it("renders inventory heading", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Car Inventory")).toBeInTheDocument();
    expect(screen.getByText("(5)")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it("renders formatted mileage", () => {
    render(<Cars {...defaultProps} />);
    expect(screen.getByText("15,000")).toBeInTheDocument();
  });

  it("renders status with correct color for sold", () => {
    render(
      <Cars {...defaultProps} car={{ ...mockCar, status: "sold" as const }} />
    );
    expect(screen.getByText("sold")).toBeInTheDocument();
  });
});
