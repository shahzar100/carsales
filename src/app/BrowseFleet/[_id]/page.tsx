import React from "react";
import CarDisplay from "@/components/Shop/Collection/CarDisplay";
import clientPromise from "@/backend/mongodb";
import { ObjectId } from "mongodb";

interface PageProps {
  params: Promise<{
    _id: string;
  }>;
}

interface CarData {
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

const getCar = async (id: string) => {
  try {
    const client = await clientPromise;
    const db = client.db("carWebsite");

    const collection = db.collection("cars");

    const car = await collection.findOne({ _id: new ObjectId(id) });

    if (!car) {
      return null;
    }

    return {
      ...car,
      _id: car._id.toString(),
      Image: String(car.Image),
    } as CarData;
  } catch (error) {
    console.error("Error fetching car:", error);
    return null; // Return null instead of {}
  }
};

const CarDetailsPage = async ({ params }: PageProps) => {
  const { _id } = await params;
  const car = await getCar(_id);

  // Handle the null case properly
  if (!car) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Car Not Found
          </h1>
          <p className="text-gray-600">
            The car you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rounded-xl bg-gray-50">
      {car && <CarDisplay car={car} />}
    </div>
  );
};

export default CarDetailsPage;
