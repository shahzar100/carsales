import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CarShareCard, { CarShareModal } from "@/components/SEO/CarShareCard";

// Mock next/image
jest.mock("next/image", () => {
  return function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  };
});

// Mock ShareButton
jest.mock("@/components/SEO/ShareButton", () => {
  return function MockShareButton() {
    return <button data-testid="share-button">Share</button>;
  };
});

const mockCar = {
  _id: "car1",
  make: "Toyota",
  model: "Camry",
  year: 2023,
  price: 25000,
  mileage: 15000,
  fuel: "Petrol",
  transmission: "Automatic",
  doors: 4,
  colour: "Red",
  status: "available" as const,
  featured: false,
  image: "/car.jpg",
  features: [],
  description: "",
  createdAt: new Date(),
  images: [],
};

describe("CarShareCard", () => {
  it("renders car title", () => {
    render(<CarShareCard car={mockCar} />);
    expect(screen.getByText("2023 Toyota Camry")).toBeInTheDocument();
  });

  it("renders formatted price", () => {
    render(<CarShareCard car={mockCar} />);
    expect(screen.getByText("£25,000")).toBeInTheDocument();
  });

  it("renders car specs", () => {
    render(<CarShareCard car={mockCar} />);
    expect(screen.getByText("Petrol")).toBeInTheDocument();
    expect(screen.getByText("Automatic")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<CarShareCard car={mockCar} />);
    expect(screen.getByText("available")).toBeInTheDocument();
  });

  it("renders View Details link", () => {
    render(<CarShareCard car={mockCar} baseUrl="https://test.com" />);
    const link = screen.getByText("View Details");
    expect(link).toHaveAttribute("href", "https://test.com/BrowseFleet/car1");
  });

  it("renders share button", () => {
    render(<CarShareCard car={mockCar} />);
    expect(screen.getByTestId("share-button")).toBeInTheDocument();
  });

  it("renders in modal mode with close button", () => {
    const onClose = jest.fn();
    render(<CarShareCard car={mockCar} mode="modal" onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close");
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows colour and doors in body", () => {
    render(<CarShareCard car={mockCar} />);
    expect(screen.getByText("Red • 4 doors")).toBeInTheDocument();
  });
});

describe("CarShareModal", () => {
  it("renders trigger and opens modal on click", () => {
    render(<CarShareModal car={mockCar} trigger={<span>Open share</span>} />);
    expect(screen.getByText("Open share")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Open share"));
    expect(screen.getByText("2023 Toyota Camry")).toBeInTheDocument();
  });

  it("renders default button when no trigger", () => {
    render(<CarShareModal car={mockCar} />);
    expect(screen.getByLabelText("Share Toyota Camry")).toBeInTheDocument();
  });
});
