/**
 * FILTER BAR COMPONENT (333 lines)
 *
 * SUMMARY:
 * Complex filtering interface for the car shop/collection page.
 * Provides multiple filter options (brand, fuel, color, price, year) with modal and inline views.
 *
 * MAIN FEATURES:
 * - Multi-filter car search (brand, fuel type, color, price range, year)
 * - Responsive design with mobile modal and desktop inline filters
 * - Real-time search with URL parameter sync
 * - Filter state management via SearchContext
 * - Body scroll prevention when modal is open
 *
 * TECHNICAL DEBT ISSUES:
 * - Massive component handling multiple concerns
 * - Complex responsive logic mixed with filter logic
 * - Duplicate filter rendering for mobile/desktop
 * - Heavy DOM manipulation for scroll prevention
 * - Tightly coupled to SearchContext implementation
 * - No proper accessibility features
 *
 * REFACTORING NEEDED:
 * - Split into separate Mobile/Desktop filter components
 * - Extract scroll prevention to custom hook
 * - Create reusable filter input components
 * - Implement proper ARIA labels and keyboard navigation
 * - Use CSS-only solutions for responsive behavior where possible
 * - Abstract filter logic into composable hooks
 */

"use client";
import React, { useState, useEffect } from "react";
import {
  Car,
  Calendar,
  DollarSign,
  Fuel,
  Palette,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import { useSearchContext } from "@/backend/SearchContext";
import CustomDropdown from "./CustomDropdown";
import Button from "@/components/Helpful/Buttons/Button";

interface FilterBarProps {
  brands: string[];
  fuelTypes: string[];
  colors: string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ brands, fuelTypes, colors }) => {
  const { filters, updateFilters, clearFilters } = useSearchContext();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isFilterModalOpen) {
      // Store original scroll position
      const scrollY = window.scrollY;

      // Prevent scrolling
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Restore scrolling
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }

    // Cleanup function for when component unmounts or modal closes
    return () => {
      if (isFilterModalOpen) {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
      }
    };
  }, [isFilterModalOpen]);

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
    { value: "5000", label: "£5,000" },
    { value: "10000", label: "£10,000" },
    { value: "15000", label: "£15,000" },
    { value: "20000", label: "£20,000" },
    { value: "30000", label: "£30,000" },
    { value: "50000", label: "£50,000" },
    { value: "75000", label: "£75,000" },
    { value: "100000", label: "£100,000" },
  ];

  const priceToOptions = [
    { value: "", label: "Any price" },
    { value: "15000", label: "£15,000" },
    { value: "25000", label: "£25,000" },
    { value: "35000", label: "£35,000" },
    { value: "50000", label: "£50,000" },
    { value: "75000", label: "£75,000" },
    { value: "100000", label: "£100,000" },
    { value: "150000", label: "£150,000" },
    { value: "200000", label: "£200,000+" },
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

  const renderComponents = () => {
    return (
      <div className="flex w-full flex-col gap-4 lg:flex-row">
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

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

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
    );
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Filter className="text-gray-600" size={20} />
            <span className="text-base font-medium text-gray-900">Filters</span>
            {hasActiveFilters && (
              <span className="bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white rounded-full">
                Active
              </span>
            )}
          </div>
          <ChevronDown className="text-gray-400" size={20} />
        </button>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-medium text-gray-900">
            <Filter className="text-gray-600" size={16} />
            Filters
          </h2>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-800"
            >
              <X size={12} />
              Clear
            </Button>
          )}
        </div>

        {renderComponents()}
      </div>

      {/* Mobile Filter Modal */}
      {isFilterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end overflow-y-auto bg-black/50 lg:hidden"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <h2 className="heading-3 flex items-center gap-2">
                <Filter className="text-gray-600" size={20} />
                Filters
              </h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
                aria-label="Close filters"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {renderComponents()}

              <div className="sticky bottom-0 flex gap-3 border-t border-gray-200 bg-white pt-4">
                {hasActiveFilters && (
                  <Button
                    onClick={() => {
                      clearFilters();
                      setIsFilterModalOpen(false);
                    }}
                    variant="outline"
                    size="lg"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  onClick={() => setIsFilterModalOpen(false)}
                  size="lg"
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterBar;
