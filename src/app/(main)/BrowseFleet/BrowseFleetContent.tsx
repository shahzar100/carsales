"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
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

/** Local, unapplied copy of the filter controls — only pushed to the URL
 * when the user clicks Search. Keeps typing/selecting responsive without
 * a server round-trip on every keystroke. */
interface DraftFilters {
  search: string;
  make: string; // "all" or a facet value
  priceMin: number | null;
  priceMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  mileageMin: number | null;
  mileageMax: number | null;
  doors: string; // "all" or a facet value (string form)
  colour: string; // "all" or a facet value
  features: string[];
}

const EMPTY_DRAFT: DraftFilters = {
  search: "",
  make: "all",
  priceMin: null,
  priceMax: null,
  yearMin: null,
  yearMax: null,
  mileageMin: null,
  mileageMax: null,
  doors: "all",
  colour: "all",
  features: [],
};

function filtersToDraft(filters: ParsedCarFilters): DraftFilters {
  return {
    search: filters.search ?? "",
    make: filters.make ?? "all",
    priceMin: filters.priceMin ?? null,
    priceMax: filters.priceMax ?? null,
    yearMin: filters.yearMin ?? null,
    yearMax: filters.yearMax ?? null,
    mileageMin: filters.mileageMin ?? null,
    mileageMax: filters.mileageMax ?? null,
    doors: filters.doors !== undefined ? String(filters.doors) : "all",
    colour: filters.colour ?? "all",
    features: filters.features ?? [],
  };
}

/**
 * (#19) Customer fleet listing — URL-driven filters.
 *
 * Filter *controls* are staged in local `draft` state. Nothing hits the
 * URL until "Search" is clicked, which pushes the whole draft at once.
 * Sort and pagination are the exception — those still apply immediately,
 * since there's no reason to make someone click Search just to re-sort.
 *
 * `useTransition` keeps the UI responsive during the round-trip, and the
 * draft is re-synced from `filters` whenever the committed filters change
 * (Search, Clear, pagination, browser back/forward), so the controls
 * never drift from what's actually been applied.
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

  const [draft, setDraft] = useState<DraftFilters>(() =>
    filtersToDraft(filters)
  );

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Whenever the committed filters change for any reason (Search, Clear,
  // pagination, back/forward nav), bring the draft controls back in sync.
  useEffect(() => {
    setDraft(filtersToDraft(filters));
  }, [filters]);

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

  // Pushes the current draft to the URL in one go. This is the only place
  // draft filter values reach the server.
  const applyFilters = useCallback(() => {
    setParams({
      search: draft.search.trim() || null,
      make: draft.make === "all" ? null : draft.make,
      priceMin: draft.priceMin,
      priceMax: draft.priceMax,
      yearMin: draft.yearMin,
      yearMax: draft.yearMax,
      mileageMin: draft.mileageMin,
      mileageMax: draft.mileageMax,
      doors: draft.doors === "all" ? null : draft.doors,
      colour: draft.colour === "all" ? null : draft.colour,
      features: draft.features.length ? draft.features.join(",") : null,
    });
  }, [draft, setParams]);

  const toggleFeature = useCallback((feature: string) => {
    setDraft((d) => ({
      ...d,
      features: d.features.includes(feature)
        ? d.features.filter((f) => f !== feature)
        : [...d.features, feature],
    }));
  }, []);

  const clearFeatures = useCallback(() => {
    setDraft((d) => ({ ...d, features: [] }));
  }, []);

  // Clears both the staged draft and the applied URL filters, instantly.
  const resetFilters = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  const totalPages = Math.max(1, Math.ceil(totalMatching / filters.perPage));
  const startIndex = (filters.page - 1) * filters.perPage;
  const endIndex = startIndex + cars.length;

  // Reflects what's actually been applied (the committed `filters` prop),
  // not the unsaved draft — so this stays accurate to what's on screen.
  const activeCount = [
    filters.search !== undefined && filters.search !== "",
    filters.status === "available",
    filters.priceMin !== undefined || filters.priceMax !== undefined,
    filters.make !== undefined,
    filters.yearMin !== undefined || filters.yearMax !== undefined,
    filters.mileageMin !== undefined || filters.mileageMax !== undefined,
    filters.doors !== undefined,
    filters.colour !== undefined,
    filters.features && filters.features.length > 0,
  ].filter(Boolean).length;

  return (
    <div
      className={`flex flex-col gap-8 ${isPending ? "opacity-70" : ""} transition-opacity`}
    >
      <button
        onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
        className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md md:hidden"
      >
        <SlidersHorizontal size={16} className="text-white" />
      </button>
      {/* Filters */}

      <div
        className={`card ${isMobileFiltersOpen ? "block" : "hidden md:block"}`}
      >
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
                value={draft.search}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, search: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
                className="input"
              />
            </div>

            <FilterSelect
              label="Make"
              value={draft.make}
              onChange={(v) => setDraft((d) => ({ ...d, make: v }))}
              options={facets.makes.map((m) => ({ value: m, label: m }))}
              placeholder="All Makes"
            />

            <RangeInput
              label="Price (£)"
              minValue={draft.priceMin}
              maxValue={draft.priceMax}
              onMinChange={(v) => setDraft((d) => ({ ...d, priceMin: v }))}
              onMaxChange={(v) => setDraft((d) => ({ ...d, priceMax: v }))}
            />
          </div>
        </div>

        {/* Advanced filters */}
        <div className="section divider">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RangeInput
              label="Year"
              minValue={draft.yearMin}
              maxValue={draft.yearMax}
              onMinChange={(v) => setDraft((d) => ({ ...d, yearMin: v }))}
              onMaxChange={(v) => setDraft((d) => ({ ...d, yearMax: v }))}
              minPlaceholder="From"
              maxPlaceholder="To"
            />
            <RangeInput
              label="Mileage"
              minValue={draft.mileageMin}
              maxValue={draft.mileageMax}
              onMinChange={(v) => setDraft((d) => ({ ...d, mileageMin: v }))}
              onMaxChange={(v) => setDraft((d) => ({ ...d, mileageMax: v }))}
            />
            <FilterSelect
              label="Doors"
              value={draft.doors}
              onChange={(v) => setDraft((d) => ({ ...d, doors: v }))}
              options={facets.doors.map((d) => ({
                value: String(d),
                label: `${d} doors`,
              }))}
              placeholder="Any"
            />
            <FilterSelect
              label="Colour"
              value={draft.colour}
              onChange={(v) => setDraft((d) => ({ ...d, colour: v }))}
              options={facets.colours.map((c) => ({ value: c, label: c }))}
              placeholder="All Colours"
            />
            {facets.features.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-4">
                <CarFeatures
                  allFeatures={facets.features}
                  selectedFeatures={draft.features}
                  onToggle={toggleFeature}
                  onClearAll={clearFeatures}
                />
              </div>
            )}
          </div>
        </div>

        {/* Apply / reset */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          {activeCount > 0 && (
            <Button onClick={resetFilters} variant="ghost" disabled={false}>
              <RotateCcw size={14} className="text-red-500" />
              <span className="text-sm">Clear all</span>
            </Button>
          )}
          <Button onClick={applyFilters} variant="primary" disabled={false}>
            <Search size={14} />
            <span className="text-sm">Search</span>
          </Button>
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
          {cars.map((car, idx) => (
            <CarListCard
              key={String(car._id)}
              car={car}
              variant="customer"
              // First card on page 1 is the likely LCP candidate above
              // the fold — flag it for eager loading. Subsequent rows
              // stay lazy so we don't fight the browser's connection
              // budget on slower networks.
              priority={filters.page === 1 && idx === 0}
            />
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
