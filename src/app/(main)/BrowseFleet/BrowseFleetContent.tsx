"use client";
import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CarInterface } from "@/lib/interfaces";
import CarListCard from "@/components/Car/CarListCard";
import { Car, Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import Pagination from "@/components/Helpful/Pagination";
import Button from "@/components/Helpful/Buttons/Button";
import RangeInput from "@/components/Helpful/RangeInput";
import FilterSelect from "@/components/Helpful/FilterSelect";
import CarFeatures from "@/components/Helpful/CarFeatures";
import type { ParsedCarFilters } from "@/lib/utils/buildCarFilter";

interface Facets {
  makes: string[];
  colours: string[];
  doors: number[];
  features: string[];
}

interface BrowseFleetContentProps {
  /** Pre-filtered, paginated cars from the server. */
  cars: CarInterface[];
  /** Facets for the filter dropdowns — drawn from the full dataset. */
  facets: Facets;
  /** Parsed filters that produced `cars`. Used to populate the UI. */
  filters: ParsedCarFilters;
  /** Total matching `filters` (across all pages). */
  totalMatching: number;
  /** Total available cars regardless of filter (for the "X of Y" label). */
  totalAvailable: number;
}

/**
 * (#19) Customer fleet listing — URL-driven filters.
 *
 * Filter state lives in the URL. Changing a filter pushes a new URL
 * with `router.push`, which re-runs the server component and re-fetches
 * the matching cars. `useTransition` keeps the UI responsive during
 * the round-trip.
 *
 * No client-side `filterCars()` anymore — the server already did the
 * work, and we just render. (Old FilterContext stays in place for any
 * other consumers but isn't used here.)
 */
const BrowseFleetContent: React.FC<BrowseFleetContentProps> = ({
  cars,
  facets,
  filters,
  totalMatching,
  totalAvailable,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Mutate one or more keys in the URL search params, leaving everything
  // else (including unrelated query string keys) intact. `null` removes
  // the key.
  const setParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          value === "all"
        ) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      // Any filter change resets pagination to page 1.
      if (!("page" in updates)) next.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const setFeatures = useCallback(
    (features: string[]) => {
      setParams({ features: features.length ? features.join(",") : null });
    },
    [setParams]
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  const totalPages = Math.max(1, Math.ceil(totalMatching / filters.perPage));
  const startIndex = (filters.page - 1) * filters.perPage;
  const endIndex = startIndex + cars.length;

  const activeCount = [
    filters.search,
    filters.status,
    filters.priceMin !== undefined || filters.priceMax !== undefined,
    filters.make,
    filters.yearMin !== undefined || filters.yearMax !== undefined,
    filters.mileageMin !== undefined || filters.mileageMax !== undefined,
    filters.doors !== undefined,
    filters.colour,
    filters.features && filters.features.length > 0,
  ].filter(Boolean).length;

  return (
    <div
      className={`flex flex-col gap-8 ${isPending ? "opacity-70" : ""} transition-opacity`}
    >
      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-red-500 to-red-600 shadow-sm">
              <SlidersHorizontal size={16} className="text-white" />
            </div>
            <div>
              <h2 className="heading-4 text-sm">Filters</h2>
              <p className="caption">
                {totalMatching} of {totalAvailable} vehicles
                {activeCount > 0 && (
                  <span className="badge-sm badge-brand ml-1.5">
                    {activeCount} active
                  </span>
                )}
              </p>
            </div>
          </div>

          {activeCount > 0 && (
            <Button onClick={resetFilters} variant="ghost" disabled={false}>
              <RotateCcw size={14} className="text-red-500" />
              <span className="text-sm">Clear</span>
            </Button>
          )}
        </div>

        {/* Primary filters */}
        <div className="section-muted">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label-sm" htmlFor="fleet-search">
                Search
              </label>
              <input
                id="fleet-search"
                type="text"
                placeholder="Make, model, colour…"
                defaultValue={filters.search ?? ""}
                onChange={(e) => setParams({ search: e.target.value })}
                className="input"
              />
            </div>

            <FilterSelect
              label="Make"
              value={filters.make ?? "all"}
              onChange={(v) => setParams({ make: v === "all" ? null : v })}
              options={facets.makes.map((m) => ({ value: m, label: m }))}
              placeholder="All Makes"
            />

            <RangeInput
              label="Price (£)"
              minValue={filters.priceMin ?? null}
              maxValue={filters.priceMax ?? null}
              onMinChange={(v) => setParams({ priceMin: v })}
              onMaxChange={(v) => setParams({ priceMax: v })}
            />
          </div>
        </div>

        {/* Advanced filters */}
        <div className="section divider">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RangeInput
              label="Year"
              minValue={filters.yearMin ?? null}
              maxValue={filters.yearMax ?? null}
              onMinChange={(v) => setParams({ yearMin: v })}
              onMaxChange={(v) => setParams({ yearMax: v })}
              minPlaceholder="From"
              maxPlaceholder="To"
            />
            <RangeInput
              label="Mileage"
              minValue={filters.mileageMin ?? null}
              maxValue={filters.mileageMax ?? null}
              onMinChange={(v) => setParams({ mileageMin: v })}
              onMaxChange={(v) => setParams({ mileageMax: v })}
            />
            <FilterSelect
              label="Doors"
              value={
                filters.doors !== undefined ? String(filters.doors) : "all"
              }
              onChange={(v) => setParams({ doors: v === "all" ? null : v })}
              options={facets.doors.map((d) => ({
                value: String(d),
                label: `${d} doors`,
              }))}
              placeholder="Any"
            />
            <FilterSelect
              label="Colour"
              value={filters.colour ?? "all"}
              onChange={(v) => setParams({ colour: v === "all" ? null : v })}
              options={facets.colours.map((c) => ({ value: c, label: c }))}
              placeholder="All Colours"
            />
            {facets.features.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-4">
                <CarFeatures
                  allFeatures={facets.features}
                  selectedFeatures={filters.features ?? []}
                  onToggle={(feature) => {
                    const current = filters.features ?? [];
                    const next = current.includes(feature)
                      ? current.filter((f) => f !== feature)
                      : [...current, feature];
                    setFeatures(next);
                  }}
                  onClearAll={() => setFeatures([])}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results header + sort */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-sm">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {totalMatching} vehicle
              {totalMatching !== 1 ? "s" : ""} found
            </p>
            {totalPages > 1 && cars.length > 0 && (
              <p className="text-xs text-gray-500">
                Showing {startIndex + 1}–{endIndex} of {totalMatching}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500" htmlFor="fleet-sort">
            Sort by
          </label>
          <select
            id="fleet-sort"
            value={filters.sort ?? "newest"}
            onChange={(e) => setParams({ sort: e.target.value })}
            className="select py-1 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
            <option value="mileageAsc">Mileage: low to high</option>
            <option value="yearDesc">Year: newest first</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {cars.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <Car className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-semibold text-gray-600">
            No vehicles found
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Try adjusting your filters to see more results
          </p>
        </div>
      )}

      {/* Car list */}
      {cars.length > 0 && (
        <div className="flex flex-col gap-4">
          {cars.map((car) => (
            <CarListCard key={String(car._id)} car={car} variant="customer" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => setParams({ page })}
            scrollToTop
            totalItems={totalMatching}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
      )}
    </div>
  );
};

export default BrowseFleetContent;
