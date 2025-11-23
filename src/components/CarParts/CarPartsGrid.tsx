"use client";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import FilterSection from "./FilterSection";

export interface CarPart {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  image: string;
  condition: string;
  compatibility: string;
  description: string;
}

interface CarPartsGridProps {
  parts: CarPart[];
}

const CarPartsGrid: React.FC<CarPartsGridProps> = ({ parts }) => {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");

  // Filter parts based on selected filters
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      const brandMatch = !selectedBrand || part.brand === selectedBrand;
      const categoryMatch =
        !selectedCategory || part.category === selectedCategory;
      const conditionMatch =
        !selectedCondition || part.condition === selectedCondition;

      return brandMatch && categoryMatch && conditionMatch;
    });
  }, [parts, selectedBrand, selectedCategory, selectedCondition]);

  const getConditionBadgeClass = (condition: string) => {
    switch (condition) {
      case "New":
        return "bg-green-100 text-green-800";
      case "Refurbished":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const handleReservePart = (partId: number) => {
    const part = parts.find((p) => p.id === partId);
    if (part) {
      alert(
        `Reservation request for ${part.name} has been submitted! We'll contact you soon.`
      );
    }
  };

  return (
    <>
      {/* Filter Section */}
      <FilterSection
        selectedBrand={selectedBrand}
        selectedCategory={selectedCategory}
        selectedCondition={selectedCondition}
        onBrandChange={setSelectedBrand}
        onCategoryChange={setSelectedCategory}
        onConditionChange={setSelectedCondition}
      />

      {/* Parts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredParts.map((part) => (
          <div
            key={part.id}
            className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            {/* Part Image */}
            <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
              <Image
                src={part.image}
                alt={part.name}
                className="h-full w-full object-cover"
                width={300}
                height={192}
              />
              <div className="absolute top-2 right-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${getConditionBadgeClass(
                    part.condition
                  )}`}
                >
                  {part.condition}
                </span>
              </div>
            </div>

            {/* Part Details */}
            <div className="p-4">
              <div className="mb-2">
                <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                  {part.brand} • {part.category}
                </span>
              </div>

              <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">
                {part.name}
              </h3>

              <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                {part.description}
              </p>

              <div className="mb-3">
                <p className="mb-1 text-xs text-gray-500">Compatible with:</p>
                <p className="text-sm font-medium text-gray-700">
                  {part.compatibility}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-red-600">
                    ${part.price}
                  </span>
                </div>
                <button
                  onClick={() => handleReservePart(part.id)}
                  className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-600"
                >
                  Reserve Part
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredParts.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-2 text-lg text-gray-500">No parts found</div>
          <div className="text-sm text-gray-400">
            Try adjusting your filters to see more results
          </div>
        </div>
      )}
    </>
  );
};

export default CarPartsGrid;
