"use client";
import { useState, useEffect } from "react";
import { CarInterface } from "@/lib/interfaces";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { filterCars } from "@/lib/utils/filterCars";
import Filters from "@/components/Car/Filters";
import CarListCard from "@/components/Car/CarListCard";
import { Car, Search } from "lucide-react";
import Pagination from "@/components/Helpful/Pagination";
import { useSkeleton } from "@/hooks/useSkeleton";
import { CarListCardSkeletonGrid } from "@/components/UI/Skeleton";
import { SkeletonWrapper } from "@/components/UI/Skeleton";

const ITEMS_PER_PAGE = 9;

const BrowseFleetInner = ({ cars }: { cars: CarInterface[] }) => {
  const { state } = useFilters();
  const [currentPage, setCurrentPage] = useState(1);
  const isLoading = useSkeleton(1000, 3000);

  // Apply filters
  const filteredCars = filterCars(cars, state);

  // Pagination
  const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCars = filteredCars.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    state.searchTerm,
    state.statusFilter,
    state.priceMin,
    state.priceMax,
    state.make,
    state.yearMin,
    state.yearMax,
    state.mileageMin,
    state.mileageMax,
    state.doors,
    state.colour,
    state.features,
  ]);

  // Reset page if current exceeds total
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col gap-8">
      {/* Filters */}
      <Filters
        totalCount={cars.length}
        filteredCount={filteredCars.length}
        cars={cars}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-sm">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {filteredCars.length} vehicle
              {filteredCars.length !== 1 ? "s" : ""} found
            </p>
            {totalPages > 1 && (
              <p className="text-xs text-gray-500">
                Showing {startIndex + 1}–
                {Math.min(endIndex, filteredCars.length)} of{" "}
                {filteredCars.length}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredCars.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
          <Car className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-semibold text-gray-400">
            No vehicles found
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your filters to see more results
          </p>
        </div>
      )}

      {/* Car List */}
      {paginatedCars.length > 0 && (
        <SkeletonWrapper
          isLoading={isLoading}
          skeleton={
            <CarListCardSkeletonGrid
              count={Math.min(paginatedCars.length, 4)}
            />
          }
        >
          <div className="flex flex-col gap-4">
            {paginatedCars.map((car) => (
              <CarListCard key={car._id} car={car} variant="customer" />
            ))}
          </div>
        </SkeletonWrapper>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            scrollToTop
            totalItems={filteredCars.length}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
      )}
    </div>
  );
};

// Wrapper with FilterProvider
const BrowseFleetContent = ({ cars }: { cars: CarInterface[] }) => {
  return (
    <FilterProvider>
      <BrowseFleetInner cars={cars} />
    </FilterProvider>
  );
};

export default BrowseFleetContent;
