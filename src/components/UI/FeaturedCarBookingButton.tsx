"use client";

import React from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useViewing } from "@/contexts/ViewingContext";
import { CarInterface } from "@/lib/interfaces";

const MotionLink = motion.create(Link);

const FeaturedCarBookingButton: React.FC<{ car: CarInterface }> = ({ car }) => {
  const { updateViewingBooking } = useViewing();

  const setCarForViewing = () => {
    updateViewingBooking({
      carId: car._id ? String(car._id) : undefined,
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
    <MotionLink
      href={`/Booking/${car._id}`}
      onClick={setCarForViewing}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/30"
    >
      <Calendar size={16} />
      Book Viewing
    </MotionLink>
  );
};

export default FeaturedCarBookingButton;
