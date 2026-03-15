"use client";
import React from "react";
import { useSearchContext } from "@/backend/SearchContext";
import { Filter, X } from "lucide-react";
import FilterSelect from "@/components/Helpful/FilterSelect";
import RangeInput from "@/components/Helpful/RangeInput";
import Button from "@/components/Helpful/Buttons/Button";

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

  /** Extract a single string from a filter value that may be string | string[]. */
  const filterString = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return value[0] ?? "all";
    return value || "all";
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
  );

  return (
    <div className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Filter size={20} />
          Filters
        </h2>
        {hasActiveFilters && (
          <Button
            onClick={() => clearFilters()}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-800"
          >
            <X size={16} />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <RangeInput
          label="Price Range"
          minValue={filters.priceFrom ? Number(filters.priceFrom) : null}
          maxValue={filters.priceTo ? Number(filters.priceTo) : null}
          onMinChange={(v) =>
            handleFilterChange("priceFrom", v !== null ? String(v) : "")
          }
          onMaxChange={(v) =>
            handleFilterChange("priceTo", v !== null ? String(v) : "")
          }
          minPlaceholder="Min price"
          maxPlaceholder="Max price"
        />

        {/* Brand */}
        <FilterSelect
          label="Brand"
          value={filterString(filters.make)}
          onChange={(v) => handleFilterChange("make", v === "all" ? "" : v)}
          options={brands.map((b) => ({ value: b, label: b }))}
          placeholder="All brands"
        />

        {/* Year Range */}
        <RangeInput
          label="Year"
          minValue={filters.yearFrom ? Number(filters.yearFrom) : null}
          maxValue={filters.yearTo ? Number(filters.yearTo) : null}
          onMinChange={(v) =>
            handleFilterChange("yearFrom", v !== null ? String(v) : "")
          }
          onMaxChange={(v) =>
            handleFilterChange("yearTo", v !== null ? String(v) : "")
          }
          minPlaceholder="From year"
          maxPlaceholder="To year"
        />

        {/* Fuel Type */}
        <FilterSelect
          label="Fuel Type"
          value={filterString(filters.fuelType)}
          onChange={(v) => handleFilterChange("fuelType", v === "all" ? "" : v)}
          options={fuelTypes.map((f) => ({ value: f, label: f }))}
          placeholder="All fuel types"
        />

        {/* Color */}
        <FilterSelect
          label="Color"
          value={filterString(filters.color)}
          onChange={(v) => handleFilterChange("color", v === "all" ? "" : v)}
          options={colors.map((c) => ({ value: c, label: c }))}
          placeholder="All colors"
        />
      </div>
    </div>
  );
};

export default FilterSection;
