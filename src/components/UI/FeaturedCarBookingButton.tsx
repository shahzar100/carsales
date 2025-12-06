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
      className="flex w-full transform items-center justify-center gap-3 rounded-lg border-2 border-white bg-transparent px-6 py-5 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-black hover:shadow-xl"
    >
      <Calendar size={24} />
      Schedule Booking
    </Link>
  );
};

export default FeaturedCarBookingButton;
