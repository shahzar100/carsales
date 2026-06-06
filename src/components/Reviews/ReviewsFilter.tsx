"use client";

import React, { useState } from "react";

const SERVICE_TYPES = [
  { value: "all", label: "All" },
  { value: "car-purchase", label: "Car Purchase" },
  { value: "service", label: "Service" },
  { value: "viewing", label: "Viewing" },
  { value: "detailing", label: "Detailing" },
  { value: "tinting", label: "Tinting" },
  { value: "recovery", label: "Recovery" },
];

interface ReviewsFilterProps {
  onFilterChange: (serviceType: string) => void;
}

const ReviewsFilter: React.FC<ReviewsFilterProps> = ({ onFilterChange }) => {
  const [active, setActive] = useState("all");

  const handleFilter = (value: string) => {
    setActive(value);
    onFilterChange(value);
  };

  return (
    <div
      className="mb-8 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter reviews by service type"
    >
      {SERVICE_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          role="tab"
          aria-selected={active === type.value}
          onClick={() => handleFilter(type.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active === type.value
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
};

export default ReviewsFilter;
