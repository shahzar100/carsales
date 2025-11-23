"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useViewing } from "@/backend/ViewingContext";
import BookingForm from "./Booking/BookingForm";
import VehicleDetails from "./Shared/VehicleDetails";

const CarViewing = () => {
  const { viewingBooking } = useViewing();
  const [isClient, setIsClient] = useState(false);
  const [isTransitioning] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // If no car details and not transitioning, show the "no car selected" message
  if (!viewingBooking.carDetails && !isTransitioning) {
    return (
      <div className="p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          No Car Selected
        </h2>
        <p className="mb-6 text-gray-600">
          Please select a car from our fleet to book a viewing.
        </p>
        <Link
          href="/BrowseFleet"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Browse Our Fleet
        </Link>
      </div>
    );
  }

  // If transitioning or no car details during transition, show loading
  if (!viewingBooking.carDetails) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <h2 className="col-span-full mb-6 text-center text-3xl font-bold">
        Book Your Car Viewing
      </h2>

      {/* Car Details Section */}
      <VehicleDetails vehicle={viewingBooking.carDetails} />

      <BookingForm />
    </div>
  );
};

export default CarViewing;
