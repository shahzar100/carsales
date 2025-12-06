import Cars from "@/components/Admin/Cars";
import React from "react";
import { Car } from "@/lib/interfaces";
import { getCarsCollection } from "@/lib/models";

export default async function CarsPage() {
  //fetch from mongodb using the proper collection helper
  const getCars = async (): Promise<Car[]> => {
    const carsCollection = await getCarsCollection();
    const cars = await carsCollection.find({}).toArray();
    return cars;
  };

  const cars = await getCars();

  return (
    <div>
      <Cars cars={cars} />
    </div>
  );
}
