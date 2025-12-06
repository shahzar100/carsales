import Cars from "@/components/Admin/Cars";
import React from "react";
import { CarInterface } from "@/lib/interfaces";
import { getCarsCollection } from "@/lib/models";

export default async function CarsPage() {
  //fetch from mongodb using the proper collection helper
  const getCars = async (): Promise<CarInterface[]> => {
    const carsCollection = await getCarsCollection();
    const cars = await carsCollection.find({}).toArray();
    return cars;
  };

  const cars = await getCars();

  return (
    <div>{cars.length > 0 ? <Cars cars={cars} /> : <p>No cars added.</p>}</div>
  );
}
