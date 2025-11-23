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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Booking Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Booking Reference */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                Booking Reference
              </span>
            </div>
            <p className="font-mono text-lg font-bold text-blue-800">
              {booking.bookingReference}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-blue-700">Status:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
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
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">
                Customer Information
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Name
                </label>
                <p className="text-gray-900">{booking.customerInfo.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{booking.customerInfo.phone}</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{booking.customerInfo.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">
                Appointment Details
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
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
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Time
                </label>
                <p className="text-gray-900">{booking.appointmentTime}</p>
              </div>
            </div>
          </div>

          {/* Service Type (for service bookings) */}
          {booking.serviceType && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  Service Information
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Service Type
                </label>
                <p className="text-gray-900">{booking.serviceType}</p>
              </div>
            </div>
          )}

          {/* Car Details (for viewing bookings) */}
          {booking.carDetails && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  Vehicle Information
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Vehicle
                  </label>
                  <p className="text-gray-900 font-medium">
                    {booking.carDetails.year} {booking.carDetails.make}{" "}
                    {booking.carDetails.model}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Price
                  </label>
                  <p className="text-gray-900 font-bold text-green-600">
                    ${booking.carDetails.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Notes Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
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
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
