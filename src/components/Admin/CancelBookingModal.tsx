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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Cancel Booking</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please provide a reason for cancellation (minimum 10 characters)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {cancelReason.length}/10 characters minimum
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelReason.length < 10}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}
