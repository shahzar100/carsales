"use client";
import React, { useState, useEffect } from "react";
import { useSearchContext } from "@/backend/SearchContext";
import FilterBar from "./Filters/FilterBar";
import ItemGrid from "./ItemGrid";

// Mock car data - replace with your actual data source
const mockCars = [
  {
    _id: "1",
    Name: "Model S",
    Brand: "Tesla",
    Year: 2023,
    Fuel: "Electric",
    Doors: 4,
    Colour: "White",
    Price: 85000,
    Mileage: 5000,
    Image: "/car.webp",
  },
  {
    _id: "2",
    Name: "Civic",
    Brand: "Honda",
    Year: 2022,
    Fuel: "Petrol",
    Doors: 4,
    Colour: "Blue",
    Price: 25000,
    Mileage: 15000,
    Image: "/car.webp",
  },
  {
    _id: "3",
    Name: "X5",
    Brand: "BMW",
    Year: 2023,
    Fuel: "Diesel",
    Doors: 5,
    Colour: "Black",
    Price: 65000,
    Mileage: 8000,
    Image: "/car.webp",
  },
  {
    _id: "4",
    Name: "A4",
    Brand: "Audi",
    Year: 2021,
    Fuel: "Petrol",
    Doors: 4,
    Colour: "Silver",
    Price: 35000,
    Mileage: 12000,
    Image: "/car.webp",
  },
];

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

const ShopItems = () => {
  const [isClient, setIsClient] = useState(false);
  const [cars, setCars] = useState<Car[]>(mockCars);
  const [filteredCars, setFilteredCars] = useState<Car[]>(mockCars);
  const { filters } = useSearchContext();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter cars based on search context
  useEffect(() => {
    let filtered = cars;

    // Apply filters
    if (filters.make) {
      if (Array.isArray(filters.make)) {
        filtered = filtered.filter((car) => filters.make!.includes(car.Brand));
      } else {
        filtered = filtered.filter((car) => car.Brand === filters.make);
      }
    }
    if (filters.yearFrom) {
      filtered = filtered.filter((car) => car.Year >= filters.yearFrom!);
    }
    if (filters.yearTo) {
      filtered = filtered.filter((car) => car.Year <= filters.yearTo!);
    }
    if (filters.priceFrom) {
      filtered = filtered.filter((car) => car.Price >= filters.priceFrom!);
    }
    if (filters.priceTo) {
      filtered = filtered.filter((car) => car.Price <= filters.priceTo!);
    }
    if (filters.fuelType) {
      if (Array.isArray(filters.fuelType)) {
        filtered = filtered.filter((car) =>
          filters.fuelType!.includes(car.Fuel)
        );
      } else {
        filtered = filtered.filter((car) => car.Fuel === filters.fuelType);
      }
    }
    if (filters.color) {
      if (Array.isArray(filters.color)) {
        filtered = filtered.filter((car) =>
          filters.color!.includes(car.Colour)
        );
      } else {
        filtered = filtered.filter((car) => car.Colour === filters.color);
      }
    }

    setFilteredCars(filtered);
  }, [filters, cars]);

  const brands = [...new Set(cars.map((car) => car.Brand))];
  const fuelTypes = [...new Set(cars.map((car) => car.Fuel))];
  const colors = [...new Set(cars.map((car) => car.Colour))];

  return (
    <>
      {isClient && (
        <div className="px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Our Car Collection
            </h1>
            <p className="text-gray-600">
              Find your perfect car and book a viewing appointment
            </p>
          </div>

          {/* Filter Bar */}
          <FilterBar brands={brands} fuelTypes={fuelTypes} colors={colors} />

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredCars.length} of {cars.length} cars
            </p>
          </div>

          {/* Car Grid */}
          <div className="flex-1">
            <ItemGrid cars={filteredCars} />
          </div>
        </div>
      )}
    </>
  );
};

export default ShopItems;
