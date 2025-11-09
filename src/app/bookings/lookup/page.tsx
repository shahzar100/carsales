"use client";
import React, { useState, useEffect } from "react";
import { Search, Calendar, Clock, Car, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Booking {
  bookingReference: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  serviceType?: string;
  carDetails?: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
  cancellationReason?: string;
}

export default function BookingLookupPage() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("ref") || "");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingType, setBookingType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("ref")) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!reference.trim()) {
      setError("Please enter a booking reference");
      return;
    }

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const response = await fetch(`/api/bookings/lookup?ref=${encodeURIComponent(reference)}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setBooking(result.data.booking);
        setBookingType(result.data.type);
      } else {
        setError(result.error || "Booking not found");
      }
    } catch (err) {
      setError("Failed to lookup booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const timeFormats: { [key: string]: string } = {
      "09:00": "9:00 AM - 10:00 AM",
      "10:00": "10:00 AM - 11:00 AM",
      "11:00": "11:00 AM - 12:00 PM",
      "12:00": "12:00 PM - 1:00 PM",
      "14:00": "2:00 PM - 3:00 PM",
      "15:00": "3:00 PM - 4:00 PM",
      "16:00": "4:00 PM - 5:00 PM",
      "17:00": "5:00 PM - 6:00 PM",
      "18:00": "6:00 PM - 7:00 PM",
    };
    return timeFormats[time] || time;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: React.ReactNode; text: string } } = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="w-4 h-4" />, text: "Pending" },
      confirmed: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" />, text: "Confirmed" },
      completed: { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-4 h-4" />, text: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" />, text: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.color} font-medium`}>
        {config.icon}
        <span>{config.text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Lookup</h1>
          <p className="text-gray-600">Enter your booking reference to view your appointment details</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter your booking reference (e.g., BK-ABC123)"
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Booking Details */}
        {booking && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header with Status */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Booking Reference</p>
                  <h2 className="text-2xl font-bold">{booking.bookingReference}</h2>
                </div>
                <div>{getStatusBadge(booking.status)}</div>
              </div>
            </div>

            {/* Cancellation Notice */}
            {booking.status === "cancelled" && booking.cancellationReason && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
                <h3 className="font-semibold text-red-900 mb-2">Cancellation Reason:</h3>
                <p className="text-red-800">{booking.cancellationReason}</p>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Appointment Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{formatDate(booking.appointmentDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">{formatTime(booking.appointmentTime)}</p>
                    </div>
                  </div>
                  {bookingType === "service" && booking.serviceType && (
                    <div className="flex items-start gap-3">
                      <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Service Type</p>
                        <p className="font-medium text-gray-900">{booking.serviceType}</p>
                      </div>
                    </div>
                  )}
                  {bookingType === "viewing" && booking.carDetails && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-3">
                      <p className="text-sm text-gray-500 mb-2">Vehicle</p>
                      <h4 className="text-lg font-bold text-gray-900">
                        {booking.carDetails.year} {booking.carDetails.make} {booking.carDetails.model}
                      </h4>
                      <p className="text-green-600 font-bold text-lg mt-1">
                        ${booking.carDetails.price.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium text-gray-900">{booking.customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-gray-900">{booking.customerInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium text-gray-900">{booking.customerInfo.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Note */}
              {booking.status !== "cancelled" && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    If you need to cancel or reschedule your appointment, please contact us at least 24 hours in advance.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
