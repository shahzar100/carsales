"use client";

import React from "react";
import { Calendar, Clock, User, Mail, Phone, Wrench, Car } from "lucide-react";
import { Booking } from "@/lib/types";
import Modal from "@/components/Helpful/Buttons/Modal";
import Button from "@/components/Helpful/Buttons/Button";

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
}

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
};

export default function BookingDetailsModal({
  booking,
  onClose,
}: BookingDetailsModalProps) {
  return (
    <Modal title="Booking Details" onClose={onClose} size="sm">
      <p className="font-mono text-sm text-gray-500">
        {booking.bookingReference}
      </p>

      {/* Body */}
      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Status</span>
          {statusBadge(booking.status)}
        </div>

        {/* Customer Info */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">
            Customer Information
          </h4>
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{booking.customerInfo.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {booking.customerInfo.email}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {booking.customerInfo.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Appointment */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">
            Appointment
          </h4>
          <div className="flex gap-4 rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {new Date(booking.appointmentDate).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{booking.appointmentTime}</span>
            </div>
          </div>
        </div>

        {/* Service Type (if service booking) */}
        {booking.serviceType && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              Service
            </h4>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm">
              <Wrench className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{booking.serviceType}</span>
            </div>
          </div>
        )}

        {/* Car Details (if viewing booking) */}
        {booking.carDetails && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              Vehicle
            </h4>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm">
              <Car className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {booking.carDetails.year} {booking.carDetails.make}{" "}
                {booking.carDetails.model}
              </span>
              <span className="ml-auto font-semibold text-gray-900">
                £{booking.carDetails.price?.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end border-t border-gray-200 pt-4">
        <Button
          onClick={onClose}
          variant="primary"
          disabled={false}
          customWidth="bg-gray-900 hover:bg-gray-800 px-5 py-2 text-sm"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}
