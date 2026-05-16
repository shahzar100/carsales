/**
 * Tests for src/components/Admin/Tabs/CancelBookingModal.tsx
 *
 * Standards coverage:
 * - 📋 Functional: booking reference + customer name appear in body;
 *   onClose / onCancel callbacks wired to the right buttons
 * - 🎯 Usability: "Cancel Booking" is disabled until the reason is at
 *   least 10 chars; inline counter while below threshold; warning copy
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CancelBookingModal from "@/components/Admin/Tabs/CancelBookingModal";
import type { SelectedBooking } from "@/lib/types";

const selected: SelectedBooking = {
  booking: {
    _id: "b-1",
    bookingReference: "BK-123ABC",
    customerInfo: {
      name: "Alice Andrews",
      email: "a@example.com",
      phone: "07700",
    },
    status: "confirmed",
    appointmentDate: "2030-01-15",
    appointmentTime: "10:00",
    serviceType: "Detailing",
    createdAt: new Date(),
  },
  type: "service",
} as unknown as SelectedBooking;

describe("CancelBookingModal", () => {
  it("renders booking reference + customer name in the body", () => {
    render(
      <CancelBookingModal
        selectedBooking={selected}
        onClose={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText("BK-123ABC")).toBeInTheDocument();
    expect(screen.getByText("Alice Andrews")).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone/i)
    ).toBeInTheDocument();
  });

  it("🎯 'Cancel Booking' button is disabled until reason ≥ 10 chars", () => {
    render(
      <CancelBookingModal
        selectedBooking={selected}
        onClose={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    const submit = screen.getByRole("button", { name: /^cancel booking$/i });
    expect(submit).toBeDisabled();

    fireEvent.change(
      screen.getByPlaceholderText(/please provide a reason/i),
      { target: { value: "short" } }
    );
    expect(submit).toBeDisabled();

    fireEvent.change(
      screen.getByPlaceholderText(/please provide a reason/i),
      { target: { value: "long enough reason" } }
    );
    expect(submit).not.toBeDisabled();
  });

  it("🎯 shows the inline counter while reason is 1–9 chars", () => {
    render(
      <CancelBookingModal
        selectedBooking={selected}
        onClose={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    fireEvent.change(
      screen.getByPlaceholderText(/please provide a reason/i),
      { target: { value: "abc" } }
    );
    expect(screen.getByText(/3\/10/)).toBeInTheDocument();
    fireEvent.change(
      screen.getByPlaceholderText(/please provide a reason/i),
      { target: { value: "long enough reason" } }
    );
    expect(screen.queryByText(/3\/10/)).not.toBeInTheDocument();
  });

  it("📋 Keep Booking calls onClose", () => {
    const onClose = jest.fn();
    render(
      <CancelBookingModal
        selectedBooking={selected}
        onClose={onClose}
        onCancel={jest.fn()}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: /keep booking/i })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("📋 Cancel Booking submits with the typed reason", () => {
    const onCancel = jest.fn();
    render(
      <CancelBookingModal
        selectedBooking={selected}
        onClose={jest.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.change(
      screen.getByPlaceholderText(/please provide a reason/i),
      { target: { value: "Customer requested cancellation" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /^cancel booking$/i }));
    expect(onCancel).toHaveBeenCalledWith("Customer requested cancellation");
  });
});
