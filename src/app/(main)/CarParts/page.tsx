import React from "react";
import Link from "next/link";
import CarPartsGrid, { CarPart } from "@/components/CarParts/CarPartsGrid";
import { BlackRedSection } from "@/components/Services/Common";

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
        <h1 className="page-title mb-4">Car Parts & Components</h1>
        <p className="description mx-auto max-w-3xl">
          Browse our extensive collection of quality car parts. Reserve your
          parts today and complete your purchase at our location with expert
          installation available.
        </p>
      </div>

      {/* Car Parts Grid with Integrated Filters */}
      <CarPartsGrid parts={mockCarParts} />

      {/* Bottom Info Section */}
      <BlackRedSection className="mt-8 md:mt-16">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            How Part Reservation Works
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-500/20">
                1
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Reserve Online
              </h3>
              <p className="text-sm text-gray-400">
                Browse and reserve the parts you need from our online catalog.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-500/20">
                2
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Visit Our Location
              </h3>
              <p className="text-sm text-gray-400">
                Come to our shop to inspect and complete your purchase.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-500/20">
                3
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                Expert Installation
              </h3>
              <p className="text-sm text-gray-400">
                Get professional installation services from our certified
                mechanics.
              </p>
            </div>
          </div>
          <div className="mt-10">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
            >
              Contact Us for More Info
            </Link>
          </div>
        </div>
      </BlackRedSection>
    </div>
  );
};

export default Page;
