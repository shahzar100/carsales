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
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        {/* Vehicle Details */}
        <div className="space-y-6 lg:space-y-8">
          <VehicleDetails vehicle={vehicleData} />

          {/* Additional Features - Mobile friendly additional info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Additional Information
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
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
