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
        <h2 className="section-title">
          {cars.length} Cars Available for Viewing
        </h2>
        <p className="mt-1 text-gray-600">
          Book a viewing appointment for any of these vehicles
        </p>
      </div>

      <div className="hidden flex-col gap-10 lg:flex">
        {cars.length > 0 ? (
          cars.map((car) => <Item car={car} key={car._id} />)
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-lg text-gray-500">
              No cars match your current filters
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-4 lg:hidden">
        <Item car={cars[car]} />
        <div className="flex items-center justify-center gap-4">
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
