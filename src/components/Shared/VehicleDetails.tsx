import React from "react";
import Image from "next/image";
import { Car, Fuel, Palette, Hash, Gauge, Cog } from "lucide-react";
import { formatPrice, formatMileage } from "@/lib/utils/format";

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
    transmission?: string;
    description?: string;
    features?: string[];
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
    <div className={`rounded-lg bg-white p-2 shadow-lg lg:p-6 ${className}`}>
      {showTitle && (
        <h3 className="mb-4 flex items-center text-xl font-bold">
          <Car className="mr-2" size={24} />
          Vehicle Details
        </h3>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="relative h-54 w-full lg:h-80 lg:w-1/2">
          <Image
            src={vehicle.image || "/tesla.webp"}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="flex flex-col justify-between space-y-4 lg:w-1/2">
          <h2 className="text-2xl font-bold text-gray-800">
            {vehicle.year && `${vehicle.year} `}
            {vehicle.make} {vehicle.model}
          </h2>

          {vehicle.price && (
            <div className="text-3xl font-bold text-green-600">
              {formatPrice(vehicle.price)}
            </div>
          )}

          {/* Compact Vehicle Specifications Grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-gray-800">
            {vehicle.mileage && (
              <div className="flex items-center gap-4 rounded bg-gray-50 p-2">
                <Gauge className="text-red-500" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Mileage</p>
                  <p className="text-sm font-medium">
                    {formatMileage(vehicle.mileage)} miles
                  </p>
                </div>
              </div>
            )}

            {vehicle.fuel && (
              <div className="flex items-center gap-4 rounded bg-gray-50 p-2">
                <Fuel className="text-gray-700" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Fuel Type</p>
                  <p className="text-sm font-medium">{vehicle.fuel}</p>
                </div>
              </div>
            )}

            {vehicle.transmission && (
              <div className="flex items-center gap-4 rounded bg-gray-50 p-2">
                <Cog className="text-blue-600" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Transmission</p>
                  <p className="text-sm font-medium">{vehicle.transmission}</p>
                </div>
              </div>
            )}

            {vehicle.doors && (
              <div className="flex items-center gap-4 rounded bg-gray-50 p-2">
                <Hash className="text-gray-500" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Doors</p>
                  <p className="text-sm font-medium">{vehicle.doors}</p>
                </div>
              </div>
            )}

            {vehicle.colour && (
              <div className="flex items-center gap-4 rounded bg-gray-50 p-2">
                <Palette className="text-orange-500" size={16} />
                <div>
                  <p className="text-xs text-gray-600">Colour</p>
                  <p className="text-sm font-medium">{vehicle.colour}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {vehicle.description && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">
            About this car
          </h4>
          <p className="text-sm leading-relaxed whitespace-pre-line text-gray-600">
            {vehicle.description}
          </p>
        </div>
      )}

      {vehicle.features && vehicle.features.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            What&apos;s included
          </h4>
          <div className="flex flex-wrap gap-2">
            {vehicle.features.map((feature, idx) => (
              <span
                key={idx}
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetails;
