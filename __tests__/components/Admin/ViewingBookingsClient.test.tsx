/**
 * Tests for src/components/Admin/ViewingBookingsClient.tsx
 *
 * The client island that owns the viewing-bookings page. The big helper
 * components (ViewingBookingsTab, CancelBookingModal, BookingDetailsModal)
 * are mocked so we can focus on the wiring this file owns: initial state,
 * search-term plumbing, cancel/confirm flows, refetch on success.
 *
 * Standards coverage:
 * - 📋 Functional: renders the tab when bookings exist (else "No viewing
 *   bookings available" copy); cancel rejects reasons <10 chars; cancel
 *   POSTs `/api/admin/bookings/cancel` then refetches `/api/admin/bookings`;
 *   confirm PUTs `/api/admin/bookings` with `type: "viewing"` + status
 *   "confirmed" then refetches; details modal opens with the selected
 *   booking
 * - 🎯 Usability: toast on every success/failure branch, including
 *   network errors caught by the surrounding try/catch
 */
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";

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

// Wire up controllable mocks for each of the heavy components. Each
// mock exposes the props it was called with via a globally-captured
// ref so individual tests can drive the flow.
let viewingTabProps: any = null;
let cancelModalProps: any = null;
let _detailsModalProps: any = null;

jest.mock("@/components/Admin", () => ({
  ViewingBookingsTab: (props: any) => {
    viewingTabProps = props;
    return (
      <div data-testid="viewing-tab">
        <span data-testid="tab-count">{props.bookings.length}</span>
        <span data-testid="tab-search">{props.searchTerm}</span>
      </div>
    );
  },
  CancelBookingModal: (props: any) => {
    cancelModalProps = props;
    return <div data-testid="cancel-modal" />;
  },
  BookingDetailsModal: (props: any) => {
    _detailsModalProps = props;
    return (
      <div data-testid="details-modal">
        <span data-testid="details-id">{props.booking?._id}</span>
      </div>
    );
  },
}));

import ViewingBookingsClient from "@/components/Admin/ViewingBookingsClient";

const sampleBooking = {
  _id: "vb-1",
  bookingReference: "VB-001",
  customerName: "Alice",
  status: "pending",
};

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  viewingTabProps = null;
  cancelModalProps = null;
  _detailsModalProps = null;
  fetchMock = jest.fn();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe("ViewingBookingsClient", () => {
  it("renders 'No viewing bookings available' when initialBookings is empty", () => {
    render(<ViewingBookingsClient initialBookings={[]} />);
    expect(
      screen.getByText(/no viewing bookings available/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("viewing-tab")).not.toBeInTheDocument();
  });

  it("📋 renders the viewing tab seeded with initialBookings", () => {
    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    expect(screen.getByTestId("viewing-tab")).toBeInTheDocument();
    expect(screen.getByTestId("tab-count").textContent).toBe("1");
  });

  it("📋 cancel with reason <10 chars → error toast, no fetch", async () => {
    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    // Open the cancel modal first via the prop the tab was given.
    await act(async () => {
      viewingTabProps.onCancelBooking({
        booking: sampleBooking,
        type: "viewing",
      });
    });
    // Now drive the modal's onCancel with too-short reason.
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
    // 1st call: cancel response. 2nd call: refetch.
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { viewingBookings: [] } }),
      });

    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );

    await act(async () => {
      viewingTabProps.onCancelBooking({
        booking: sampleBooking,
        type: "viewing",
      });
    });
    await act(async () => {
      await cancelModalProps.onCancel("legitimate cancellation reason");
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/bookings/cancel",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          bookingReference: "VB-001",
          type: "viewing",
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

  it("🎯 cancel non-ok response → 'Cancellation Failed' toast", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false }),
    });
    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await act(async () => {
      viewingTabProps.onCancelBooking({
        booking: sampleBooking,
        type: "viewing",
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
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await act(async () => {
      viewingTabProps.onCancelBooking({
        booking: sampleBooking,
        type: "viewing",
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

  it("📋 confirm booking → PUT /api/admin/bookings with status confirmed + refetch", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { viewingBookings: [] } }),
      });

    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await viewingTabProps.onConfirmBooking(sampleBooking);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/bookings",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          bookingId: "vb-1",
          status: "confirmed",
          type: "viewing",
        }),
      })
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/admin/bookings")
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Booking Confirmed",
      "Viewing appointment has been confirmed successfully"
    );
  });

  it("🎯 confirm non-ok response → 'Confirmation Failed' toast", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await viewingTabProps.onConfirmBooking(sampleBooking);
    expect(mockToastError).toHaveBeenCalledWith(
      "Confirmation Failed",
      "Failed to confirm booking"
    );
  });

  it("🎯 confirm network error → 'Error' toast", async () => {
    fetchMock.mockRejectedValueOnce(new Error("net"));
    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    await viewingTabProps.onConfirmBooking(sampleBooking);
    expect(mockToastError).toHaveBeenCalledWith(
      "Error",
      "An error occurred while confirming the booking"
    );
  });

  it("📋 view details opens the details modal with the selected booking", async () => {
    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    expect(screen.queryByTestId("details-modal")).not.toBeInTheDocument();
    await act(async () => {
      viewingTabProps.onViewDetails(sampleBooking);
    });
    expect(screen.getByTestId("details-modal")).toBeInTheDocument();
    expect(screen.getByTestId("details-id").textContent).toBe("vb-1");
  });

  it("📋 renders an Export CSV link pointing at /api/admin/bookings/export", () => {
    render(<ViewingBookingsClient initialBookings={[sampleBooking as any]} />);
    const link = screen.getByTestId("export-bookings-csv") as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
    // jsdom resolves the href against the document base URL, so compare
    // against the attribute rather than the resolved value.
    expect(link.getAttribute("href")).toBe("/api/admin/bookings/export");
    expect(link.hasAttribute("download")).toBe(true);
  });

  it("📋 getStatusBadge renders the per-status colour class", () => {
    render(
      <ViewingBookingsClient initialBookings={[sampleBooking as any]} />
    );
    const { container } = render(viewingTabProps.getStatusBadge("confirmed"));
    expect(container.innerHTML).toContain("bg-green-100");
    const { container: unknownC } = render(
      viewingTabProps.getStatusBadge("totally-unknown-status")
    );
    // Falls back to the gray badge.
    expect(unknownC.innerHTML).toContain("bg-gray-100");
  });
});
