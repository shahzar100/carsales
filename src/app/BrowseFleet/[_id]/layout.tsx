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
    <div className="overflow-y-auto relative">
      {/* You can use car data here for layout-specific elements */}
      {car && (
        <>
          <div className="bg-white shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
              <div>
                <h1 className="text-2xl lg:text-5xl font-bold text-gray-900 mb-1 lg:mb-2">
                  {car.Year} {car.Brand} {car.Name}
                </h1>
                <p className="text-sm lg:text-lg text-gray-600">
                  {car.Colour} • {car.Doors} doors • {car.Fuel}
                </p>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-xs lg:text-sm text-gray-500 mb-0.5 lg:mb-1">
                  Price
                </p>
                <p className="text-2xl lg:text-5xl font-bold text-gray-900">
                  £{car.Price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 max-w-5xl mx-auto">{children}</div>

          <CarBooking car={car} />
        </>
      )}
    </div>
  );
}
