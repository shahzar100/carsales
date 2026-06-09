"use client";
import React, { useState } from "react";
import {
  ServiceBookingsTab,
  CancelBookingModal,
  BookingDetailsModal,
  Booking,
  SelectedBooking,
} from "@/components/Admin";
import { useToast } from "@/hooks/useToast";
import { logError } from "@/lib/utils/observability";

interface Props {
  initialBookings: Booking[];
}

const getStatusBadge = (status: string) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    available: "bg-green-100 text-green-800",
    sold: "bg-red-100 text-red-800",
    reserved: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
};

/**
 * Client island for the service-bookings admin page.
 *
 * Mirrors ViewingBookingsClient — initial rows come from the parent
 * server component so the first paint already shows the bookings.
 * Cancel + confirm mutations trigger a client-side refetch.
 *
 * Day 12.6 / Finding #29 — sibling of ViewingBookingsClient.
 */
export default function ServiceBookingsClient({ initialBookings }: Props) {
  const [serviceBookings, setServiceBookings] =
    useState<Booking[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<SelectedBooking | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] =
    useState<Booking | null>(null);

  const toast = useToast();

  const refetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings");
      const data = await response.json();
      if (response.ok && data.success && data.data?.serviceBookings) {
        setServiceBookings(data.data.serviceBookings);
      } else {
        toast.error(
          "Refresh Failed",
          data.error || "Could not refresh the bookings list"
        );
      }
    } catch (error) {
      logError(error, { context: "service-dashboard.refetchBookings" });
      toast.error(
        "Connection Error",
        "Could not connect to the server to refresh bookings"
      );
    }
  };

  const handleCancelBooking = async (reason: string) => {
    if (!selectedBooking || reason.length < 10) {
      toast.error(
        "Invalid Reason",
        "Cancellation reason must be at least 10 characters"
      );
      return;
    }

    try {
      const response = await fetch("/api/admin/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingReference: selectedBooking.booking.bookingReference,
          type: selectedBooking.type,
          reason: reason,
        }),
      });

      if (response.ok) {
        toast.success(
          "Booking Cancelled",
          "Booking cancelled and customer notified"
        );
        setShowCancelModal(false);
        setSelectedBooking(null);
        refetchBookings();
      } else {
        toast.error("Cancellation Failed", "Failed to cancel booking");
      }
    } catch {
      toast.error("Error", "An error occurred while cancelling the booking");
    }
  };

  const handleShowCancelModal = (booking: SelectedBooking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedBooking(null);
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBookingForDetails(booking);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBookingForDetails(null);
  };

  const handleConfirmBooking = async (booking: Booking) => {
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          status: "confirmed",
          type: "service",
        }),
      });

      if (response.ok) {
        toast.success(
          "Booking Confirmed",
          "Booking has been confirmed successfully"
        );
        refetchBookings();
      } else {
        toast.error("Confirmation Failed", "Failed to confirm booking");
      }
    } catch {
      toast.error("Error", "An error occurred while confirming the booking");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <a
          href="/api/admin/bookings/export"
          download
          data-testid="export-bookings-csv"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>
      {serviceBookings.length > 0 ? (
        <ServiceBookingsTab
          bookings={serviceBookings}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCancelBooking={handleShowCancelModal}
          onConfirmBooking={handleConfirmBooking}
          onViewDetails={handleViewDetails}
          getStatusBadge={getStatusBadge}
        />
      ) : (
        <p>No service bookings available.</p>
      )}

      {showCancelModal && selectedBooking && (
        <CancelBookingModal
          selectedBooking={selectedBooking}
          onClose={handleCloseCancelModal}
          onCancel={handleCancelBooking}
        />
      )}

      {showDetailsModal && selectedBookingForDetails && (
        <BookingDetailsModal
          booking={selectedBookingForDetails}
          onClose={handleCloseDetailsModal}
        />
      )}
    </div>
  );
}
