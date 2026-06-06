"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useComparison } from "@/contexts/ComparisonContext";
import {
  Car,
  Fuel,
  Gauge,
  Cog,
  DoorOpen,
  Palette,
  Calendar,
  X,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { CarInterface } from "@/lib/interfaces";

// Constructing Intl.NumberFormat is expensive; build each once at module scope.
const GBP_FORMAT = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const MILEAGE_FORMAT = new Intl.NumberFormat("en-GB");

const formatPrice = (price: number) => GBP_FORMAT.format(price);

const formatMileage = (mileage: number) => MILEAGE_FORMAT.format(mileage);

const CompareContent: React.FC = () => {
  const { comparedCars, removeFromCompare, clearComparison } = useComparison();

  // Check if values differ across compared cars
  const valuesAreDifferent = (
    getter: (car: CarInterface) => string | number
  ) => {
    if (comparedCars.length < 2) return false;
    const values = comparedCars.map(getter);
    return !values.every((v) => v === values[0]);
  };

  const highlightClass = (getter: (car: CarInterface) => string | number) =>
    valuesAreDifferent(getter) ? "bg-amber-50 ring-1 ring-amber-200" : "";

  // Gather all unique features across compared cars
  const allFeatures = Array.from(
    new Set(comparedCars.flatMap((car) => car.features || []))
  ).sort();

  /* ========================= EMPTY STATE ========================= */
  if (comparedCars.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
          <Car className="h-10 w-10 text-gray-300" />
        </div>
        <h2 className="section-title mt-6">No cars to compare</h2>
        <p className="description mt-2 max-w-md text-center">
          Browse our fleet and add up to 3 cars to compare them side by side.
        </p>
        <Link
          href="/BrowseFleet"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md"
        >
          Browse Fleet
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ======================== SPEC ROWS ======================== */
  const specRows: {
    label: string;
    icon: React.ElementType;
    getter: (car: CarInterface) => string | number;
    format?: (val: string | number) => string;
  }[] = [
    {
      label: "Price",
      icon: Car,
      getter: (car) => car.price,
      format: (v) => formatPrice(Number(v)),
    },
    {
      label: "Year",
      icon: Calendar,
      getter: (car) => car.year,
    },
    {
      label: "Mileage",
      icon: Gauge,
      getter: (car) => car.mileage,
      format: (v) => `${formatMileage(Number(v))} miles`,
    },
    {
      label: "Fuel",
      icon: Fuel,
      getter: (car) => car.fuel,
    },
    {
      label: "Transmission",
      icon: Cog,
      getter: (car) => car.transmission,
    },
    {
      label: "Doors",
      icon: DoorOpen,
      getter: (car) => car.doors,
      format: (v) => `${v} doors`,
    },
    {
      label: "Colour",
      icon: Palette,
      getter: (car) => car.colour,
    },
  ];

  /* ==================== MOBILE: STACKED CARDS ==================== */
  // Plain JSX values, not nested components: defining `() => (...)` components
  // inside CompareContent and rendering them as <MobileView/> minted a new
  // component identity every render, remounting the whole subtree (images
  // reloaded/flickered on every comparison change). Inlining the JSX keeps it
  // part of this component's own render — no remount.
  const mobileView = (
    <div className="flex flex-col gap-6 lg:hidden">
      {comparedCars.map((car) => (
        <div key={String(car._id)} className="card overflow-hidden">
          {/* Image */}
          <div className="relative aspect-16/10 w-full">
            <Image
              src={car.image || "/tesla.webp"}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
            <button
              type="button"
              onClick={() => removeFromCompare(String(car._id ?? ""))}
              aria-label={`Remove ${car.make} ${car.model} from comparison`}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
            <h3 className="heading-3">
              {car.year} {car.make} {car.model}
            </h3>
            <p className="mt-1 text-xl font-extrabold text-red-600">
              {formatPrice(car.price)}
            </p>

            {/* Specs */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {specRows.slice(2).map((spec) => {
                const raw = spec.getter(car);
                const display = spec.format ? spec.format(raw) : String(raw);
                return (
                  <div
                    key={spec.label}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <spec.icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-medium uppercase text-gray-400">
                        {spec.label}
                      </p>
                      <p className="text-xs font-semibold text-gray-900">
                        {display}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Features
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {car.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-100"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  /* ================= DESKTOP: SIDE-BY-SIDE TABLE ================= */
  const desktopView = (
    <div className="hidden lg:block">
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-40 bg-gray-50 p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Specification
              </th>
              {comparedCars.map((car) => (
                <th key={String(car._id)} className="p-4 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-32 w-full overflow-hidden rounded-xl">
                      <Image
                        src={car.image || "/tesla.webp"}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover"
                        sizes="300px"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCompare(String(car._id ?? ""))}
                        aria-label={`Remove ${car.make} ${car.model} from comparison`}
                        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">
                        {car.make} {car.model}
                      </p>
                      <p className="text-sm text-gray-500">{car.year}</p>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {specRows.map((spec) => (
              <tr
                key={spec.label}
                className="transition-colors hover:bg-gray-50/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <spec.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      {spec.label}
                    </span>
                  </div>
                </td>
                {comparedCars.map((car) => {
                  const raw = spec.getter(car);
                  const display = spec.format ? spec.format(raw) : String(raw);
                  return (
                    <td
                      key={String(car._id)}
                      className={`px-4 py-3 text-center text-sm font-semibold text-gray-900 ${highlightClass(spec.getter)}`}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Features row */}
            {allFeatures.length > 0 && (
              <tr className="transition-colors hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Features
                    </span>
                  </div>
                </td>
                {comparedCars.map((car) => (
                  <td key={String(car._id)} className="px-4 py-3">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {allFeatures.map((f) => {
                        const has = car.features?.includes(f);
                        return (
                          <span
                            key={f}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              has
                                ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                                : "bg-gray-100 text-gray-400 line-through"
                            }`}
                          >
                            {f}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header actions */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Comparing {comparedCars.length} vehicle
          {comparedCars.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clearComparison}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            Clear All
          </button>
          <Link
            href="/BrowseFleet"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            Add More
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {mobileView}
      {desktopView}
    </div>
  );
};

export default CompareContent;
