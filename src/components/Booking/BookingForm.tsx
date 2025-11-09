import React, { useState } from "react";
import Button from "../Helpful/Buttons/Button";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";
import DateTimeStep from "./DateTimeStep";
import ContactInfoStep from "./ContactInfoStep";
import ReviewStep from "./ReviewStep";

const BookingForm = () => {
  const { viewingBooking, clearViewingBooking } = useViewing();
  const [formPart, setFormPart] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingReference, setBookingReference] = useState("");
  const [error, setError] = useState("");

  const handlePrevious = () => {
    if (formPart > 1) {
      setFormPart(formPart - 1);
    }
  };

  const handleNext = async () => {
    if (formPart === 3) {
      await handleSubmit();
    } else {
      setFormPart(formPart + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/bookings/viewing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carId: viewingBooking.carId,
          carDetails: viewingBooking.carDetails,
          customerInfo: viewingBooking.customerInfo,
          appointmentDate: viewingBooking.selectedDate,
          appointmentTime: viewingBooking.selectedTime,
          dealership: viewingBooking.dealership,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setBookingReference(result.data.bookingReference);
        setSubmitted(true);
        clearViewingBooking();
      } else {
        setError(result.error || "Failed to create booking. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isStep1Valid =
    viewingBooking.selectedDate && viewingBooking.selectedTime;
  const isStep2Valid =
    viewingBooking.customerInfo?.name?.trim() &&
    viewingBooking.customerInfo?.email?.trim() &&
    viewingBooking.customerInfo?.phone?.trim();

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
          <p className="text-gray-600 mb-4">
            Your viewing has been scheduled successfully.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Your Booking Reference:</p>
            <p className="text-2xl font-bold text-blue-600">{bookingReference}</p>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            A confirmation email has been sent to {viewingBooking.customerInfo?.email}.
            Please keep your booking reference for your records.
          </p>
          <a
            href={`/bookings/lookup?ref=${bookingReference}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Booking Details
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-bold text-xl mb-2">Schedule Your Viewing</h3>
        <p className="text-gray-600 text-sm">Step {formPart} of 3</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(formPart / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1">
        {formPart === 1 && <DateTimeStep />}
        {formPart === 2 && <ContactInfoStep />}
        {formPart === 3 && <ReviewStep />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
        <Button
          text="Previous"
          onClick={handlePrevious}
          icon={ArrowLeft}
          disabled={formPart === 1 || submitting}
          iconPlacement="left"
        />

        <div className="text-sm text-gray-500">{formPart} of 3</div>

        <Button
          text={formPart === 3 ? (submitting ? "Submitting..." : "Confirm Booking") : "Next"}
          onClick={handleNext}
          icon={ArrowRight}
          disabled={
            submitting ||
            (formPart === 1 && !isStep1Valid) ||
            (formPart === 2 && !isStep2Valid)
          }
          iconPlacement="right"
        />
      </div>
    </div>
  );
};

export default BookingForm;
