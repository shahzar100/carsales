import React from "react";
import Image from "next/image";
import { Car, Fuel, Palette, Hash, Gauge } from "lucide-react";

interface VehicleDetailsProps {
  vehicle: {
    make?: string;
    model?: string;
    year?: number;
    price?: number;
    image?: string;
    fuel?: string;
    doors?: number;
    colour?: string;
    mileage?: number;
  };
  showTitle?: boolean;
  className?: string;
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  showTitle = true,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-2 lg:p-6 ${className}`}>
      {showTitle && (
        <h3 className="font-bold text-xl mb-4 flex items-center">
          <Car className="mr-2" size={24} />
          Vehicle Details
        </h3>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="h-54 lg:h-80 w-full lg:w-1/2 relative">
          <Image
            src={"/tesla.webp"}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
          />
        </div>

        <div className="lg:w-1/2 space-y-4 flex flex-col justify-between">
          <h2 className="font-bold text-2xl text-gray-800">
            {vehicle.year && `${vehicle.year} `}
            {vehicle.make} {vehicle.model}
          </h2>

          {vehicle.price && (
            <div className="text-3xl font-bold text-green-600">
              £{vehicle.price.toLocaleString()}
            </div>
          )}

          {/* Compact Vehicle Specifications Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4 text-gray-800">
            {vehicle.mileage && (
              <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                <Gauge className="text-blue-500" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Mileage</p>
                  <p className="font-medium text-sm">
                    {vehicle.mileage.toLocaleString()} miles
                  </p>
                </div>
              </div>
            )}

            {vehicle.fuel && (
              <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                <Fuel className="text-green-500" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Fuel Type</p>
                  <p className="font-medium text-sm">{vehicle.fuel}</p>
                </div>
              </div>
            )}

            {vehicle.doors && (
              <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                <Hash className="text-purple-500" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Doors</p>
                  <p className="font-medium text-sm">{vehicle.doors}</p>
                </div>
              </div>
            )}

            {vehicle.colour && (
              <div className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                <Palette className="text-orange-500" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Colour</p>
                  <p className="font-medium text-sm">{vehicle.colour}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetails;
