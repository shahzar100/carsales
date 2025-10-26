"use client";
import React, { useState, useEffect } from "react";
import { useSearchContext } from "@/backend/SearchContext";
import FilterBar from "./Filters/FilterBar";
import ItemGrid from "./ItemGrid";

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

interface CarFleetShopProps {
  cars: Car[];
}

const CarFleetShop: React.FC<CarFleetShopProps> = ({ cars }) => {
  const [isClient, setIsClient] = useState(false);
  const [filteredCars, setFilteredCars] = useState<Car[]>(cars);
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
        <div className="px-4 py-8 flex flex-col gap-8 mx-auto max-w-7xl">
          {/* Header */}
          <div>
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
          <p className="text-gray-600">
            Showing {filteredCars.length} of {cars.length} cars
          </p>

          {/* Car Grid */}
          <ItemGrid cars={filteredCars} />
        </div>
      )}
    </>
  );
};

export default CarFleetShop;
