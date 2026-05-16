"use client";

import React from "react";
import { Calendar, Clock, User, Mail, Phone, Wrench, Car } from "lucide-react";
import { motion } from "motion/react";
import { Booking } from "@/lib/types";
import Modal from "@/components/Helpful/Buttons/Modal";
import Button from "@/components/Helpful/Buttons/Button";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { formatTime as formatBookingTime } from "@/lib/utils/booking";
import StatusBadge from "@/components/UI/StatusBadge";

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
}

const statusBadge = (status: string) => <StatusBadge status={status} />;

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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {/* Status */}
        <motion.div
          variants={sectionVariants}
          className="flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-500">Status</span>
          {statusBadge(booking.status)}
        </motion.div>

        {/* Customer Info */}
        <motion.div variants={sectionVariants}>
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
        </motion.div>

        {/* Appointment */}
        <motion.div variants={sectionVariants}>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">
            Appointment
          </h4>
          <div className="flex gap-4 rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {formatDate(booking.appointmentDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {formatBookingTime(booking.appointmentTime)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Service Type (if service booking) */}
        {booking.serviceType && (
          <motion.div variants={sectionVariants}>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              Service
            </h4>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm">
              <Wrench className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{booking.serviceType}</span>
            </div>
          </motion.div>
        )}

        {/* Car Details (if viewing booking) */}
        {booking.carDetails && (
          <motion.div variants={sectionVariants}>
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
                {formatPrice(booking.carDetails.price)}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

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
