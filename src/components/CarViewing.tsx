"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useViewing } from "@/contexts/ViewingContext";
import CarViewingForm from "./Main/Form/CarViewingForm";
import VehicleDetails from "./Shared/VehicleDetails";
import BookingAuthGate from "./Account/BookingAuthGate";

const CarViewing = () => {
  const { viewingBooking } = useViewing();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // If no car details, show the "no car selected" message
  if (!viewingBooking.carDetails) {
    return (
      <div className="p-8 text-center">
        <h2 className="section-title mb-4">No Car Selected</h2>
        <p className="mb-6 text-gray-600">
          Please select a car from our fleet to book a viewing.
        </p>
        <Link
          href="/BrowseFleet"
          className="inline-block rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700"
        >
          Browse Our Fleet
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <h2 className="section-title text-center">Book Your Car Viewing</h2>

      {/* Car Details Section */}
      <VehicleDetails vehicle={viewingBooking.carDetails} />

      {/* Multi-stage Booking Form — account required (BookingAuthGate). */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <BookingAuthGate
          heading="Sign in to book a viewing"
          message="You need an account to book a car viewing — it's quick, and your viewing then shows up in your dashboard."
        >
          <CarViewingForm />
        </BookingAuthGate>
      </div>
    </div>
  );
};

export default CarViewing;
