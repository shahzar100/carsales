import React, { useState } from "react";
import { X } from "lucide-react";
import { SelectedBooking } from "./types";

interface CancelBookingModalProps {
  selectedBooking: SelectedBooking;
  onClose: () => void;
  onCancel: (reason: string) => void;
}

export default function CancelBookingModal({
  selectedBooking,
  onClose,
  onCancel,
}: CancelBookingModalProps) {
  const [cancelReason, setCancelReason] = useState("");

  const handleCancel = () => {
    if (cancelReason.length < 10) {
      return;
    }
    onCancel(cancelReason);
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">Cancel Booking</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-600">
            Booking Reference:{" "}
            <span className="font-mono font-bold">
              {selectedBooking.booking.bookingReference}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Customer:{" "}
            <span className="font-medium">
              {selectedBooking.booking.customerInfo.name}
            </span>
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please provide a reason for cancellation (minimum 10 characters)"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {cancelReason.length}/10 characters minimum
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelReason.length < 10}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}
