"use client";
import React, { useState } from "react";
import { Cars } from "@/components/Admin";
import { CarInterface, CarViewingBooking } from "@/lib/interfaces";
import Button from "@/components/Helpful/Buttons/Button";
import { Car, Table } from "lucide-react";
import CarTable from "./CarTable";
import Image from "next/image";

const CarView = ({
  cars,
  bookings,
}: {
  cars: CarInterface[];
  bookings: CarViewingBooking[];
}) => {
  const [viewType, setViewType] = useState<"table" | "card">("card");
  const [carId, setCarId] = useState<number>(0);

  return (
    <div className="mx-auto flex w-6/8 flex-col gap-6">
      {cars.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <Car className="mx-auto h-8 w-8 text-gray-400" />
            <p>No cars listed</p>
          </div>
        </div>
      )}
      {cars.length > 0 && (
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

      {cars.length > 0 && viewType === "card" && (
        <>
          <Cars
            car={cars[carId]}
            setCarId={setCarId}
            length={cars.length}
            carId={carId}
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {cars.map((c, idx) => (
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
      {cars.length > 0 && viewType === "table" && <CarTable cars={cars} />}
      <div className="flex flex-col">
        <h2> Bookings</h2>
      </div>
    </div>
  );
};

export default CarView;
