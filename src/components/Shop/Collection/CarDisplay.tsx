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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                {car.Year} {car.Brand} {car.Name}
              </h1>
              <p className="text-lg text-gray-600">
                {car.Colour} • {car.Doors} doors • {car.Fuel}
              </p>
            </div>
            <div className="text-left lg:text-right">
              <p className="text-sm text-gray-500 mb-1">Price</p>
              <p className="text-4xl lg:text-5xl font-bold text-gray-900">
                £{car.Price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Vehicle Details - Takes up 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vehicle Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={car.Image || "/tesla.webp"}
                  fill
                  className="object-cover"
                  alt={`${car.Brand} ${car.Name}`}
                  priority
                  quality={95}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Vehicle Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Year</span>
                    <span className="font-semibold text-gray-900">{car.Year}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Engine</span>
                    <span className="font-semibold text-gray-900">{car.Fuel}</span>
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
                    <span className="font-semibold text-gray-900">{car.Colour}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Doors</span>
                    <span className="font-semibold text-gray-900">{car.Doors}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Brand</span>
                    <span className="font-semibold text-gray-900">{car.Brand}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Section - Takes up 1 column */}
          <div className="lg:col-span-1">
            <CarBooking car={car} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDisplay;
