import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BookingsTable from "@/components/Helpful/BookingsTable";
import { Booking } from "@/lib/types";

// Mock Button
jest.mock("@/components/Helpful/Buttons/Button", () => {
  return function MockButton({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) {
    return <button onClick={onClick}>{children}</button>;
  };
});

const mockViewingBooking: Booking = {
  _id: "1",
  bookingReference: "VW-001",
  type: "viewing",
  status: "pending",
  customerInfo: {
    name: "John Doe",
    email: "john@test.com",
    phone: "07123456789",
  },
  appointmentDate: new Date("2025-01-15"),
  appointmentTime: "10:00 AM",
  carId: "car1",
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
  createdAt: new Date(),
};

const mockServiceBooking: Booking = {
  _id: "2",
  bookingReference: "SB-002",
  type: "service",
  status: "confirmed",
  customerInfo: {
    name: "Jane Smith",
    email: "jane@test.com",
    phone: "07111222333",
  },
  appointmentDate: new Date("2025-02-01"),
  appointmentTime: "2:00 PM",
  serviceType: "Full Service",
  createdAt: new Date(),
};

const getStatusBadge = (status: string) => (
  <span data-testid="status-badge">{status}</span>
);

describe("BookingsTable", () => {
  it("renders search input", () => {
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    expect(
      screen.getByPlaceholderText("Search bookings...")
    ).toBeInTheDocument();
  });

  it("renders viewing booking details", () => {
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    expect(screen.getByText("VW-001")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("2023 Toyota Camry")).toBeInTheDocument();
  });

  it("renders Vehicle header for viewing type", () => {
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    expect(screen.getByText("Vehicle")).toBeInTheDocument();
  });

  it("renders Service header for service type", () => {
    render(
      <BookingsTable
        type="service"
        bookings={[mockServiceBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Full Service")).toBeInTheDocument();
  });

  it("filters bookings by search term", () => {
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm="NONEXISTENT"
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    expect(screen.queryByText("VW-001")).not.toBeInTheDocument();
  });

  it("calls onSearchChange when typing", () => {
    const onSearchChange = jest.fn();
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={onSearchChange}
        onCancelBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Search bookings..."), {
      target: { value: "test" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("test");
  });

  it("calls onViewDetails when Details button is clicked", () => {
    const onViewDetails = jest.fn();
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onViewDetails={onViewDetails}
        getStatusBadge={getStatusBadge}
      />
    );
    fireEvent.click(screen.getByText("Details"));
    expect(onViewDetails).toHaveBeenCalledWith(mockViewingBooking);
  });

  it("shows Cancel button for pending bookings", () => {
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("shows Confirm button for pending bookings when handler provided", () => {
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onConfirmBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("calls onCancelBooking when Cancel is clicked", () => {
    const onCancelBooking = jest.fn();
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={onCancelBooking}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancelBooking).toHaveBeenCalledWith({
      booking: mockViewingBooking,
      type: "viewing",
    });
  });

  it("renders status badge", () => {
    render(
      <BookingsTable
        type="viewing"
        bookings={[mockViewingBooking]}
        searchTerm=""
        onSearchChange={jest.fn()}
        onCancelBooking={jest.fn()}
        onViewDetails={jest.fn()}
        getStatusBadge={getStatusBadge}
      />
    );
    expect(screen.getByTestId("status-badge")).toHaveTextContent("pending");
  });
});
