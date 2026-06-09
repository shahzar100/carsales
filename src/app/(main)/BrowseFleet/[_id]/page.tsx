import React, { cache } from "react";
import type { Metadata } from "next";
import { CarInterface } from "@/lib/interfaces";
import { getCarById, getCarsCollection, serializeDocument } from "@/lib/models";
import { ObjectId } from "mongodb";
import CarDetailView from "@/components/Car/CarDetailView";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/SEO/JsonLd";
import { Breadcrumb } from "@/components/SEO/Breadcrumb";
import { formatPrice, formatMileage } from "@/lib/utils/format";
import { logError } from "@/lib/utils/observability";
import { getBusinessInfo } from "@/lib/utils/businessInfo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// (#27) Revalidate car detail pages every 5 minutes; admin mutations
// call revalidatePath for instant invalidation when something changes.
export const revalidate = 300;

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
function buildCarJsonLd(car: CarInterface, id: string, businessName: string) {
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
      // (#22) Naming the seller as an AutoDealer is what unlocks the
      // "vehicle listing" rich result. Without it Google falls back to a
      // plain product card.
      seller: {
        "@type": "AutoDealer",
        name: businessName,
        url: siteUrl,
      },
    },
  };
}

// Wrapped in React.cache so generateMetadata() and the page body — both
// of which fetch the same car — share a single Mongo round-trip per render.
const getCar = cache((id: string) => getCarById(id, "BrowseFleet/[_id]"));

// Similar cars: same fuel type, available, excluding the current car.
// Falls back to "any available car" if there aren't enough matches.
const getSimilarCars = async (
  car: CarInterface,
  id: string
): Promise<CarInterface[]> => {
  try {
    const carsCollection = await getCarsCollection();
    const matchByFuel = await carsCollection
      .find({
        _id: { $ne: new ObjectId(id) as never },
        status: "available",
        fuel: car.fuel,
      })
      .limit(4)
      .toArray();
    if (matchByFuel.length >= 4) {
      return matchByFuel.map((c) => serializeDocument(c) as CarInterface);
    }
    const fallback = await carsCollection
      .find({
        _id: { $ne: new ObjectId(id) as never },
        status: "available",
      })
      .limit(4)
      .toArray();
    return fallback.map((c) => serializeDocument(c) as CarInterface);
  } catch (error) {
    logError(error, { context: "BrowseFleet/[_id].getSimilarCars" });
    return [];
  }
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { _id } = await params;
  const [car, { businessName }] = await Promise.all([
    getCar(_id),
    getBusinessInfo(),
  ]);

  if (!car) {
    return {
      title: "Vehicle Not Found",
      description: "The vehicle you are looking for could not be found.",
      robots: { index: false },
    };
  }

  const title = `${car.year} ${car.make} ${car.model}`;
  const description = `${car.year} ${car.make} ${car.model} — ${car.fuel}, ${car.transmission}, ${formatMileage(car.mileage)} miles. ${car.colour}. Price: ${formatPrice(car.price)}. Book a viewing today.`;

  // (#23) Always supply an OG image. If the car has no photo we fall
  // back to the static brand image so WhatsApp/Facebook never render a
  // blank preview card.
  const ogImage = car.image
    ? { url: car.image, alt: title }
    : { url: "/car.jpg", alt: businessName };

  return {
    title,
    description,
    alternates: { canonical: `/BrowseFleet/${_id}` },
    openGraph: {
      title,
      description,
      url: `/BrowseFleet/${_id}`,
      images: [ogImage],
    },
  };
}

const CarDetailsPage = async ({ params }: PageProps) => {
  const { _id } = await params;
  const [car, { businessName }] = await Promise.all([
    getCar(_id),
    getBusinessInfo(),
  ]);
  const similar = car ? await getSimilarCars(car, _id) : [];

  // Real 404 (not a soft-404 with HTTP 200) so dead listing URLs aren't
  // reported as live by crawlers/monitoring. Renders the global not-found.tsx.
  // Matches the sibling /Booking/[_id] behaviour.
  if (!car) {
    notFound();
  }

  return (
    <>
      <JsonLd data={buildCarJsonLd(car, _id, businessName)} />
      {/* (#22) BreadcrumbList rich result — appears as the SERP slug. */}
      <Breadcrumb
        items={[
          { name: "Home", url: "/" },
          { name: "Browse Fleet", url: "/BrowseFleet" },
          {
            name: `${car.year} ${car.make} ${car.model}`,
            url: `/BrowseFleet/${_id}`,
          },
        ]}
      />
      <CarDetailView car={car} similar={similar} />
    </>
  );
};

export default CarDetailsPage;
