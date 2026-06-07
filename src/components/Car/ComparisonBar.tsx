"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useComparison } from "@/contexts/ComparisonContext";
import { X, Scale, ArrowRight } from "lucide-react";

const ComparisonBar: React.FC = () => {
  const { comparedCars, removeFromCompare, clearComparison } = useComparison();

  if (comparedCars.length === 0) return null;

  return (
    <section
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white/95 shadow-2xl backdrop-blur-md"
      aria-label="Car comparison bar"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: compared cars */}
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex shrink-0 items-center gap-2">
            <Scale className="h-4 w-4 text-red-600" />
            <span className="text-sm font-semibold text-gray-700">
              {comparedCars.length}/3
            </span>
          </div>

          <div className="flex gap-2">
            {comparedCars.map((car) => (
              <div
                key={String(car._id)}
                className="group relative flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 transition-all hover:border-gray-300"
              >
                <div className="relative h-8 w-12 shrink-0 overflow-hidden rounded">
                  <Image
                    src={car.image || "/tesla.webp"}
                    alt={`${car.make} ${car.model}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="hidden sm:block">
                  <p className="max-w-30 truncate text-xs font-semibold text-gray-900">
                    {car.make} {car.model}
                  </p>
                  <p className="text-[10px] text-gray-500">{car.year}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCompare(String(car._id ?? ""))}
                  aria-label={`Remove ${car.make} ${car.model} from comparison`}
                  className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clearComparison}
            className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Clear comparison"
          >
            Clear
          </button>
          <Link
            href="/Compare"
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md active:scale-[0.98]"
          >
            Compare Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ComparisonBar;
