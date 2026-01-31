import { CarInterface } from "@/lib/interfaces";
import React, { useState } from "react";
import Image from "next/image";

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
    <div className="max-h-6xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Vehicle
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Year
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Price
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Mileage
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Specs
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Added
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Featured
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedCars.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <span className="mb-4 text-4xl">🚗</span>
                    <p className="text-sm font-medium text-gray-500">
                      No cars found
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCars.map((car, index) => (
                <tr
                  key={car._id || index}
                  className="transition-colors hover:bg-gray-50"
                >
                  {/* Vehicle Info with Image */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {car.image ? (
                          <Image
                            src={"/tesla.webp"}
                            alt={`${car.make} ${car.model}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-2xl text-gray-300">🖼️</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {car.make} {car.model}
                        </p>
                        <p className="text-sm text-gray-500">{car.colour}</p>
                      </div>
                    </div>
                  </td>

                  {/* Year */}
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {car.year}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">
                      {formatPrice(car.price)}
                    </span>
                  </td>

                  {/* Mileage */}
                  <td className="px-6 py-4">
                    <span className="text-gray-600">
                      {formatMileage(car.mileage)}
                    </span>
                  </td>

                  {/* Specs */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {car.fuel}
                      </span>
                      <span className="inline-flex items-center rounded border border-purple-100 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {car.transmission}
                      </span>
                      <span className="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {car.doors} doors
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(car.status)}>
                      {car.status}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {formatDate(car.createdAt)}
                    </span>
                  </td>

                  {/* Featured */}
                  <td className="px-6 py-4 text-center">
                    {car.featured ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-lg">
                        ⭐
                      </span>
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-300">
                        ☆
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        🗑️
                      </button>
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
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span>
                Available: {cars.filter((c) => c.status === "available").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span>
                Reserved: {cars.filter((c) => c.status === "reserved").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span>
                Sold: {cars.filter((c) => c.status === "sold").length}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="font-medium">Total Value:</span>
              <span className="font-bold text-gray-900">
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
            <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>per page</span>
                <span className="ml-4 text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, cars.length)} of{" "}
                  {cars.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  ← Prev
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next Button */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
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
