import React, { Suspense } from "react";
import type { Metadata } from "next";
import Loading from "./Loading";
import { CarInterface } from "@/lib/interfaces";
import { getCarsCollection, serializeDocument } from "@/lib/models";
import BrowseFleetContent from "./BrowseFleetContent";
import { Car, Shield, Clock } from "lucide-react";
import { ServiceHero } from "@/components/Services/Common";
import { Breadcrumb } from "@/components/SEO/Breadcrumb";
import {
  parseCarFilters,
  buildCarMongoFilter,
  buildCarSort,
} from "@/lib/utils/buildCarFilter";

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

// (#27) Revalidate the fleet listing every 60 seconds. Admin mutations
// also call revalidatePath('/BrowseFleet') so changes are visible without
// waiting for the timer.
export const revalidate = 60;

interface FleetFacets {
  makes: string[];
  colours: string[];
  doors: number[];
  features: string[];
}

/**
 * (#19) Fetch the facets the filter UI needs — unique makes, colours,
 * etc. These come from the full dataset, NOT the filtered set, so the
 * dropdowns don't shrink as the user narrows their search.
 *
 * Restricted to `status: "available"` because customers shouldn't see
 * options that only exist in sold/reserved listings.
 */
async function getFacets(): Promise<FleetFacets> {
  const cars = await getCarsCollection();
  const docs = await cars
    .find(
      { status: "available" },
      {
        projection: {
          make: 1,
          colour: 1,
          doors: 1,
          features: 1,
        },
      }
    )
    .toArray();

  const makes = Array.from(new Set(docs.map((c) => c.make))).sort();
  const colours = Array.from(new Set(docs.map((c) => c.colour))).sort();
  const doors = Array.from(new Set(docs.map((c) => c.doors))).sort(
    (a, b) => a - b
  );
  const features = Array.from(
    new Set(docs.flatMap((c) => c.features ?? []))
  ).sort();
  return { makes, colours, doors, features };
}

interface FleetPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * (#19) BrowseFleet — DB-side filtering, URL-driven state.
 *
 * Previously this fetched the entire car collection and let the client
 * filter it in JS. That's fine at 50 cars; at 500+ it ships hundreds of
 * KB of unused data on every request. Now the URL is the source of
 * truth: filters are parsed server-side, MongoDB returns only the
 * matching page, and the client just renders.
 *
 * Side benefits:
 *   - Shareable filter URLs (`/BrowseFleet?make=BMW&priceMax=20000`)
 *   - Real pagination instead of `.slice()` on the client
 *   - Indexable filter combos for SEO once we add canonical handling
 */
export default async function BrowseFleetPage({
  searchParams,
}: FleetPageProps) {
  const params = await searchParams;
  const filters = parseCarFilters(params);
  const mongoFilter = buildCarMongoFilter(filters);
  const sort = buildCarSort(filters.sort);
  const skip = (filters.page - 1) * filters.perPage;

  const carsColl = await getCarsCollection();
  const [cars, total, facets, totalAvailable] = await Promise.all([
    carsColl
      .find(mongoFilter)
      .sort(sort)
      .skip(skip)
      .limit(filters.perPage)
      .toArray(),
    carsColl.countDocuments(mongoFilter),
    getFacets(),
    carsColl.countDocuments({ status: "available" }),
  ]);

  const serialized = cars.map(
    (c) => serializeDocument(c) as CarInterface
  );

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
        text: `${totalAvailable} Vehicles Available`,
        color: "text-red-700",
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb
        items={[
          { name: "Home", url: "/" },
          { name: "Browse Fleet", url: "/BrowseFleet" },
        ]}
      />
      <ServiceHero {...heroProps} />

      <Suspense fallback={<Loading />}>
        <BrowseFleetContent
          cars={serialized}
          facets={facets}
          filters={filters}
          totalMatching={total}
          totalAvailable={totalAvailable}
        />
      </Suspense>
    </div>
  );
}
