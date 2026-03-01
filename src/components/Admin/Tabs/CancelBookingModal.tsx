"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { SelectedBooking } from "@/lib/types";

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
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Cancel Booking</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-4">
          <p className="text-sm text-gray-600">
            You are about to cancel booking{" "}
            <span className="font-mono font-semibold text-gray-900">
              {selectedBooking.booking.bookingReference}
            </span>{" "}
            for{" "}
            <span className="font-semibold text-gray-900">
              {selectedBooking.booking.customerInfo.name}
            </span>
            . The customer will be notified by email.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Cancellation reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason (min 10 characters)..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
            />
            {reason.length > 0 && reason.length < 10 && (
              <p className="mt-1 text-xs text-red-500">
                Reason must be at least 10 characters ({reason.length}/10)
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Keep Booking
          </button>
          <button
            onClick={() => onCancel(reason)}
            disabled={reason.length < 10}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}
