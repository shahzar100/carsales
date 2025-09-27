"use client";

import React from "react";
import Image from "next/image";
import CarBooking from "./CarBooking";
import { Car, Fuel } from "lucide-react";

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
  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        {/* Vehicle Details */}
        <div className="space-y-6 lg:space-y-8">
          {/* Vehicle Image */}
          <div className="w-full aspect-video lg:aspect-[16/10] relative rounded-xl lg:rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={car.Image || "/tesla.webp"}
              fill
              className="object-cover"
              alt={`${car.Brand} ${car.Name}`}
              priority
              quality={95}
              sizes="(max-width: 1024px) 100vw, 75vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute bottom-4 right-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-800">
                  Premium Quality
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats - Mobile friendly */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:hidden">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{car.Year}</p>
              <p className="text-xs text-gray-600">Year</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{car.Fuel}</p>
              <p className="text-xs text-gray-600">Fuel</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{car.Doors}</p>
              <p className="text-xs text-gray-600">Doors</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-xl font-bold text-gray-900">
                {car.Mileage?.toLocaleString() || "N/A"}
              </p>
              <p className="text-xs text-gray-600">Miles</p>
            </div>
          </div>

          {/* Detailed Specifications - Desktop */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Vehicle Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Year</span>
                  <span className="font-semibold text-gray-900">
                    {car.Year}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Engine</span>
                  <span className="font-semibold text-gray-900">
                    {car.Fuel}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Mileage</span>
                  <span className="font-semibold text-gray-900">
                    {car.Mileage?.toLocaleString() || "N/A"} miles
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Color</span>
                  <span className="font-semibold text-gray-900">
                    {car.Colour}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Doors</span>
                  <span className="font-semibold text-gray-900">
                    {car.Doors}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Brand</span>
                  <span className="font-semibold text-gray-900">
                    {car.Brand}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features - Mobile */}
          <div className="lg:hidden bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Additional Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Color</span>
                <span className="font-semibold text-gray-900">
                  {car.Colour}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Brand</span>
                <span className="font-semibold text-gray-900">{car.Brand}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDisplay;
