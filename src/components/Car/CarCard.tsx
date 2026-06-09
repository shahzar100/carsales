"use client";
import React from "react";

import { CarInterface } from "@/lib/interfaces";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { m } from "motion/react";
import Cars from "@/components/Car/Cars";

const CarCard = ({
  filteredCars,
  carId,
  setCarId,
}: {
  filteredCars: CarInterface[];
  carId: number;
  setCarId: React.Dispatch<React.SetStateAction<number>>;
}) => {
  return (
    <>
      <div className="relative flex w-full items-center gap-4">
        {/* Left Navigation Button */}
        <m.button
          onClick={() => setCarId(carId - 1)}
          disabled={carId === 0}
          aria-label="Previous car"
          whileHover={carId === 0 ? undefined : { scale: 1.08, x: -2 }}
          whileTap={carId === 0 ? undefined : { scale: 0.9 }}
          transition={{ type: "spring", stiffness: 460, damping: 22 }}
          className="absolute top-1/2 left-2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white disabled:cursor-not-allowed disabled:opacity-20 disabled:shadow-none md:static md:h-12 md:w-12 md:translate-y-0 md:bg-white md:ring-1 md:ring-gray-200 md:hover:shadow-xl md:disabled:ring-gray-100"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700 md:h-6 md:w-6" />
        </m.button>

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
        <m.button
          onClick={() => setCarId(carId + 1)}
          disabled={carId === filteredCars.length - 1}
          aria-label="Next car"
          whileHover={
            carId === filteredCars.length - 1 ? undefined : { scale: 1.08, x: 2 }
          }
          whileTap={
            carId === filteredCars.length - 1 ? undefined : { scale: 0.9 }
          }
          transition={{ type: "spring", stiffness: 460, damping: 22 }}
          className="absolute top-1/2 right-2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white disabled:cursor-not-allowed disabled:opacity-20 disabled:shadow-none md:static md:h-12 md:w-12 md:translate-y-0 md:bg-white md:ring-1 md:ring-gray-200 md:hover:shadow-xl md:disabled:ring-gray-100"
        >
          <ChevronRight className="h-5 w-5 text-gray-700 md:h-6 md:w-6" />
        </m.button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {filteredCars.map((c, idx) => (
          <m.button
            key={c._id ? String(c._id) : idx}
            onClick={() => setCarId(idx)}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 460, damping: 22 }}
            className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg ${
              idx === carId ? "opacity-100" : "opacity-50 hover:opacity-100"
            }`}
          >
            <Image
              src={c.image || "/tesla.webp"}
              alt={`${c.make} ${c.model}`}
              fill
              sizes="64px"
              className="object-cover"
            />
            {idx === carId && (
              <m.span
                layoutId="carcard-thumb-ring"
                transition={{ type: "spring", stiffness: 480, damping: 28 }}
                className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-red-600"
              />
            )}
          </m.button>
        ))}
      </div>
    </>
  );
};

export default CarCard;
