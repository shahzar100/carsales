"use client";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { useViewing } from "@/backend/ViewingContext";
import {
  Calendar,
  Eye,
  Car,
  Fuel,
  Palette,
  DoorOpen,
  Info,
} from "lucide-react";

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
        image: car.Image || "/car.webp",
      },
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 border hover:border-2 border-blue-500 group p-4 rounded-md">
      <div className="relative w-full h-60 lg:w-2/5 lg:h-auto overflow-hidden">
        <Image
          src={"/car.jpg"}
          fill
          alt={`${car.Brand} ${car.Name}`}
          className="object-contain lg:object-cover transition-transform duration-500 group-hover:scale-105 rounded-md"
        />
      </div>

      <div className="flex flex-col p-4 gap-4 lg:w-2/3 w-full lg:h-full justify-between">
        <div>
          <h2 className="font-bold text-2xl mb-2 text-gray-800">
            {car.Year && `${car.Year} `}
            {car.Brand} {car.Name}
          </h2>

          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-gray-400" />
              <span>{car.Brand}</span>
            </div>
            <div className="flex items-center gap-2">
              <Fuel size={16} className="text-gray-400" />
              <span>{car.Fuel}</span>
            </div>
            <div className="flex items-center gap-2">
              <DoorOpen size={16} className="text-gray-400" />
              <span>{car.Doors} doors</span>
            </div>
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-gray-400" />
              <span>{car.Colour}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center w-full gap-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              £{car.Price.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Purchase Price</p>
          </div>

          <div className="flex w-full gap-4">
            <Link
              href={`/BrowseFleet/${car._id}`}
              onClick={setCarForViewing}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
            >
              <Info size={20} />
              More details
            </Link>
            <Link
              href={`/Booking/${car._id}`}
              onClick={setCarForViewing}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
            >
              <Calendar size={20} />
              Book Viewing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Item;
