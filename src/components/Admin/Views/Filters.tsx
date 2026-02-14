"use client";
import React, { useState, useRef, useEffect } from "react";
import { useFilters } from "../../../contexts/FilterContext";
import { CarInterface } from "@/lib/interfaces";

interface FiltersProps {
  totalCount: number;
  filteredCount: number;
  cars: CarInterface[];
}

const Filters: React.FC<FiltersProps> = ({
  totalCount,
  filteredCount,
  cars,
}) => {
  const { state, dispatch } = useFilters();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Get unique values from cars for dropdowns
  const uniqueMakes = [...new Set(cars.map((car) => car.make))].sort();
  const uniqueColours = [...new Set(cars.map((car) => car.colour))].sort();
  const uniqueDoors = [...new Set(cars.map((car) => car.doors))].sort(
    (a, b) => a - b
  );
  const allFeatures = [
    ...new Set(cars.flatMap((car) => car.features || [])),
  ].sort();

  // Close features dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        featuresRef.current &&
        !featuresRef.current.contains(event.target as Node)
      ) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if any filters are active
  const hasActiveFilters =
    state.searchTerm ||
    state.statusFilter !== "all" ||
    state.priceMin !== null ||
    state.priceMax !== null ||
    state.make !== "all" ||
    state.yearMin !== null ||
    state.yearMax !== null ||
    state.mileageMin !== null ||
    state.mileageMax !== null ||
    state.doors !== "all" ||
    state.colour !== "all" ||
    state.features.length > 0;

  const handleNumberInput = (
    value: string,
    action:
      | "SET_PRICE_MIN"
      | "SET_PRICE_MAX"
      | "SET_YEAR_MIN"
      | "SET_YEAR_MAX"
      | "SET_MILEAGE_MIN"
      | "SET_MILEAGE_MAX"
  ) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    dispatch({ type: action, payload: numValue });
  };

  return (
    <div className="flex w-full flex-wrap gap-4 rounded-xl border border-4 border-gray-200 bg-white p-6 shadow-sm">
      {/* Header Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Car Inventory</h2>
        <p className="mt-1 text-sm text-gray-500">
          {filteredCount} of {totalCount} vehicles
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {/* Search Input */}
        <input
          type="text"
          placeholder="🔍 Search cars..."
          value={state.searchTerm}
          onChange={(e) =>
            dispatch({ type: "SET_SEARCH_TERM", payload: e.target.value })
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
        {/* Status Filter */}
        <select
          value={state.statusFilter}
          onChange={(e) =>
            dispatch({ type: "SET_STATUS_FILTER", payload: e.target.value })
          }
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
        {/* Toggle Advanced Filters */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
            showAdvanced
              ? "border-blue-500 bg-blue-50 text-blue-600"
              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {showAdvanced ? "Hide Filters" : "More Filters"}
        </button>
        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={() => dispatch({ type: "RESET_FILTERS" })}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="border-t border-gray-100 bg-gray-50 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Make Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Make
              </label>
              <select
                value={state.make}
                onChange={(e) =>
                  dispatch({ type: "SET_MAKE", payload: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Makes</option>
                {uniqueMakes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Year
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={state.yearMin ?? ""}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, "SET_YEAR_MIN")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={state.yearMax ?? ""}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, "SET_YEAR_MAX")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Price (£)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={state.priceMin ?? ""}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, "SET_PRICE_MIN")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={state.priceMax ?? ""}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, "SET_PRICE_MAX")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Mileage Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Mileage
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={state.mileageMin ?? ""}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, "SET_MILEAGE_MIN")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={state.mileageMax ?? ""}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, "SET_MILEAGE_MAX")
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Doors Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Doors
              </label>
              <select
                value={state.doors}
                onChange={(e) =>
                  dispatch({ type: "SET_DOORS", payload: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                {uniqueDoors.map((doors) => (
                  <option key={doors} value={doors.toString()}>
                    {doors} doors
                  </option>
                ))}
              </select>
            </div>

            {/* Colour Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Colour
              </label>
              <select
                value={state.colour}
                onChange={(e) =>
                  dispatch({ type: "SET_COLOUR", payload: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Colours</option>
                {uniqueColours.map((colour) => (
                  <option key={colour} value={colour}>
                    {colour}
                  </option>
                ))}
              </select>
            </div>

            {/* Features Dropdown */}
            <div className="md:col-span-2" ref={featuresRef}>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Features
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <span className="truncate text-gray-600">
                    {state.features.length === 0
                      ? "Select features..."
                      : `${state.features.length} selected`}
                  </span>
                  <span className="ml-2">{featuresOpen ? "▲" : "▼"}</span>
                </button>
                {featuresOpen && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {allFeatures.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No features available
                      </div>
                    ) : (
                      allFeatures.map((feature) => (
                        <label
                          key={feature}
                          className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={state.features.includes(feature)}
                            onChange={() =>
                              dispatch({
                                type: "TOGGLE_FEATURE",
                                payload: feature,
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Selected Features Tags */}
              {state.features.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {state.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {feature}
                      <button
                        onClick={() =>
                          dispatch({ type: "TOGGLE_FEATURE", payload: feature })
                        }
                        className="ml-1 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
