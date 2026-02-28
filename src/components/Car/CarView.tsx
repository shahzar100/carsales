"use client";
import React, { useState, useEffect } from "react";
import Cars from "./Cars";
import { CarInterface, CarViewingBooking } from "@/lib/interfaces";
import Button from "@/components/Helpful/Buttons/Button";
import { Car, ChevronLeft, ChevronRight } from "lucide-react";
import CarTable from "./CarTable";
import Filters from "./Filters";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import Image from "next/image";

const CarViewContent = ({
  cars,
  bookings,
}: {
  cars: CarInterface[];
  bookings: CarViewingBooking[];
}) => {
  const [viewType, setViewType] = useState<"table" | "card" | "list">("card");
  const [carId, setCarId] = useState<number>(0);
  const { state } = useFilters();

  // Switch to card view on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewType !== "card") {
        setViewType("card");
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className={`flex w-full flex-col gap-6`}>
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
        <>
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
          {viewType === "card" && (
            <>
              <div className="relative flex w-full items-center gap-4">
                {/* Left Navigation Button */}
                <button
                  onClick={() => setCarId(carId - 1)}
                  disabled={carId === 0}
                  className="absolute top-1/2 left-2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 md:static md:h-12 md:w-12 md:translate-y-0 md:bg-white md:ring-1 md:ring-gray-200 md:hover:shadow-xl"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700 md:h-6 md:w-6" />
                </button>

                {/* Car Card */}
                <div className="min-w-0 flex-1">
                  <Cars
                    car={filteredCars[carId]}
                    setCarId={setCarId}
                    length={filteredCars.length}
                    carId={carId}
                  />
                </div>

                {/* Right Navigation Button */}
                <button
                  onClick={() => setCarId(carId + 1)}
                  disabled={carId === filteredCars.length - 1}
                  className="absolute top-1/2 right-2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 md:static md:h-12 md:w-12 md:translate-y-0 md:bg-white md:ring-1 md:ring-gray-200 md:hover:shadow-xl"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700 md:h-6 md:w-6" />
                </button>
              </div>

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
        </>
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
