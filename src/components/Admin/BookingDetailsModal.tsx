import React from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Car,
  MapPin,
} from "lucide-react";
import { Booking } from "./types";

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
}

export default function BookingDetailsModal({
  booking,
  onClose,
}: BookingDetailsModalProps) {
  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold">Booking Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Booking Reference */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                Booking Reference
              </span>
            </div>
            <p className="font-mono text-lg font-bold text-blue-800">
              {booking.bookingReference}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-blue-700">Status:</span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  booking.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : booking.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : booking.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="font-semibold text-gray-900">
                Customer Information
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Name
                </label>
                <p className="text-gray-900">{booking.customerInfo.name}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Phone
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{booking.customerInfo.phone}</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{booking.customerInfo.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <span className="font-semibold text-gray-900">
                Appointment Details
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Date
                </label>
                <p className="text-gray-900">
                  {new Date(booking.appointmentDate).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Time
                </label>
                <p className="text-gray-900">{booking.appointmentTime}</p>
              </div>
            </div>
          </div>

          {/* Service Type (for service bookings) */}
          {booking.serviceType && (
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  Service Information
                </span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Service Type
                </label>
                <p className="text-gray-900">{booking.serviceType}</p>
              </div>
            </div>
          )}

          {/* Car Details (for viewing bookings) */}
          {booking.carDetails && (
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Car className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  Vehicle Information
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-500">
                    Vehicle
                  </label>
                  <p className="font-medium text-gray-900">
                    {booking.carDetails.year} {booking.carDetails.make}{" "}
                    {booking.carDetails.model}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-500">
                    Price
                  </label>
                  <p className="font-bold text-green-600">
                    ${booking.carDetails.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Notes Section */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                Additional Information
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                Booking created:{" "}
                {new Date(booking.appointmentDate).toLocaleDateString()}
              </p>
              <p>Reference ID: {booking._id}</p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
