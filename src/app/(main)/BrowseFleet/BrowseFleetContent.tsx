"use client";
import React, { useState, useEffect } from "react";
import { CarInterface } from "@/lib/interfaces";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { filterCars } from "@/lib/utils/filterCars";
import Filters from "@/components/Car/Filters";
import CarListCard from "@/components/Car/CarListCard";
import { Car, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 9;

const BrowseFleetInner = ({ cars }: { cars: CarInterface[] }) => {
  const { state } = useFilters();
  const [currentPage, setCurrentPage] = useState(1);

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

  // Page numbers generator
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

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
              {filteredCars.length} vehicle{filteredCars.length !== 1 ? "s" : ""}{" "}
              found
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
        <div className="flex flex-col gap-4">
          {paginatedCars.map((car) => (
            <CarListCard key={car._id} car={car} variant="customer" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:flex-row sm:justify-between">
          {/* Info */}
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {startIndex + 1}–{Math.min(endIndex, filteredCars.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {filteredCars.length}
            </span>{" "}
            vehicles
          </p>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {/* Previous */}
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 text-gray-400"
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page as number);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`min-w-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                      currentPage === page
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            {/* Next */}
            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
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
