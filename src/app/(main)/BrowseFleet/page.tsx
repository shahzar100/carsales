import React, { Suspense } from "react";
import type { Metadata } from "next";
import Loading from "./Loading";
import { CarInterface } from "@/lib/interfaces";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import BrowseFleetContent from "./BrowseFleetContent";
import { Car, Shield, Clock } from "lucide-react";
import { ServiceHero } from "@/components/Services/Common";

export const metadata: Metadata = {
  title: "Browse Our Fleet",
  description:
    "Explore our handpicked selection of quality vehicles. Filter by make, model, price, and more to find your perfect car. Book a viewing online today.",
  alternates: { canonical: "/BrowseFleet" },
  openGraph: {
    title: "Browse Our Fleet",
    description:
      "Explore our handpicked selection of quality vehicles. Filter by make, model, price, and more.",
    url: "/BrowseFleet",
  },
};

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

  const heroProps = {
    icon: Car,
    iconBgColor: "bg-red-50 text-red-600",
    title: "Browse Our Fleet",
    description:
      "Explore our handpicked selection of quality vehicles. Use the filters below to find your perfect match.",
    badges: [
      { icon: Shield, text: "Quality Assured", color: "text-red-500" },
      { icon: Clock, text: "Book a Viewing Online", color: "text-gray-900" },
      {
        icon: Car,
        text: `${cars.length} Vehicles Available`,
        color: "text-red-700",
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ServiceHero {...heroProps} />

      {/* Main Content */}
      <Suspense fallback={<Loading />}>
        <BrowseFleetContent cars={cars} />
      </Suspense>
    </div>
  );
};

export default BrowseFleetPage;
