"use client";
import React from "react";
import {
  Car,
  Calendar,
  DollarSign,
  Fuel,
  Palette,
  Filter,
  X,
} from "lucide-react";
import { useSearchContext } from "@/backend/SearchContext";
import CustomDropdown from "./CustomDropdown";

interface FilterBarProps {
  brands: string[];
  fuelTypes: string[];
  colors: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ brands, fuelTypes, colors }) => {
  const { filters, updateFilters, clearFilters } = useSearchContext();

  const handleFilterChange = (filterType: string, value: string | string[]) => {
    // Handle array values for multi-select
    if (Array.isArray(value)) {
      const filterValue = value.length === 0 ? undefined : value;
      updateFilters({ [filterType]: filterValue });
    } else {
      // Convert empty string to undefined for clearing filters
      const filterValue = value === "" ? undefined : value;

      // Handle numeric filters
      if (
        filterType === "yearFrom" ||
        filterType === "yearTo" ||
        filterType === "priceFrom" ||
        filterType === "priceTo"
      ) {
        updateFilters({
          [filterType]: filterValue ? Number(filterValue) : undefined,
        });
      } else {
        updateFilters({ [filterType]: filterValue });
      }
    }
  };

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== "" && value !== null;
  });

  // Generate year options (from 2010 to current year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2009 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Add "Any year" option
  yearOptions.unshift({ value: "", label: "Any year" });

  // Generate price options
  const priceFromOptions = [
    { value: "", label: "Any price" },
    { value: "5000", label: "$5,000" },
    { value: "10000", label: "$10,000" },
    { value: "15000", label: "$15,000" },
    { value: "20000", label: "$20,000" },
    { value: "30000", label: "$30,000" },
    { value: "50000", label: "$50,000" },
    { value: "75000", label: "$75,000" },
    { value: "100000", label: "$100,000" },
  ];

  const priceToOptions = [
    { value: "", label: "Any price" },
    { value: "15000", label: "$15,000" },
    { value: "25000", label: "$25,000" },
    { value: "35000", label: "$35,000" },
    { value: "50000", label: "$50,000" },
    { value: "75000", label: "$75,000" },
    { value: "100000", label: "$100,000" },
    { value: "150000", label: "$150,000" },
    { value: "200000", label: "$200,000+" },
  ];

  // Transform brands, fuel types, and colors into option format
  const brandOptions = [
    { value: "", label: "Any brand" },
    ...brands.map((brand) => ({ value: brand, label: brand })),
  ];

  const fuelOptions = [
    { value: "", label: "Any fuel type" },
    ...fuelTypes.map((fuel) => ({ value: fuel, label: fuel })),
  ];

  const colorOptions = [
    { value: "", label: "Any color" },
    ...colors.map((color) => ({ value: color, label: color })),
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-full min-w-0 overflow-x-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="text-gray-600" size={16} />
          <h2 className="text-base font-medium text-gray-900">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 
                     hover:bg-red-50 rounded transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-4 w-full">
        <CustomDropdown
          label="Brand"
          options={brandOptions.slice(1)}
          value={
            Array.isArray(filters.make)
              ? filters.make
              : filters.make
              ? [filters.make]
              : []
          }
          onChange={(value) => handleFilterChange("make", value)}
          placeholder="Any brand"
          icon={<Car size={14} />}
          multiSelect={true}
        />

        <CustomDropdown
          label="Year From"
          options={yearOptions}
          value={filters.yearFrom?.toString() || ""}
          onChange={(value) => handleFilterChange("yearFrom", value)}
          placeholder="Any year"
          icon={<Calendar size={14} />}
        />

        <CustomDropdown
          label="Year To"
          options={yearOptions}
          value={filters.yearTo?.toString() || ""}
          onChange={(value) => handleFilterChange("yearTo", value)}
          placeholder="Any year"
          icon={<Calendar size={14} />}
        />

        <CustomDropdown
          label="Price From"
          options={priceFromOptions}
          value={filters.priceFrom?.toString() || ""}
          onChange={(value) => handleFilterChange("priceFrom", value)}
          placeholder="Any price"
          icon={<DollarSign size={14} />}
        />

        <CustomDropdown
          label="Price To"
          options={priceToOptions}
          value={filters.priceTo?.toString() || ""}
          onChange={(value) => handleFilterChange("priceTo", value)}
          placeholder="Any price"
          icon={<DollarSign size={14} />}
        />

        <CustomDropdown
          label="Fuel Type"
          options={fuelOptions.slice(1)}
          value={
            Array.isArray(filters.fuelType)
              ? filters.fuelType
              : filters.fuelType
              ? [filters.fuelType]
              : []
          }
          onChange={(value) => handleFilterChange("fuelType", value)}
          placeholder="Any fuel"
          icon={<Fuel size={14} />}
          multiSelect={true}
        />

        <CustomDropdown
          label="Color"
          options={colorOptions.slice(1)}
          value={
            Array.isArray(filters.color)
              ? filters.color
              : filters.color
              ? [filters.color]
              : []
          }
          onChange={(value) => handleFilterChange("color", value)}
          placeholder="Any color"
          icon={<Palette size={14} />}
          multiSelect={true}
        />
      </div>
    </div>
  );
};

export default FilterBar;
