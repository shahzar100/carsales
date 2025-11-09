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
