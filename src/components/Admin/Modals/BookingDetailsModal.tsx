import React from "react";
import { X } from "lucide-react";
import { Booking } from "@/lib/types";

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

        <div className="space-y-3">
          <div>
            <strong>Reference:</strong> {booking.bookingReference}
          </div>
          <div>
            <strong>Customer:</strong>{" "}
            {booking.customerInfo.name.replace(/<[^>]*>/g, "")}
          </div>
          <div>
            <strong>Phone:</strong>{" "}
            {booking.customerInfo.phone.replace(
              /(\d{3})(\d{3})(\d{4})/,
              "$1-***-$3"
            )}
          </div>
          <div>
            <strong>Email:</strong> {booking.customerInfo.email}
          </div>
          <div>
            <strong>Status:</strong>
            <select
              className="ml-2 rounded border px-2 py-1"
              value={booking.status}
              onChange={() => {}}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
