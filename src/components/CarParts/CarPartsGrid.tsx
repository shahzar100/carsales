"use client";
import React, { useState, useMemo } from "react";
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredParts.map((part) => (
          <div
            key={part.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Part Image */}
            <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
              <img
                src={part.image}
                alt={part.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getConditionBadgeClass(
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
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {part.brand} • {part.category}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {part.name}
              </h3>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {part.description}
              </p>

              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Compatible with:</p>
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
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
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
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No parts found</div>
          <div className="text-gray-400 text-sm">
            Try adjusting your filters to see more results
          </div>
        </div>
      )}
    </>
  );
};

export default CarPartsGrid;
