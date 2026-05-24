import React from "react";
import { CarInterface, CarViewingBooking } from "@/lib/interfaces";
import {
  getCarsCollection,
  getCarViewingBookingsCollection,
  serializeDocument,
} from "@/lib/models";
import CarView from "@/components/Car/CarView";

export default async function CarsPage() {
  const getCars = async (): Promise<CarInterface[]> => {
    const carsCollection = await getCarsCollection();
    const cars = await carsCollection.find({}).toArray();
    return cars.map((car) => serializeDocument(car));
  };

  const getBookings = async (): Promise<CarViewingBooking[]> => {
    const bookingsCollection = await getCarViewingBookingsCollection();
    const bookings = await bookingsCollection.find({}).toArray();
    return bookings.map((booking) => serializeDocument(booking));
  };

  const cars = await getCars();
  const bookings = await getBookings();
  return (
    <>
      <div className="mb-4 flex justify-end">
        <a
          href="/api/admin/cars/export"
          download
          data-testid="export-cars-csv"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>
      <CarView bookings={bookings} cars={cars} />
    </>
  );
}
