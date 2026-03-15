"use client";

import React from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";
import { CarInterface } from "@/lib/interfaces";

const FeaturedCarBookingButton: React.FC<{ car: CarInterface }> = ({ car }) => {
  const { updateViewingBooking } = useViewing();

  const setCarForViewing = () => {
    updateViewingBooking({
      carId: car._id,
      carDetails: {
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        image: car.image || "/tesla.webp",
        fuel: car.fuel,
        doors: car.doors,
        colour: car.colour,
        mileage: car.mileage,
      },
    });
  };

  return (
    <Link
      href={`/Booking/${car._id}`}
      onClick={setCarForViewing}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all duration-200 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/30"
    >
      <Calendar size={16} />
      Book Viewing
    </Link>
  );
};

export default FeaturedCarBookingButton;
