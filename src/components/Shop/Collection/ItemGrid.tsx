import React, { useState } from "react";
import Item from "./Item";
import Button from "@/components/Helpful/Buttons/Button";
import { ArrowLeftCircle, ArrowRightCircle } from "lucide-react";

interface Car {
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
}

interface ItemGridProps {
  cars: Car[];
}

const ItemGrid: React.FC<ItemGridProps> = ({ cars }) => {
  const [car, setCar] = useState<number>(0);

  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {cars.length} Cars Available for Viewing
        </h2>
        <p className="text-gray-600 mt-1">
          Book a viewing appointment for any of these vehicles
        </p>
      </div>

      <div className="lg:flex flex-col gap-10 hidden">
        {cars.length > 0 ? (
          cars.map((car) => <Item car={car} key={car._id} />)
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">
              No cars match your current filters
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>

      <div className="lg:hidden relative flex flex-col gap-4">
        <Item car={cars[car]} />
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={() => setCar(car - 1)}
            disabled={car === 0}
            icon={ArrowLeftCircle}
            iconSize="large"
          />
          <span>
            {car + 1} of {cars.length}
          </span>
          <Button
            onClick={() => setCar(car + 1)}
            disabled={car === cars.length - 1}
            icon={ArrowRightCircle}
            iconPlacement="right"
            iconSize="large"
          />
        </div>
      </div>
    </div>
  );
};

export default ItemGrid;
