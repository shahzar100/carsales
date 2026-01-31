import { CarInterface } from "@/lib/interfaces";
import React, { useState } from "react";
import Image from "next/image";

interface CarTableProps {
  cars: CarInterface[];
}

const CarTable: React.FC<CarTableProps> = ({ cars }) => {
  const [sortField, setSortField] = useState<keyof CarInterface>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  // Handle sorting
  const handleSort = (field: keyof CarInterface) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: keyof CarInterface }) => {
    if (sortField !== field) {
      return <span className="text-xs text-gray-400">⇅</span>;
    }
    return sortDirection === "asc" ? (
      <span className="text-xs text-blue-600">▲</span>
    ) : (
      <span className="text-xs text-blue-600">▼</span>
    );
  };

  // Filter and sort cars
  const filteredAndSortedCars = cars
    .filter((car) => {
      const matchesSearch =
        searchTerm === "" ||
        `${car.make} ${car.model} ${car.year} ${car.colour}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || car.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || bValue === undefined) return 0;

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  return (
    <div className="max-h-6xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header with search and filters */}
      <div className="border-b border-gray-200 bg-gray-50 p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Car Inventory</h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredAndSortedCars.length} of {cars.length} vehicles
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:w-64"
              />
            </div>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Vehicle
              </th>
              <th
                className="cursor-pointer px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase transition-colors hover:bg-gray-100"
                onClick={() => handleSort("year")}
              >
                <div className="flex items-center gap-2">
                  Year
                  <SortIcon field="year" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase transition-colors hover:bg-gray-100"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center gap-2">
                  Price
                  <SortIcon field="price" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase transition-colors hover:bg-gray-100"
                onClick={() => handleSort("mileage")}
              >
                <div className="flex items-center gap-2">
                  Mileage
                  <SortIcon field="mileage" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Specs
              </th>
              <th
                className="cursor-pointer px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase transition-colors hover:bg-gray-100"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase transition-colors hover:bg-gray-100"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  Added
                  <SortIcon field="createdAt" />
                </div>
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
            {filteredAndSortedCars.length === 0 ? (
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
              filteredAndSortedCars.map((car, index) => (
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

      {/* Footer with summary */}
      {filteredAndSortedCars.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span>
                Available:{" "}
                {
                  filteredAndSortedCars.filter((c) => c.status === "available")
                    .length
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span>
                Reserved:{" "}
                {
                  filteredAndSortedCars.filter((c) => c.status === "reserved")
                    .length
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span>
                Sold:{" "}
                {
                  filteredAndSortedCars.filter((c) => c.status === "sold")
                    .length
                }
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="font-medium">Total Value:</span>
              <span className="font-bold text-gray-900">
                {formatPrice(
                  filteredAndSortedCars
                    .filter((c) => c.status === "available")
                    .reduce((sum, c) => sum + c.price, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarTable;
