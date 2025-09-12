import React from "react";
import Link from "next/link";
import CarPartsGrid, { CarPart } from "@/components/CarParts/CarPartsGrid";

const mockCarParts: CarPart[] = [
  {
    id: 1,
    name: "BMW M3 Brake Pads",
    brand: "BMW",
    category: "Brakes",
    price: 149.99,
    image: "/car.jpg",
    condition: "New",
    compatibility: "BMW M3 2019-2023",
    description:
      "High-performance ceramic brake pads for superior stopping power.",
  },
  {
    id: 2,
    name: "Honda Civic Headlight Assembly",
    brand: "Honda",
    category: "Lighting",
    price: 245.0,
    image: "/car.jpg",
    condition: "New",
    compatibility: "Honda Civic 2016-2021",
    description: "OEM replacement headlight with LED technology.",
  },
  {
    id: 3,
    name: "Toyota Camry Air Filter",
    brand: "Toyota",
    category: "Engine",
    price: 24.99,
    image: "/car.jpg",
    condition: "New",
    compatibility: "Toyota Camry 2018-2024",
    description: "High-efficiency air filter for optimal engine performance.",
  },
  {
    id: 4,
    name: "Audi A4 Side Mirror",
    brand: "Audi",
    category: "Body",
    price: 189.5,
    image: "/car.jpg",
    condition: "Used - Good",
    compatibility: "Audi A4 2017-2022",
    description: "Driver side mirror with integrated turn signal.",
  },
  {
    id: 5,
    name: "Ford F-150 Tailgate Handle",
    brand: "Ford",
    category: "Body",
    price: 89.99,
    image: "/car.jpg",
    condition: "New",
    compatibility: "Ford F-150 2015-2020",
    description: "Durable replacement tailgate handle with chrome finish.",
  },
  {
    id: 6,
    name: "Mercedes C-Class Radiator",
    brand: "Mercedes",
    category: "Cooling",
    price: 320.0,
    image: "/car.jpg",
    condition: "Refurbished",
    compatibility: "Mercedes C-Class 2014-2019",
    description: "Aluminum radiator with enhanced cooling capacity.",
  },
  {
    id: 7,
    name: "Nissan Altima Exhaust Pipe",
    brand: "Nissan",
    category: "Exhaust",
    price: 156.75,
    image: "/car.jpg",
    condition: "New",
    compatibility: "Nissan Altima 2019-2023",
    description: "Stainless steel exhaust pipe for improved performance.",
  },
  {
    id: 8,
    name: "Volkswagen Golf Wheel Hub",
    brand: "Volkswagen",
    category: "Wheels",
    price: 67.5,
    image: "/car.jpg",
    condition: "Used - Excellent",
    compatibility: "VW Golf 2016-2022",
    description: "Front wheel hub assembly with bearing included.",
  },
];

const Page = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Car Parts & Components
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Browse our extensive collection of quality car parts. Reserve your
          parts today and complete your purchase at our location with expert
          installation available.
        </p>
      </div>

      {/* Car Parts Grid with Integrated Filters */}
      <CarPartsGrid parts={mockCarParts} />

      {/* Bottom Info Section */}
      <div className="mt-16 bg-red-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          How Part Reservation Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
              1
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Reserve Online</h3>
            <p className="text-gray-600 text-sm">
              Browse and reserve the parts you need from our online catalog.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
              2
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Visit Our Location
            </h3>
            <p className="text-gray-600 text-sm">
              Come to our shop to inspect and complete your purchase.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
              3
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Expert Installation
            </h3>
            <p className="text-gray-600 text-sm">
              Get professional installation services from our certified
              mechanics.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors duration-200"
          >
            Contact Us for More Info
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;
