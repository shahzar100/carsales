import React from "react";
import type { Metadata } from "next";
import { CarInterface } from "@/lib/interfaces";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import { ObjectId } from "mongodb";
import CarDetailView from "@/components/Car/CarDetailView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "@/components/SEO/JsonLd";
import { formatPrice, formatMileage } from "@/lib/utils/format";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface PageProps {
  params: Promise<{
    _id: string;
  }>;
}

/**
 * Build a schema.org `Vehicle` payload for a single car.
 *
 * Search engines surface this for "vehicle listing" rich results — title,
 * price, mileage, condition, availability — so it's the difference between
 * a plain blue link and a structured card on the SERP.
 *
 * Reference: https://schema.org/Vehicle
 */
function buildCarJsonLd(car: CarInterface, id: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${car.year} ${car.make} ${car.model}`,
    manufacturer: { "@type": "Organization", name: car.make },
    model: car.model,
    vehicleModelDate: String(car.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.mileage,
      unitCode: "SMI", // statute miles
    },
    vehicleTransmission: car.transmission,
    fuelType: car.fuel,
    color: car.colour,
    numberOfDoors: car.doors,
    ...(car.image ? { image: car.image } : {}),
    ...(car.description ? { description: car.description } : {}),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/BrowseFleet/${id}`,
      priceCurrency: "GBP",
      price: car.price,
      itemCondition: "https://schema.org/UsedCondition",
      availability:
        car.status === "available"
          ? "https://schema.org/InStock"
          : car.status === "reserved"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
    },
  };
}

const getCar = async (id: string): Promise<CarInterface | null> => {
  try {
    const carsCollection = await getCarsCollection();
    const car = await carsCollection.findOne({
      _id: new ObjectId(id) as never,
    });
    if (!car) return null;
    return serializeDocument(car) as CarInterface;
  } catch (error) {
    console.error("Error fetching car:", error);
    return null;
  }
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { _id } = await params;
  const car = await getCar(_id);

  if (!car) {
    return {
      title: "Vehicle Not Found",
      description: "The vehicle you are looking for could not be found.",
      robots: { index: false },
    };
  }

  const title = `${car.year} ${car.make} ${car.model}`;
  const description = `${car.year} ${car.make} ${car.model} — ${car.fuel}, ${car.transmission}, ${formatMileage(car.mileage)} miles. ${car.colour}. Price: ${formatPrice(car.price)}. Book a viewing today.`;

  return {
    title,
    description,
    alternates: { canonical: `/BrowseFleet/${_id}` },
    openGraph: {
      title,
      description,
      url: `/BrowseFleet/${_id}`,
      images: car.image ? [{ url: car.image, alt: title }] : undefined,
    },
  };
}

const CarDetailsPage = async ({ params }: PageProps) => {
  const { _id } = await params;
  const car = await getCar(_id);

  if (!car) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <span className="text-4xl">🚗</span>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Vehicle Not Found
          </h1>
          <p className="mb-8 text-gray-500">
            The vehicle you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href="/BrowseFleet"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse All Vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <JsonLd data={buildCarJsonLd(car, _id)} />
      <CarDetailView car={car} />
    </>
  );
};

export default CarDetailsPage;
