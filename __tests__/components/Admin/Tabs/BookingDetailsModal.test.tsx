/**
 * Tests for src/components/Admin/Tabs/BookingDetailsModal.tsx
 *
 * Standards coverage:
 * - 📋 Functional: renders booking reference, customer block, appointment
 *   block; service row only for service bookings; car-details block only
 *   for viewing bookings; status badge present; Close button calls onClose
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BookingDetailsModal from "@/components/Admin/Tabs/BookingDetailsModal";
import type { Booking } from "@/lib/types";

const serviceBooking: Booking = {
  _id: "b-1",
  bookingReference: "BK-SVC123",
  customerInfo: {
    name: "Alice",
    email: "a@example.com",
    phone: "07700 900000",
  },
  status: "confirmed",
  appointmentDate: "2030-01-15",
  appointmentTime: "10:00",
  serviceType: "Detailing — Full",
  createdAt: new Date(),
} as unknown as Booking;

const viewingBooking: Booking = {
  _id: "b-2",
  bookingReference: "VW-VIEW1",
  customerInfo: {
    name: "Bob",
    email: "b@example.com",
    phone: "07700 900001",
  },
  status: "pending",
  appointmentDate: "2030-02-01",
  appointmentTime: "11:00",
  carDetails: {
    year: 2023,
    make: "Tesla",
    model: "Model 3",
    price: 35000,
  },
  createdAt: new Date(),
} as unknown as Booking;

describe("BookingDetailsModal", () => {
  it("renders booking reference, customer fields, and the status badge", () => {
    render(
      <BookingDetailsModal booking={serviceBooking} onClose={jest.fn()} />
    );
    expect(screen.getByText("BK-SVC123")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(screen.getByText("07700 900000")).toBeInTheDocument();
    expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
  });

  it("📋 shows the service-type block for service bookings", () => {
    render(
      <BookingDetailsModal booking={serviceBooking} onClose={jest.fn()} />
    );
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Detailing — Full")).toBeInTheDocument();
    // No vehicle block on service bookings.
    expect(screen.queryByText("Vehicle")).not.toBeInTheDocument();
  });

  it("📋 shows the vehicle block (with price) for viewing bookings", () => {
    render(
      <BookingDetailsModal booking={viewingBooking} onClose={jest.fn()} />
    );
    expect(screen.getByText("Vehicle")).toBeInTheDocument();
    expect(screen.getByText("2023 Tesla Model 3")).toBeInTheDocument();
    expect(screen.getByText(/£35,000/)).toBeInTheDocument();
    // No service-type block on viewing bookings.
    expect(screen.queryByText("Service")).not.toBeInTheDocument();
  });

  it("📋 footer Close button calls onClose", () => {
    const onClose = jest.fn();
    render(
      <BookingDetailsModal booking={serviceBooking} onClose={onClose} />
    );
    // Two "Close" buttons exist — the Modal's X icon (aria-label) and the
    // footer's text-label button. Pick the footer one by visible text.
    const buttons = screen.getAllByRole("button", { name: /^close$/i });
    // The footer Button renders the "Close" *text* node; the X icon has
    // its aria-label but no visible text. Find the one with text content.
    const footerClose = buttons.find(
      (b) => b.textContent?.trim() === "Close"
    );
    expect(footerClose).toBeTruthy();
    fireEvent.click(footerClose!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
