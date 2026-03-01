import React, { Suspense } from "react";
import Loading from "./Loading";
import { CarInterface } from "@/lib/interfaces";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import BrowseFleetContent from "./BrowseFleetContent";
import { Car, Shield, Clock } from "lucide-react";

const getCars = async (): Promise<CarInterface[]> => {
  try {
    const carsCollection = await getCarsCollection();
    const cars = await carsCollection.find({}).toArray();
    return cars.map((car) => serializeDocument(car));
  } catch (error) {
    console.error("Error fetching cars:", error);
    return [];
  }
};

const BrowseFleetPage = async () => {
  const cars = await getCars();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-24">
        {/* Ambient red glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-red-600/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/30">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Browse Our Fleet
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Explore our handpicked selection of quality vehicles. Use the
            filters below to find your perfect match.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-500" />
              Quality Assured
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              Book a Viewing Online
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-red-500" />
              {cars.length} Vehicles Available
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Suspense fallback={<Loading />}>
          <BrowseFleetContent cars={cars} />
        </Suspense>
      </section>
    </div>
  );
};

export default BrowseFleetPage;
