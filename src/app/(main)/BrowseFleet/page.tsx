import React, { Suspense } from "react";
import type { Metadata } from "next";
import type { Filter, Document } from "mongodb";
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

export const revalidate = 60;

interface FleetFacets {
  makes: string[];
  colours: string[];
  doors: number[];
  features: string[];
}

interface FleetPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Only expose complete listings. `$exists` alone would still allow null and
 * empty-string values, so every required field is checked for a real,
 * non-blank value. `$type: "number"` covers int/long/double/decimal, so it
 * doesn't wrongly exclude a car just because a number was inserted as a
 * different BSON numeric subtype.
 */
const mqlRequiredFieldsFilter: Filter<CarInterface> = {
  status: "available",
  $and: [
    { make: { $type: "string", $regex: /\S/ } },
    { model: { $type: "string", $regex: /\S/ } },
    { fuel: { $type: "string", $regex: /\S/ } },
    { transmission: { $type: "string", $regex: /\S/ } },
    { colour: { $type: "string", $regex: /\S/ } },
    { year: { $type: "int" } },
    { price: { $type: "int" } },
    { mileage: { $type: "int" } },
    { doors: { $type: "int" } },
  ],
};

/** Reusable $match stage enforcing the same completeness rules post-$search. */
const requiredFieldsMatchStage = { $match: mqlRequiredFieldsFilter };

/**
 * Atlas Search only understands search operators inside `compound.filter`
 * (text, equals, range, exists, etc.) — NOT aggregation stages like $match.
 * Use `equals` if `status` is indexed as a string/token field in the Atlas
 * Search index; fall back to `text` only if it's indexed as analyzed text.
 */
function buildSearchStage(searchTerm: string) {
  return {
    $search: {
      index: "default",
      compound: {
        must: [{ text: { query: searchTerm, path: { wildcard: "*" } } }],
        filter: [{ text: { query: "available", path: "status" } }],
      },
    },
  };
}

/**
 * Safely normalizes Next.js searchParams values into a single string.
 */
function getSingleSearchParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

/**
 * Extracts distinct facet values from complete, available listings only.
 */
async function getFacets(searchTerm: string): Promise<FleetFacets> {
  const cars = await getCarsCollection();
  const sanitizedSearch = searchTerm.trim();

  const pipeline: Document[] = sanitizedSearch
    ? [buildSearchStage(sanitizedSearch), requiredFieldsMatchStage]
    : [requiredFieldsMatchStage];

  const docs = await cars.aggregate(pipeline).toArray();

  const makes = Array.from(
    new Set(docs.map((c) => c.make).filter(Boolean))
  ).sort() as string[];
  const colours = Array.from(
    new Set(docs.map((c) => c.colour).filter(Boolean))
  ).sort() as string[];
  const doors = Array.from(
    new Set(docs.map((c) => c.doors).filter((d) => typeof d === "number"))
  ).sort((a, b) => a - b) as number[];
  const features = Array.from(
    new Set(
      docs.flatMap((c) =>
        (Array.isArray(c.features) ? c.features : []).filter(Boolean)
      )
    )
  ).sort() as string[];

  return { makes, colours, doors, features };
}

export default async function BrowseFleetPage({
  searchParams,
}: FleetPageProps) {
  const params = await searchParams;
  const searchTerm = getSingleSearchParam(params.search).trim();

  const filters = parseCarFilters(params);
  const mongoFilter: Filter<CarInterface> = {
    $and: [mqlRequiredFieldsFilter, buildCarMongoFilter(filters)],
  };
  const sort = buildCarSort(filters.sort);
  const skip = (filters.page - 1) * filters.perPage;

  const carsColl = await getCarsCollection();

  let carsPromise: Promise<Document[]>;
  let totalPromise: Promise<number>;

  if (searchTerm) {
    const searchStage = buildSearchStage(searchTerm);

    carsPromise = carsColl
      .aggregate([
        searchStage,
        requiredFieldsMatchStage,
        { $sort: sort },
        { $skip: skip },
        { $limit: filters.perPage },
      ])
      .toArray();

    totalPromise = carsColl
      .aggregate([searchStage, requiredFieldsMatchStage, { $count: "total" }])
      .toArray()
      .then((res) => res[0]?.total || 0);
  } else {
    carsPromise = carsColl
      .find(mongoFilter)
      .sort(sort)
      .skip(skip)
      .limit(filters.perPage)
      .toArray();

    totalPromise = carsColl.countDocuments(mongoFilter);
  }

  const [cars, total, facets, totalAvailable] = await Promise.all([
    carsPromise,
    totalPromise,
    getFacets(searchTerm),
    carsColl.countDocuments(mqlRequiredFieldsFilter),
  ]);

  const serialized = cars.map((c) => serializeDocument(c) as CarInterface);

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
