"use client";
import React, { useEffect, useState } from "react";
import { useViewing } from "@/backend/ViewingContext";
import PrimaryButton from "./Helpful/Buttons/PrimaryButton";
import BookingForm from "./Booking/BookingForm";
import VehicleDetails from "./Shared/VehicleDetails";

const CarViewing = () => {
  const { viewingBooking, addBooking, clearViewingBooking } = useViewing();
  const [isClient, setIsClient] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="text-center p-8">Loading...</div>;
  }

  // If no car details and not transitioning, show the "no car selected" message
  if (!viewingBooking.carDetails && !isTransitioning) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          No Car Selected
        </h2>
        <p className="text-gray-600 mb-6">
          Please select a car from our fleet to book a viewing.
        </p>
        <a
          href="/BrowseFleet"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Our Fleet
        </a>
      </div>
    );
  }

  // If transitioning or no car details during transition, show loading
  if (!viewingBooking.carDetails) {
    return <div className="text-center p-8">Loading...</div>;
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
