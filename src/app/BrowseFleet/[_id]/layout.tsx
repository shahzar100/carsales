import React from "react";
import clientPromise from "@/backend/mongodb";
import { ObjectId } from "mongodb";
import CarBooking from "@/components/Shop/Collection/CarBooking";

interface LayoutProps {
  children: React.ReactNode;
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
    return null;
  }
};

export default async function CarLayout({ children, params }: LayoutProps) {
  const { _id } = await params;
  const car = await getCar(_id);

  return (
    <div className="relative overflow-y-auto">
      {/* You can use car data here for layout-specific elements */}
      {car && (
        <>
          <div className="bg-white shadow-sm">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-8">
              <div>
                <h1 className="mb-1 text-2xl font-bold text-gray-900 lg:mb-2 lg:text-5xl">
                  {car.Year} {car.Brand} {car.Name}
                </h1>
                <p className="text-sm text-gray-600 lg:text-lg">
                  {car.Colour} • {car.Doors} doors • {car.Fuel}
                </p>
              </div>
              <div className="text-left lg:text-right">
                <p className="mb-0.5 text-xs text-gray-500 lg:mb-1 lg:text-sm">
                  Price
                </p>
                <p className="text-2xl font-bold text-gray-900 lg:text-5xl">
                  £{car.Price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-5xl p-8">{children}</div>

          <CarBooking car={car} />
        </>
      )}
    </div>
  );
}
