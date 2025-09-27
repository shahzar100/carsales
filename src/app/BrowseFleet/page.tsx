import React, { Suspense } from "react";
import CarFleetShop from "../../components/Shop/Collection/CarFleetShop";
import Loading from "./Loading";
import clientPromise from "@/backend/mongodb";

interface Car {
  _id: string;
  Name: string;
  Brand: string;
  Year: number;
  Fuel: string;
  Doors: number;
  Colour: string;
  Price: number;
  Mileage: number;
  Image?: string;
}
const convertImageToString = (image: any): string | undefined => {
  // If image is already a string (URL), return it
  if (typeof image === "string") {
    return image;
  }

  // If image is a Buffer or has buffer property
  if (image && image.buffer) {
    try {
      // Convert buffer to base64 data URL
      const buffer = Buffer.from(image.buffer);
      const base64String = buffer.toString("base64");
      return `data:image/jpeg;base64,${base64String}`;
    } catch (error) {
      console.error("Error converting image buffer:", error);
      return undefined;
    }
  }

  // If image is a direct Buffer
  if (Buffer.isBuffer(image)) {
    try {
      const base64String = image.toString("base64");
      return `data:image/jpeg;base64,${base64String}`;
    } catch (error) {
      console.error("Error converting image buffer:", error);
      return undefined;
    }
  }
  return undefined;
};

const getCars = async (): Promise<Car[]> => {
  try {
    const client = await clientPromise;
    const db = client.db("carWebsite");
    const collection = db.collection("cars");

    const cars = await collection.find({}).toArray();

    // Convert MongoDB documents to Car type and serialize ObjectId
    return cars.map((car) => ({
      _id: car._id.toString(),
      Name: car.Name,
      Brand: car.Brand,
      Year: car.Year,
      Fuel: car.Fuel,
      Doors: car.Doors,
      Colour: car.Colour,
      Price: car.Price,
      Mileage: car.Mileage,
      Image: car.Image ? convertImageToString(car.Image) : undefined,
    }));
  } catch (error) {
    console.error("Error fetching cars:", error);
    return [];
  }
};

const ShopPage = async () => {
  const cars = await getCars();

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<Loading />}>
        <CarFleetShop cars={cars} />
      </Suspense>
    </div>
  );
};

export default ShopPage;
