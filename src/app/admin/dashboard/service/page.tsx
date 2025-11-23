"use client";
import React, { useState, useEffect } from "react";
import {
  ServiceBookingsTab,
  CancelBookingModal,
  BookingDetailsModal,
  Booking,
  SelectedBooking,
} from "@/components/Admin";
import { useToast } from "@/hooks/useToast";

export default function ServiceBookingsPage() {
  const [serviceBookings, setServiceBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<SelectedBooking | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] =
    useState<Booking | null>(null);

  const toast = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/bookings");
      const data = await response.json();
      if (data.success) {
        setServiceBookings(data.data.serviceBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
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
      const response = await fetch("/api/bookings/cancel", {
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
        fetchBookings();
      } else {
        toast.error("Cancellation Failed", "Failed to cancel booking");
      }
    } catch (error) {
      toast.error("Error", "An error occurred while cancelling the booking");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      available: "bg-green-100 text-green-800",
      sold: "bg-red-100 text-red-800",
      reserved: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const handleShowCancelModal = (selectedBooking: SelectedBooking) => {
    setSelectedBooking(selectedBooking);
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
        fetchBookings();
      } else {
        toast.error("Confirmation Failed", "Failed to confirm booking");
      }
    } catch (error) {
      toast.error("Error", "An error occurred while confirming the booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ServiceBookingsTab
        bookings={serviceBookings}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCancelBooking={handleShowCancelModal}
        onConfirmBooking={handleConfirmBooking}
        onViewDetails={handleViewDetails}
        getStatusBadge={getStatusBadge}
      />

      {/* Modals */}
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
