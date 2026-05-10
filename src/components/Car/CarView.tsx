"use client";
import React, { useState, useEffect } from "react";
import { CarInterface, CarViewingBooking } from "@/lib/interfaces";
import Button from "@/components/Helpful/Buttons/Button";
import { Car } from "lucide-react";
import CarTable from "./CarTable";
import Filters from "./Filters";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { filterCars } from "@/lib/utils/filterCars";
import CarCard from "./CarCard";
import CarListCard from "./CarListCard";
import EmptyState from "@/components/UI/EmptyState";

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
  const filteredCars = filterCars(cars, state);

  return (
    <div className={`flex w-full flex-col gap-6`}>
      <Filters
        totalCount={cars.length}
        filteredCount={filteredCars.length}
        cars={cars}
      />
      {filteredCars.length === 0 && (
        <EmptyState
          icon={Car}
          title="No cars found"
          description="Try adjusting your filters or clearing the search."
        />
      )}
      {filteredCars.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-end gap-2">
            <Button
              onClick={() => setViewType("card")}
              disabled={viewType === "card"}
            >
              Card
            </Button>
            <Button
              onClick={() => setViewType("table")}
              disabled={viewType === "table"}
            >
              Table
            </Button>

            <Button
              onClick={() => setViewType("list")}
              disabled={viewType === "list"}
            >
              List
            </Button>
          </div>
          {viewType === "card" && (
            <CarCard
              filteredCars={filteredCars}
              carId={carId}
              setCarId={setCarId}
            />
          )}
          {filteredCars.length > 0 && viewType === "table" && (
            <CarTable cars={filteredCars} />
          )}
          {filteredCars.length > 0 && viewType === "list" && (
            <div className="flex flex-col gap-4">
              {filteredCars.map((car) => (
                <CarListCard key={car._id} car={car} variant="admin" />
              ))}
            </div>
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
