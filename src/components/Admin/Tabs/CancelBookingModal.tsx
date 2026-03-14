"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SelectedBooking } from "@/lib/types";
import Modal from "@/components/Helpful/Buttons/Modal";
import Button from "@/components/Helpful/Buttons/Button";

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
    <Modal title="Cancel Booking" onClose={onClose} size="sm">
      {/* Warning icon */}
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm font-semibold">
          This action cannot be undone
        </span>
      </div>

      {/* Body */}
      <div className="space-y-4">
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
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm shadow-sm transition-all hover:border-gray-300 placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
          />
          {reason.length > 0 && reason.length < 10 && (
            <p className="mt-1 text-xs text-red-500">
              Reason must be at least 10 characters ({reason.length}/10)
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button
          onClick={onClose}
          variant="outline"
          disabled={false}
          customWidth="px-4 py-2 text-sm"
        >
          Keep Booking
        </Button>
        <Button
          onClick={() => onCancel(reason)}
          variant="primary"
          disabled={reason.length < 10}
          customWidth="px-4 py-2 text-sm"
        >
          Cancel Booking
        </Button>
      </div>
    </Modal>
  );
}
