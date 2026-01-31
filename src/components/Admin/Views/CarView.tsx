"use client";
import React, { useState } from "react";
import { Cars } from "@/components/Admin";
import { CarInterface, CarViewingBooking } from "@/lib/interfaces";
import Button from "@/components/Helpful/Buttons/Button";
import { Car } from "lucide-react";
import CarTable from "./CarTable";
import Filters from "./Filters";
import { FilterProvider, useFilters } from "../../../contexts/FilterContext";
import Image from "next/image";

const CarViewContent = ({
  cars,
  bookings,
}: {
  cars: CarInterface[];
  bookings: CarViewingBooking[];
}) => {
  const [viewType, setViewType] = useState<"table" | "card">("card");
  const [carId, setCarId] = useState<number>(0);
  const { state } = useFilters();

  const carBookings = bookings.filter(
    (booking) => booking.carId === cars[carId]?._id
  );

  // Filter cars based on filter context
  const filteredCars = cars.filter((car) => {
    // Search filter
    const matchesSearch =
      state.searchTerm === "" ||
      `${car.make} ${car.model} ${car.year} ${car.colour}`
        .toLowerCase()
        .includes(state.searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      state.statusFilter === "all" || car.status === state.statusFilter;

    // Make filter
    const matchesMake = state.make === "all" || car.make === state.make;

    // Year filter
    const matchesYearMin = state.yearMin === null || car.year >= state.yearMin;
    const matchesYearMax = state.yearMax === null || car.year <= state.yearMax;

    // Price filter
    const matchesPriceMin =
      state.priceMin === null || car.price >= state.priceMin;
    const matchesPriceMax =
      state.priceMax === null || car.price <= state.priceMax;

    // Mileage filter
    const matchesMileageMin =
      state.mileageMin === null || car.mileage >= state.mileageMin;
    const matchesMileageMax =
      state.mileageMax === null || car.mileage <= state.mileageMax;

    // Doors filter
    const matchesDoors =
      state.doors === "all" || car.doors === parseInt(state.doors, 10);

    // Colour filter
    const matchesColour = state.colour === "all" || car.colour === state.colour;

    // Features filter
    const matchesFeatures =
      state.features.length === 0 ||
      state.features.every((feature) => car.features?.includes(feature));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMake &&
      matchesYearMin &&
      matchesYearMax &&
      matchesPriceMin &&
      matchesPriceMax &&
      matchesMileageMin &&
      matchesMileageMax &&
      matchesDoors &&
      matchesColour &&
      matchesFeatures
    );
  });

  return (
    <div className="mx-auto flex w-6/8 flex-col gap-6">
      <Filters
        totalCount={cars.length}
        filteredCount={filteredCars.length}
        cars={cars}
      />
      {filteredCars.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <Car className="mx-auto h-8 w-8 text-gray-400" />
            <p>No cars found</p>
          </div>
        </div>
      )}
      {filteredCars.length > 0 && (
        <div className="mb-4 flex items-center justify-end gap-2">
          <Button
            onClick={() => setViewType("table")}
            disabled={viewType === "table"}
          >
            Table
          </Button>
          <Button
            onClick={() => setViewType("card")}
            disabled={viewType === "card"}
          >
            Card
          </Button>
        </div>
      )}

      {filteredCars.length > 0 && viewType === "card" && (
        <>
          <Cars
            car={filteredCars[carId]}
            setCarId={setCarId}
            length={filteredCars.length}
            carId={carId}
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filteredCars.map((c, idx) => (
              <button
                key={c._id || idx}
                onClick={() => setCarId(idx)}
                className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg transition-all ${
                  idx === carId
                    ? "ring-2 ring-blue-600"
                    : "opacity-50 hover:opacity-100"
                }`}
              >
                <Image
                  src={"/tesla.webp"}
                  alt={`${c.make} ${c.model}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
      {filteredCars.length > 0 && viewType === "table" && (
        <CarTable cars={filteredCars} />
      )}
      {viewType === "card" && (
        <div className="flex flex-col">
          <h2> Bookings</h2>
          {carBookings.length === 0 && <p>No bookings available.</p>}
        </div>
      )}
    </div>
  );
};

// Wrapper component with FilterProvider
const CarView = ({
  cars,
  bookings,
}: {
  cars: CarInterface[];
  bookings: CarViewingBooking[];
}) => {
  return (
    <FilterProvider>
      <CarViewContent cars={cars} bookings={bookings} />
    </FilterProvider>
  );
};

export default CarView;
