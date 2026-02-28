"use client";
import React from "react";
import { CarInterface } from "@/lib/interfaces";
import Image from "next/image";
import {
  Fuel,
  Gauge,
  Car,
  Palette,
  Edit,
  Trash2,
  Star,
  Eye,
} from "lucide-react";

interface CarsProps {
  car: CarInterface;
  carId: number;
  setCarId: React.Dispatch<React.SetStateAction<number>>;
  length: number;
  loading?: boolean;
}

const Cars = ({ car, carId, setCarId, length }: CarsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-700";
      case "sold":
        return "bg-red-100 text-red-700";
      case "reserved":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat("en-GB").format(mileage);
  };

  return (
    <>
      {/* Header */}
      <div className="flex w-full items-center justify-between gap-2">
        <h1 className="flex gap-1 text-lg font-bold text-gray-900">
          Car Inventory
          <span className="font-normal text-gray-500">({length})</span>
        </h1>
        <span className="text-sm text-gray-500">
          {carId + 1} / {length}
        </span>
      </div>

      {/* Main Card */}
      <div className="mt-4 w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative aspect-4/3 w-full md:aspect-auto lg:w-1/2">
            <Image
              src={"/tesla.webp"}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover"
              priority
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${getStatusColor(car.status)}`}
              >
                {car.status}
              </span>
              {car.featured && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-yellow-900">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex w-full flex-col p-4 md:p-5">
            {/* Title & Price */}
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {car.year} {car.make} {car.model}
                </h2>
                <p className="text-xs text-gray-500">
                  {car.transmission} • {car.fuel} • {car.doors} doors
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(car.price)}
                </p>
              </div>
            </div>

            {/* Compact Specs */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <Gauge className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className="truncate text-xs font-medium text-gray-700">
                  {formatMileage(car.mileage)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <Fuel className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate text-xs font-medium text-gray-700">
                  {car.fuel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <Palette className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span className="truncate text-xs font-medium text-gray-700">
                  {car.colour}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <Car className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                <span className="truncate text-xs font-medium text-gray-700">
                  {car.year}
                </span>
              </div>
            </div>

            {/* Features (compact) */}
            {car.features && car.features.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {car.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
              <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700">
                <Eye className="h-3.5 w-3.5" />
                View
              </button>
              <button className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 transition-colors hover:bg-red-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cars;
