"use client";

import React from "react";
import VehicleDetails from "../../Shared/VehicleDetails";

interface CarData {
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

interface CarDisplayProps {
  car: CarData;
}

const CarDisplay: React.FC<CarDisplayProps> = ({ car }) => {
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
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
        {/* Vehicle Details */}
        <div className="space-y-6 lg:space-y-8">
          <VehicleDetails vehicle={vehicleData} />

          {/* Additional Features - Mobile friendly additional info */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              Additional Information
            </h3>
            <div className="rounded-lg border border-blue-200 bg-linear-to-r from-blue-50 to-green-50 p-4">
              <p className="text-sm text-gray-600">
                This vehicle has been thoroughly inspected and comes with our
                quality guarantee. Contact us to schedule a viewing or test
                drive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDisplay;
