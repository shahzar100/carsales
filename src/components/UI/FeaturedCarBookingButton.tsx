"use client";

import React from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useViewing } from "@/backend/ViewingContext";

interface FeaturedCarBookingButtonProps {
  car: {
    _id: string;
    Name: string;
    Brand: string;
    Year: number;
    Fuel: string;
    Doors: number;
    Colour: string;
    Price: number;
    Mileage: number;
    Image?: string;
  };
}

const FeaturedCarBookingButton: React.FC<FeaturedCarBookingButtonProps> = ({
  car,
}) => {
  const { updateViewingBooking } = useViewing();

  const setCarForViewing = () => {
    updateViewingBooking({
      carId: car._id,
      carDetails: {
        make: car.Brand,
        model: car.Name,
        year: car.Year,
        price: car.Price,
        image: car.Image || "/tesla.webp",
        fuel: car.Fuel,
        doors: car.Doors,
        colour: car.Colour,
        mileage: car.Mileage,
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
