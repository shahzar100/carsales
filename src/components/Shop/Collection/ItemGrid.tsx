import React, { useState } from "react";
import Item from "./Item";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="section-title">
          {cars.length} Cars Available for Viewing
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Book a viewing appointment for any of these vehicles
        </p>
      </div>

      {/* Desktop: grid layout */}
      <div className="hidden grid-cols-1 gap-6 md:grid-cols-2 lg:grid xl:grid-cols-3">
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

      {/* Mobile: carousel */}
      <div className="relative flex flex-col gap-4 lg:hidden">
        {cars.length > 0 ? (
          <>
            <Item car={cars[car]} />
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setCar(car - 1)}
                disabled={car === 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[4rem] text-center text-sm text-gray-500">
                {car + 1} of {cars.length}
              </span>
              <button
                onClick={() => setCar(car + 1)}
                disabled={car === cars.length - 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-500">
              No cars match your current filters
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemGrid;
