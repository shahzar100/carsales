"use client";
import React from "react";
import { useViewing } from "@/backend/ViewingContext";
import { Calendar, Info } from "lucide-react";
import VehicleDetails from "../../Shared/VehicleDetails";
import NavButton from "../../UI/NavButton";

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

  const vehicleData = {
    make: car.Brand,
    model: car.Name,
    year: car.Year,
    price: car.Price,
    image: car.Image || "/tesla.webp",
    fuel: car.Fuel,
    doors: car.Doors,
    colour: car.Colour,
    mileage: car.Mileage,
  };

  return (
    <div className="group mx-auto w-full max-w-lg overflow-hidden rounded-md border border-red-500 bg-white hover:border-2 lg:mx-0 lg:max-w-full">
      <VehicleDetails vehicle={vehicleData} showTitle={false} />

      <div className="bg-gray-50 p-4">
        <div className="flex w-full gap-4">
          <NavButton
            href={`/BrowseFleet/${car._id}`}
            onClick={setCarForViewing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
          >
            <Info size={20} />
            More details
          </NavButton>
          <NavButton
            href={`/Booking/${car._id}`}
            onClick={setCarForViewing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Calendar size={20} />
            Book Viewing
          </NavButton>
        </div>
      </div>
    </div>
  );
};

export default Item;
