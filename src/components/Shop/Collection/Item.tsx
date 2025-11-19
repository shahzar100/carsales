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
    <div className="border hover:border-2 border-blue-500 bg-white group rounded-md overflow-hidden h-1/4 lg:h-auto">
      <VehicleDetails vehicle={vehicleData} showTitle={false} />

      <div className="p-4 bg-gray-50">
        <div className="flex w-full gap-4">
          <NavButton
            href={`/BrowseFleet/${car._id}`}
            onClick={setCarForViewing}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
          >
            <Info size={20} />
            More details
          </NavButton>
          <NavButton
            href={`/Booking/${car._id}`}
            onClick={setCarForViewing}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
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
