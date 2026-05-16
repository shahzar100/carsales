/**
 * Tests for src/components/Admin/ServiceBookingsClient.tsx
 *
 * Mirror of the ViewingBookingsClient test — the two components share the
 * same shape (initialBookings + cancel + confirm + refetch). The heavy
 * children (ServiceBookingsTab, CancelBookingModal, BookingDetailsModal)
 * are stubbed via prop-capturing mocks so we can drive state via the
 * callbacks they're handed.
 *
 * Standards coverage:
 * - 📋 Functional: empty initialBookings → "No service bookings" copy;
 *   cancel rejects reasons <10 chars; cancel POSTs `/api/bookings/cancel`
 *   then refetches `/api/admin/bookings`; confirm PUTs `/api/admin/bookings`
 *   with `type: "service"` + status "confirmed" then refetches; details
 *   modal opens with the selected booking
 * - 🎯 Usability: toast on every success/failure branch
 */
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: jest.fn(),
    warning: jest.fn(),
  }),
}));

let serviceTabProps: any = null;
let cancelModalProps: any = null;
let detailsModalProps: any = null;

jest.mock("@/components/Admin", () => ({
  ServiceBookingsTab: (props: any) => {
    serviceTabProps = props;
    return (
      <div data-testid="service-tab">
        <span data-testid="tab-count">{props.bookings.length}</span>
      </div>
    );
  },
  CancelBookingModal: (props: any) => {
    cancelModalProps = props;
    return <div data-testid="cancel-modal" />;
  },
  BookingDetailsModal: (props: any) => {
    detailsModalProps = props;
    return (
      <div data-testid="details-modal">
        <span data-testid="details-id">{props.booking?._id}</span>
      </div>
    );
  },
}));

import ServiceBookingsClient from "@/components/Admin/ServiceBookingsClient";

const sampleBooking = {
  _id: "sb-1",
  bookingReference: "SB-001",
  customerName: "Alice",
  status: "pending",
};

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  serviceTabProps = null;
  cancelModalProps = null;
  detailsModalProps = null;
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe("ServiceBookingsClient", () => {
  it("renders 'No service bookings available' when initialBookings is empty", () => {
    render(<ServiceBookingsClient initialBookings={[]} />);
    expect(
      screen.getByText(/no service bookings available/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("service-tab")).not.toBeInTheDocument();
  });

  it("📋 renders the service tab seeded with initialBookings", () => {
    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );
    expect(screen.getByTestId("service-tab")).toBeInTheDocument();
    expect(screen.getByTestId("tab-count").textContent).toBe("1");
  });

  it("📋 cancel with reason <10 chars → error toast, no fetch", async () => {
    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await act(async () => {
      serviceTabProps.onCancelBooking({
        booking: sampleBooking,
        type: "service",
      });
    });
    await act(async () => {
      await cancelModalProps.onCancel("too short");
    });
    expect(mockToastError).toHaveBeenCalledWith(
      "Invalid Reason",
      "Cancellation reason must be at least 10 characters"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("📋 cancel success → POST /api/bookings/cancel + refetch + success toast", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { serviceBookings: [] } }),
      });

    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );

    await act(async () => {
      serviceTabProps.onCancelBooking({
        booking: sampleBooking,
        type: "service",
      });
    });
    await act(async () => {
      await cancelModalProps.onCancel("legitimate cancellation reason");
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/bookings/cancel",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          bookingReference: "SB-001",
          type: "service",
          reason: "legitimate cancellation reason",
        }),
      })
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/admin/bookings")
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Booking Cancelled",
      "Booking cancelled and customer notified"
    );
  });

  it("🎯 cancel non-ok → 'Cancellation Failed' toast", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await act(async () => {
      serviceTabProps.onCancelBooking({
        booking: sampleBooking,
        type: "service",
      });
    });
    await act(async () => {
      await cancelModalProps.onCancel("legitimate cancellation reason");
    });
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Cancellation Failed",
        "Failed to cancel booking"
      )
    );
  });

  it("🎯 cancel network error → 'Error' toast", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await act(async () => {
      serviceTabProps.onCancelBooking({
        booking: sampleBooking,
        type: "service",
      });
    });
    await act(async () => {
      await cancelModalProps.onCancel("legitimate cancellation reason");
    });
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Error",
        "An error occurred while cancelling the booking"
      )
    );
  });

  it("📋 confirm booking → PUT /api/admin/bookings with type=service + refetch", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { serviceBookings: [] } }),
      });

    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await serviceTabProps.onConfirmBooking(sampleBooking);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/bookings",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          bookingId: "sb-1",
          status: "confirmed",
          type: "service",
        }),
      })
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/admin/bookings")
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Booking Confirmed",
      "Booking has been confirmed successfully"
    );
  });

  it("🎯 confirm non-ok → 'Confirmation Failed' toast", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await serviceTabProps.onConfirmBooking(sampleBooking);
    expect(mockToastError).toHaveBeenCalledWith(
      "Confirmation Failed",
      "Failed to confirm booking"
    );
  });

  it("📋 view details opens the details modal with the selected booking", async () => {
    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );
    expect(screen.queryByTestId("details-modal")).not.toBeInTheDocument();
    await act(async () => {
      serviceTabProps.onViewDetails(sampleBooking);
    });
    expect(screen.getByTestId("details-modal")).toBeInTheDocument();
    expect(screen.getByTestId("details-id").textContent).toBe("sb-1");
  });

  it("📋 getStatusBadge renders the per-status colour class", () => {
    render(
      <ServiceBookingsClient initialBookings={[sampleBooking as any]} />
    );
    const { container } = render(serviceTabProps.getStatusBadge("confirmed"));
    expect(container.innerHTML).toContain("bg-green-100");
    const { container: unknownC } = render(
      serviceTabProps.getStatusBadge("totally-unknown-status")
    );
    expect(unknownC.innerHTML).toContain("bg-gray-100");
  });
});
