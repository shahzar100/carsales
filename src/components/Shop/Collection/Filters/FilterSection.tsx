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
    <div className="bg-white rounded-lg shadow-md p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Filter size={20} />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <X size={16} />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min price"
              value={filters.priceFrom || ""}
              onChange={(e) => handleFilterChange("priceFrom", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max price"
              value={filters.priceTo || ""}
              onChange={(e) => handleFilterChange("priceTo", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Brand */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Brand</h3>
          <select
            value={filters.make || ""}
            onChange={(e) => handleFilterChange("make", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <h3 className="font-medium text-gray-700 mb-3">Year</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="From year"
              value={filters.yearFrom || ""}
              onChange={(e) => handleFilterChange("yearFrom", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="To year"
              value={filters.yearTo || ""}
              onChange={(e) => handleFilterChange("yearTo", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Fuel Type */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Fuel Type</h3>
          <select
            value={filters.fuelType || ""}
            onChange={(e) => handleFilterChange("fuelType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <h3 className="font-medium text-gray-700 mb-3">Color</h3>
          <select
            value={filters.color || ""}
            onChange={(e) => handleFilterChange("color", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
