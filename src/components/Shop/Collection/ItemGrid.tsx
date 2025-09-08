import React from "react";
import Item from "./Item";

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
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {cars.length} Cars Available for Viewing
        </h2>
        <p className="text-gray-600 mt-1">
          Book a viewing appointment for any of these vehicles
        </p>
      </div>

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
  );
};

export default ItemGrid;
