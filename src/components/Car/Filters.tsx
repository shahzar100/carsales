"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFilters } from "@/contexts/FilterContext";
import { CarInterface } from "@/lib/interfaces";
import Button from "@/components/Helpful/Buttons/Button";
import RangeInput from "@/components/Helpful/RangeInput";
import FilterSelect from "@/components/Helpful/FilterSelect";
import CarFeatures from "@/components/Helpful/CarFeatures";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

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

  // Unique values for dropdowns
  const uniqueMakes = [...new Set(cars.map((c) => c.make))].sort();
  const uniqueColours = [...new Set(cars.map((c) => c.colour))].sort();
  const uniqueDoors = [...new Set(cars.map((c) => c.doors))].sort(
    (a, b) => a - b
  );
  const allFeatures = [
    ...new Set(cars.flatMap((c) => c.features || [])),
  ].sort();

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

  const activeCount = [
    state.searchTerm,
    state.statusFilter !== "all",
    state.priceMin !== null || state.priceMax !== null,
    state.make !== "all",
    state.yearMin !== null || state.yearMax !== null,
    state.mileageMin !== null || state.mileageMax !== null,
    state.doors !== "all",
    state.colour !== "all",
    state.features.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-red-500 to-red-600 shadow-sm">
            <SlidersHorizontal size={16} className="text-white" />
          </div>
          <div>
            <h2 className="heading-4 text-sm">Filters</h2>
            <p className="caption">
              {filteredCount} of {totalCount} vehicles
              <AnimatePresence>
                {activeCount > 0 && (
                  <motion.span
                    key={activeCount}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 480, damping: 20 }}
                    className="badge-sm badge-brand ml-1.5 inline-flex"
                  >
                    {activeCount} active
                  </motion.span>
                )}
              </AnimatePresence>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant={showAdvanced ? "primary" : "outline"}
            disabled={false}
          >
            <SlidersHorizontal size={14} />
            <span className="text-sm">{showAdvanced ? "Less" : "More"}</span>
          </Button>
          {hasActiveFilters && (
            <Button
              onClick={() => dispatch({ type: "RESET_FILTERS" })}
              variant="ghost"
              disabled={false}
            >
              <RotateCcw size={14} className="text-red-500" />
            </Button>
          )}
        </div>
      </div>

      {/* Primary Filters */}
      <div className="section-muted">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            label="Status"
            value={state.statusFilter}
            onChange={(v) =>
              dispatch({ type: "SET_STATUS_FILTER", payload: v })
            }
            options={[
              { value: "available", label: "Available" },
              { value: "reserved", label: "Reserved" },
              { value: "sold", label: "Sold" },
            ]}
            placeholder="All Statuses"
          />

          <FilterSelect
            label="Make"
            value={state.make}
            onChange={(v) => dispatch({ type: "SET_MAKE", payload: v })}
            options={uniqueMakes.map((m) => ({ value: m, label: m }))}
            placeholder="All Makes"
          />

          <RangeInput
            label="Price (£)"
            minValue={state.priceMin}
            maxValue={state.priceMax}
            onMinChange={(v) => dispatch({ type: "SET_PRICE_MIN", payload: v })}
            onMaxChange={(v) => dispatch({ type: "SET_PRICE_MAX", payload: v })}
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            key="advanced"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="section divider">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <RangeInput
                  label="Year"
                  minValue={state.yearMin}
                  maxValue={state.yearMax}
                  onMinChange={(v) =>
                    dispatch({ type: "SET_YEAR_MIN", payload: v })
                  }
                  onMaxChange={(v) =>
                    dispatch({ type: "SET_YEAR_MAX", payload: v })
                  }
                  minPlaceholder="From"
                  maxPlaceholder="To"
                />

                <RangeInput
                  label="Mileage"
                  minValue={state.mileageMin}
                  maxValue={state.mileageMax}
                  onMinChange={(v) =>
                    dispatch({ type: "SET_MILEAGE_MIN", payload: v })
                  }
                  onMaxChange={(v) =>
                    dispatch({ type: "SET_MILEAGE_MAX", payload: v })
                  }
                />

                <FilterSelect
                  label="Doors"
                  value={state.doors}
                  onChange={(v) => dispatch({ type: "SET_DOORS", payload: v })}
                  options={uniqueDoors.map((d) => ({
                    value: d.toString(),
                    label: `${d} doors`,
                  }))}
                  placeholder="Any"
                />

                <FilterSelect
                  label="Colour"
                  value={state.colour}
                  onChange={(v) => dispatch({ type: "SET_COLOUR", payload: v })}
                  options={uniqueColours.map((c) => ({ value: c, label: c }))}
                  placeholder="All Colours"
                />

                {/* Features Select Buttons */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <CarFeatures
                    allFeatures={allFeatures}
                    selectedFeatures={state.features}
                    onToggle={(feature) =>
                      dispatch({ type: "TOGGLE_FEATURE", payload: feature })
                    }
                    onClearAll={() =>
                      state.features.forEach((f) =>
                        dispatch({ type: "TOGGLE_FEATURE", payload: f })
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Filters;
