"use client";
import React from "react";
import { useSearchContext } from "@/backend/SearchContext";
import { Filter, X } from "lucide-react";

interface FilterSectionProps {
  brands: string[];
  fuelTypes: string[];
  colors: string[];
}

const FilterSection: React.FC<FilterSectionProps> = ({
  brands,
  fuelTypes,
  colors,
}) => {
  const { filters, updateFilters, clearFilters } = useSearchContext();

  const handleFilterChange = (filterType: string, value: string) => {
    updateFilters({ [filterType]: value });
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
  );

  return (
    <div className="h-fit rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Filter size={20} />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
          >
            <X size={16} />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <h3 className="mb-3 font-medium text-gray-700">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min price"
              value={filters.priceFrom || ""}
              onChange={(e) => handleFilterChange("priceFrom", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max price"
              value={filters.priceTo || ""}
              onChange={(e) => handleFilterChange("priceTo", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Brand */}
        <div>
          <h3 className="mb-3 font-medium text-gray-700">Brand</h3>
          <select
            value={filters.make || ""}
            onChange={(e) => handleFilterChange("make", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Year Range */}
        <div>
          <h3 className="mb-3 font-medium text-gray-700">Year</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="From year"
              value={filters.yearFrom || ""}
              onChange={(e) => handleFilterChange("yearFrom", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="To year"
              value={filters.yearTo || ""}
              onChange={(e) => handleFilterChange("yearTo", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Fuel Type */}
        <div>
          <h3 className="mb-3 font-medium text-gray-700">Fuel Type</h3>
          <select
            value={filters.fuelType || ""}
            onChange={(e) => handleFilterChange("fuelType", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All fuel types</option>
            {fuelTypes.map((fuel) => (
              <option key={fuel} value={fuel}>
                {fuel}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <h3 className="mb-3 font-medium text-gray-700">Color</h3>
          <select
            value={filters.color || ""}
            onChange={(e) => handleFilterChange("color", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All colors</option>
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
