import React, { useState } from "react";
import Button from "../Helpful/Buttons/Button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";
import DateTimeStep from "./DateTimeStep";
import ContactInfoStep from "./ContactInfoStep";
import ReviewStep from "./ReviewStep";

const BookingForm = () => {
  const { viewingBooking, updateViewingBooking } = useViewing();
  const [formPart, setFormPart] = useState(1);

  const handlePrevious = () => {
    if (formPart > 1) {
      setFormPart(formPart - 1);
    }
  };

  const handleNext = () => {
    setFormPart(formPart + 1);
  };

  const isStep1Valid =
    viewingBooking.selectedDate && viewingBooking.selectedTime;
  const isStep2Valid =
    viewingBooking.customerInfo?.name?.trim() &&
    viewingBooking.customerInfo?.email?.trim() &&
    viewingBooking.customerInfo?.phone?.trim();

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
          disabled={formPart === 1}
          iconPlacement="left"
        />

        <div className="text-sm text-gray-500">{formPart} of 3</div>

        <Button
          text={formPart === 3 ? "Confirm Booking" : "Next"}
          onClick={handleNext}
          icon={ArrowRight}
          disabled={
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
