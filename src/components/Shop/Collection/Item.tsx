"use client";
import React from "react";
import { useViewing } from "@/backend/ViewingContext";
import { Calendar, ChevronRight, Fuel, Gauge } from "lucide-react";
import NavButton from "../../UI/NavButton";
import Image from "next/image";

interface CarData {
  _id: string;
  Name: string;
  Brand: string;
  Fuel: string;
  Doors: number;
  Colour: string;
  Price: number;
  Year?: number;
  Mileage?: number;
  Image?: string;
}

interface ItemProps {
  car: CarData;
}

const Item: React.FC<ItemProps> = ({ car }) => {
  const { updateViewingBooking } = useViewing();

  const setCarForViewing = () => {
    updateViewingBooking({
      carId: car._id,
      carDetails: {
        make: car.Brand,
        model: car.Name,
        year: car.Year || new Date().getFullYear(),
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
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-gray-950 shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-black/20">
      {/* Image */}
      <div className="relative aspect-16/10 w-full overflow-hidden">
        <Image
          src={car.Image || "/tesla.webp"}
          alt={`${car.Brand} ${car.Name}`}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {/* Full gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/20 to-transparent" />
        {/* Year badge */}
        {car.Year && (
          <span className="absolute top-3 left-3 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
            {car.Year}
          </span>
        )}
        {/* Title & price overlaid on image */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          <h3 className="text-base font-bold text-white">
            {car.Brand} {car.Name}
          </h3>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-white">
              £{car.Price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">
              {car.Doors} Door &bull; {car.Colour}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
        {/* Specs row */}
        <div className="mb-5 flex flex-wrap gap-2">
          {car.Mileage != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-gray-400 ring-1 ring-white/10">
              <Gauge size={11} className="text-gray-500" />
              {car.Mileage.toLocaleString()} mi
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-gray-400 ring-1 ring-white/10">
            <Fuel size={11} className="text-gray-500" />
            {car.Fuel}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <NavButton
            href={`/BrowseFleet/${car._id}`}
            onClick={setCarForViewing}
            className="group/btn flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-gray-300 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Details
            <ChevronRight
              size={13}
              className="text-gray-500 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:text-gray-300"
            />
          </NavButton>
          <NavButton
            href={`/Booking/${car._id}`}
            onClick={setCarForViewing}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-red-500"
          >
            <Calendar size={13} />
            Book Viewing
          </NavButton>
        </div>
      </div>
    </div>
  );
};

export default Item;
