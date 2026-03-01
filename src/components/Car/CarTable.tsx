import { CarInterface } from "@/lib/interfaces";
import React, { useState } from "react";
import Image from "next/image";
import CarActions from "@/components/Admin/Navigation/CarActions";

interface CarTableProps {
  cars: CarInterface[];
}

const CarTable: React.FC<CarTableProps> = ({ cars }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format mileage
  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat("en-GB").format(mileage) + " mi";
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get status badge styles
  const getStatusBadge = (status: CarInterface["status"]) => {
    const baseStyles =
      "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
    switch (status) {
      case "available":
        return `${baseStyles} bg-green-100 text-green-800 border border-green-200`;
      case "sold":
        return `${baseStyles} bg-red-100 text-red-800 border border-red-200`;
      case "reserved":
        return `${baseStyles} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(cars.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCars = cars.slice(startIndex, endIndex);

  // Reset to first page if current page exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [cars.length, itemsPerPage, currentPage, totalPages]);

  // Generate page numbers for pagination
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
    <div className="rounded-lg border border-gray-200 bg-white shadow-md">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-h-96 w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-linear-to-r from-gray-50 to-gray-100">
              <th className="px-5 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                Vehicle
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                Year
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                Price
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                Mileage
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                Specs
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                Status
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                Added
              </th>
              <th className="w-56 border-l-2 border-gray-200 bg-linear-to-r from-slate-50 to-slate-100 px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-700 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedCars.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="mb-4 text-5xl">🚗</span>
                    <p className="text-base font-medium text-gray-500">
                      No cars found
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCars.map((car, index) => (
                <tr
                  key={car._id || index}
                  className="group transition-all duration-200 hover:bg-blue-50/30"
                >
                  {/* Vehicle Info with Image */}
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200">
                        {car.image ? (
                          <Image
                            src={"/tesla.webp"}
                            alt={`${car.make} ${car.model}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
                            <span className="text-2xl text-gray-400">🖼️</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {car.make} {car.model}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {car.colour}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Year */}
                  <td className="px-4 py-5">
                    <span className="font-medium text-gray-800">
                      {car.year}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-5">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(car.price)}
                    </span>
                  </td>

                  {/* Mileage */}
                  <td className="px-4 py-5">
                    <span className="text-gray-600">
                      {formatMileage(car.mileage)}
                    </span>
                  </td>

                  {/* Specs */}
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 shadow-sm">
                        {car.fuel}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 shadow-sm">
                        {car.transmission}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm">
                        {car.doors}dr
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-5">
                    <span className={getStatusBadge(car.status)}>
                      {car.status}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-5">
                    <span className="text-sm text-gray-500">
                      {formatDate(car.createdAt)}
                    </span>
                  </td>

                  {/* Actions Hub - Visual separation */}
                  <td className="w-56 border-l-2 border-gray-100 bg-linear-to-r from-slate-50/50 to-transparent px-6 py-5">
                    <div className="flex items-center justify-center gap-4">
                      {/* Featured Toggle */}
                      <button
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-sm transition-all duration-200 ${
                          car.featured
                            ? "bg-linear-to-br from-yellow-100 to-amber-100 ring-2 ring-yellow-300 hover:scale-110 hover:shadow-md"
                            : "bg-gray-100 text-gray-400 ring-1 ring-gray-200 hover:bg-yellow-50 hover:text-yellow-500 hover:ring-yellow-200"
                        }`}
                        title={
                          car.featured
                            ? "Featured - Click to unfeature"
                            : "Not featured - Click to feature"
                        }
                      >
                        {car.featured ? "⭐" : "☆"}
                      </button>

                      {/* Divider */}
                      <div className="h-8 w-px bg-linear-to-b from-transparent via-gray-300 to-transparent"></div>

                      {/* Action Buttons */}
                      <CarActions car={car} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with summary and pagination */}
      {cars.length > 0 && (
        <div className="border-t-2 border-gray-200 bg-linear-to-r from-gray-50 to-slate-50 px-6 py-5">
          {/* Summary */}
          <div className="flex flex-wrap items-center gap-8 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-linear-to-br from-green-400 to-green-600 shadow-sm"></span>
              <span className="font-medium text-gray-700">
                Available:{" "}
                <span className="text-gray-900">
                  {cars.filter((c) => c.status === "available").length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-linear-to-br from-yellow-400 to-amber-500 shadow-sm"></span>
              <span className="font-medium text-gray-700">
                Reserved:{" "}
                <span className="text-gray-900">
                  {cars.filter((c) => c.status === "reserved").length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-linear-to-br from-red-400 to-red-600 shadow-sm"></span>
              <span className="font-medium text-gray-700">
                Sold:{" "}
                <span className="text-gray-900">
                  {cars.filter((c) => c.status === "sold").length}
                </span>
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-gray-200">
              <span className="text-sm font-medium text-gray-600">
                Total Value:
              </span>
              <span className="text-lg font-bold text-green-600">
                {formatPrice(
                  cars
                    .filter((c) => c.status === "available")
                    .reduce((sum, c) => sum + c.price, 0)
                )}
              </span>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-5 sm:flex-row">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="font-medium">per page</span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="rounded-md bg-gray-100 px-3 py-1 text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {startIndex + 1}-{Math.min(endIndex, cars.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {cars.length}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-white"
                >
                  ← Prev
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 px-2">
                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-gray-400"
                      >
                        ···
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                          currentPage === page
                            ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-md"
                            : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-white"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CarTable;
