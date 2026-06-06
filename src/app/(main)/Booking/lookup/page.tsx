/**
 * BOOKING LOOKUP PAGE (302 lines)
 *
 * SUMMARY:
 * Customer-facing page for looking up existing bookings by reference number.
 * Displays booking details, status, and allows cancellation for service and viewing appointments.
 *
 * MAIN FEATURES:
 * - Search bookings by reference number
 * - Display service and car viewing booking details
 * - Show booking status with appropriate icons
 * - Allow booking cancellation with reason
 * - Handle multiple booking types (service/viewing)
 * - URL parameter support for direct booking access
 *
 * TECHNICAL DEBT ISSUES:
 * - Mixed API calling logic with UI rendering
 * - Hardcoded booking types and status handling
 * - No proper error boundary or loading states
 * - Repetitive booking display logic
 * - No caching of booking data
 * - Cancellation logic embedded in main component
 *
 * REFACTORING NEEDED:
 * - Extract booking API calls to custom hooks
 * - Create separate components for different booking types
 * - Implement proper error boundaries
 * - Add skeleton loading states
 * - Use React Query for caching and state management
 * - Extract cancellation logic to separate component/hook
 */

"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
// No route segment config: this is a client component using useSearchParams,
// so Next already opts out of static prerender. Re-adding `export const
// dynamic` would error ("dynamic is not a valid export from a client
// component"). (Audit #1.)
import {
  Search,
  Calendar,
  Clock,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/Helpful/Buttons/Button";
import TurnstileWidget from "@/components/Form/TurnstileWidget";
import { formatDate, formatTime } from "@/lib/utils/booking";
import { formatPrice } from "@/lib/utils/format";

interface Booking {
  bookingReference?: string;
  quoteReference?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  // Appointment fields are absent on quote requests.
  appointmentDate?: string;
  appointmentTime?: string;
  status: string;
  serviceType?: string;
  serviceDetails?: string;
  carDetails?: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
  // Quote requests carry the customer's vehicle instead of a carDetails.
  vehicle?: {
    make: string;
    model: string;
    year: number;
    registration?: string;
  };
  cancellationReason?: string;
}

const getStatusBadge = (status: string) => {
  const statusConfig: {
    [key: string]: { color: string; icon: React.ReactNode; text: string };
  } = {
    pending: {
      color: "bg-amber-100 text-amber-700",
      icon: <AlertCircle className="h-4 w-4" />,
      text: "Pending",
    },
    confirmed: {
      color: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle className="h-4 w-4" />,
      text: "Confirmed",
    },
    completed: {
      color: "bg-gray-100 text-gray-700",
      icon: <CheckCircle className="h-4 w-4" />,
      text: "Completed",
    },
    cancelled: {
      color: "bg-red-100 text-red-700",
      icon: <XCircle className="h-4 w-4" />,
      text: "Cancelled",
    },
    // Quote-request statuses.
    responded: {
      color: "bg-blue-100 text-blue-700",
      icon: <CheckCircle className="h-4 w-4" />,
      text: "Responded",
    },
    accepted: {
      color: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle className="h-4 w-4" />,
      text: "Accepted",
    },
    expired: {
      color: "bg-gray-100 text-gray-700",
      icon: <XCircle className="h-4 w-4" />,
      text: "Expired",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${config.color} font-medium`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};

export default function BookingLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <BookingLookupContent />
    </Suspense>
  );
}

function BookingLookupContent() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("ref") || "");
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingType, setBookingType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stable callback for TurnstileWidget so we don't re-mount the widget
  // on every render (the widget's useEffect depends on onToken identity).
  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const captchaConfigured = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );

  const handleSearch = useCallback(async () => {
    if (!reference.trim()) {
      setError("Please enter a booking reference");
      return;
    }

    if (!email.trim()) {
      setError("Please enter the email address used when booking");
      return;
    }

    if (captchaConfigured && !turnstileToken) {
      setError("Please complete the CAPTCHA challenge before searching");
      return;
    }

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const params = new URLSearchParams({ ref: reference, email });
      if (turnstileToken) params.set("turnstileToken", turnstileToken);
      const response = await fetch(`/api/bookings/lookup?${params}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setBooking(result.data.booking);
        setBookingType(result.data.type);
      } else {
        setError(result.error || "Booking not found");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [reference, email, turnstileToken, captchaConfigured]);

  useEffect(() => {
    // URL-driven path: only auto-fire when the user has supplied their
    // email AND (if CAPTCHA is configured) the widget has issued a token.
    if (!searchParams.get("ref") || !email) return;
    if (captchaConfigured && !turnstileToken) return;
    handleSearch();
  }, [searchParams, handleSearch, email, turnstileToken, captchaConfigured]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="page-title mb-2">Booking Lookup</h1>
          <p className="text-gray-600">
            Enter your booking reference to view your appointment details
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                aria-label="Booking reference"
                placeholder="Enter your booking reference (e.g., BK-ABC123)"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 pl-10 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
              />
              <Search className="absolute top-3.5 left-3 h-5 w-5 text-gray-400" />
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                aria-label="Email address used when booking"
                placeholder="Enter the email address used when booking"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm transition-all hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
              />
            </div>
            <TurnstileWidget onToken={handleTurnstileToken} />
            <Button onClick={handleSearch} loading={loading} size="lg">
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Booking Details */}
        {booking && (
          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            {/* Header with Status */}
            <div className="bg-linear-to-r from-gray-900 to-red-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm opacity-90">
                    {bookingType === "quote"
                      ? "Quote Reference"
                      : "Booking Reference"}
                  </p>
                  <h2 className="text-2xl font-bold">
                    {booking.bookingReference ?? booking.quoteReference}
                  </h2>
                </div>
                <div>{getStatusBadge(booking.status)}</div>
              </div>
            </div>

            {/* Cancellation Notice */}
            {booking.status === "cancelled" && booking.cancellationReason && (
              <div className="m-6 border-l-4 border-red-500 bg-red-50 p-4">
                <h3 className="mb-2 font-semibold text-red-900">
                  Cancellation Reason:
                </h3>
                <p className="text-red-800">{booking.cancellationReason}</p>
              </div>
            )}

            <div className="space-y-6 p-6">
              {/* Appointment / quote details */}
              {bookingType === "quote" ? (
                <div>
                  <h3 className="heading-3 mb-4">Quote Details</h3>
                  <div className="space-y-3">
                    {booking.serviceType && (
                      <div className="flex items-start gap-3">
                        <Car className="mt-0.5 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Service</p>
                          <p className="font-medium text-gray-900">
                            {booking.serviceType}
                          </p>
                        </div>
                      </div>
                    )}
                    {booking.vehicle && (
                      <div className="flex items-start gap-3">
                        <Car className="mt-0.5 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Vehicle</p>
                          <p className="font-medium text-gray-900">
                            {booking.vehicle.year} {booking.vehicle.make}{" "}
                            {booking.vehicle.model}
                          </p>
                        </div>
                      </div>
                    )}
                    {booking.serviceDetails && (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Details</p>
                          <p className="font-medium text-gray-900">
                            {booking.serviceDetails}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    This is a quote request — we&apos;ll email your quote to{" "}
                    {booking.customerInfo.email} shortly.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="heading-3 mb-4">Appointment Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium text-gray-900">
                          {booking.appointmentDate
                            ? formatDate(booking.appointmentDate)
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">
                          {booking.appointmentTime
                            ? formatTime(booking.appointmentTime)
                            : "—"}
                        </p>
                      </div>
                    </div>
                    {bookingType === "service" && booking.serviceType && (
                      <div className="flex items-start gap-3">
                        <Car className="mt-0.5 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Service Type</p>
                          <p className="font-medium text-gray-900">
                            {booking.serviceType}
                          </p>
                        </div>
                      </div>
                    )}
                    {bookingType === "viewing" && booking.carDetails && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-4">
                        <p className="mb-2 text-sm text-gray-500">Vehicle</p>
                        <h4 className="heading-3">
                          {booking.carDetails.year} {booking.carDetails.make}{" "}
                          {booking.carDetails.model}
                        </h4>
                        <p className="mt-1 text-lg font-bold text-red-600">
                          {formatPrice(booking.carDetails.price)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div>
                <h3 className="heading-3 mb-4">Your Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium text-gray-900">
                      {booking.customerInfo.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-gray-900">
                      {booking.customerInfo.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium text-gray-900">
                      {booking.customerInfo.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Note */}
              {bookingType !== "quote" && booking.status !== "cancelled" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">
                    If you need to cancel or reschedule your appointment, please
                    contact us at least 24 hours in advance.
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
