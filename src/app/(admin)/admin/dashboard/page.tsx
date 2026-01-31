import React from "react";
import { CarInterface, CarViewingBooking } from "@/lib/interfaces";
import {
  getCarsCollection,
  getCarViewingBookingsCollection,
  serializeDocument,
} from "@/lib/models";
import CarView from "@/components/Admin/Views/CarView";

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

  return (
    <>
      <CarView cars={cars} />
    </>
  );
}
