"use client";
import React, { useEffect } from "react";
import { useViewing } from "@/contexts/ViewingContext";
import CarViewingForm from "./Main/Form/CarViewingForm";
import VehicleDetails from "./Shared/VehicleDetails";
import BookingAuthGate from "./Account/BookingAuthGate";
import type { CarInterface } from "@/lib/interfaces";

interface CarViewingProps {
  /**
   * The car being booked, fetched server-side from the `[_id]` route
   * segment. Passing it as a prop — rather than relying on the in-memory
   * `ViewingContext` — means the page survives a hard refresh, a shared
   * link, a bookmark or a new tab.
   */
  initialCar: CarInterface;
}

const CarViewing: React.FC<CarViewingProps> = ({ initialCar }) => {
  const { updateViewingBooking } = useViewing();

  // Seed the viewing context from the server-fetched car so the booking
  // form (which reads carId / carDetails from context to build its submit
  // payload) has the vehicle even when the page wasn't reached via the
  // in-app "Book a viewing" CTA.
  useEffect(() => {
    updateViewingBooking({
      carId: String(initialCar._id),
      carDetails: {
        make: initialCar.make,
        model: initialCar.model,
        year: initialCar.year,
        price: initialCar.price,
        image: initialCar.image,
        fuel: initialCar.fuel,
        doors: initialCar.doors,
        colour: initialCar.colour,
        mileage: initialCar.mileage,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCar]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <h2 className="section-title text-center">Book Your Car Viewing</h2>

      {/* Car Details Section */}
      <VehicleDetails vehicle={initialCar} />

      {/* Multi-stage Booking Form — account required (BookingAuthGate). */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <BookingAuthGate
          heading="Sign in to book a viewing"
          message="You need an account to book a car viewing — it's quick, and your viewing then shows up in your dashboard."
        >
          <CarViewingForm />
        </BookingAuthGate>
      </div>
    </div>
  );
};

export default CarViewing;
