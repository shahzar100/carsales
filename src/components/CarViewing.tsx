"use client";
import React, { useEffect, useState } from "react";
import { useViewing } from "@/backend/ViewingContext";
import PrimaryButton from "./Helpful/Buttons/PrimaryButton";
import BookingForm from "./Booking/BookingForm";
import VehicleDetails from "./Shared/VehicleDetails";

const CarViewing = () => {
  const { viewingBooking, addBooking, clearViewingBooking } = useViewing();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmission = async () => {
    if (
      !viewingBooking.carDetails ||
      !viewingBooking.selectedDate ||
      !viewingBooking.customerInfo
    ) {
      alert("Please fill in all required information");
      return;
    }

    try {
      // Add to local bookings
      addBooking(viewingBooking);

      // Optional: Send to API
      await fetch("/api/CreateViewingBooking", {
        method: "POST",
        body: JSON.stringify({ booking: viewingBooking }),
        headers: {
          "content-type": "application/json",
        },
      });

      alert("Viewing booked successfully!");
    } catch (error) {
      console.error("Error booking viewing:", error);
      alert("Error booking viewing. Please try again.");
    }
  };

  if (!isClient || !viewingBooking.carDetails) {
    return <div className="text-center p-8">Loading booking details...</div>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto p-6">
      <h2 className="font-bold text-3xl col-span-full text-center mb-6">
        Book Your Car Viewing
      </h2>

      {/* Car Details Section */}
      <VehicleDetails vehicle={viewingBooking.carDetails} />

      <BookingForm />
    </div>
  );
};

export default CarViewing;
