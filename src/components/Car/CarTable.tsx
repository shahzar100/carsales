import { CarInterface } from "@/lib/interfaces";
import React, { useState } from "react";
import Image from "next/image";
import CarActions from "@/components/Admin/Navigation/CarActions";
import Pagination from "@/components/Helpful/Pagination";
import {
  formatPrice,
  formatMileage,
  formatDate,
} from "@/lib/utils/format";
import StatusBadge from "@/components/UI/StatusBadge";
import FeaturedToggle from "@/components/Admin/Navigation/FeaturedToggle";

interface CarTableProps {
  cars: CarInterface[];
}

const CarTable: React.FC<CarTableProps> = ({ cars }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination calculations
  const totalPages = Math.ceil(cars.length / itemsPerPage);
  // Clamp the effective page during render instead of resetting it in a
  // useEffect. The effect form briefly committed an out-of-range (empty) page
  // when the list shrank below the current page, then snapped back on the next
  // render — a visible flash. Deriving `page` here removes that extra render.
  const page = currentPage > totalPages && totalPages > 0 ? 1 : currentPage;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCars = cars.slice(startIndex, endIndex);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-md">
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
                  key={car._id ? String(car._id) : index}
                  className="group transition-all duration-200 hover:bg-red-50/30"
                >
                  {/* Vehicle Info with Image */}
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200">
                        {car.image ? (
                          <Image
                            src={car.image}
                            alt={`${car.make} ${car.model}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                      {formatMileage(car.mileage)} mi
                    </span>
                  </td>

                  {/* Specs */}
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 shadow-sm">
                        {car.fuel}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm">
                        {car.transmission}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm">
                        {car.doors}dr
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-5">
                    <StatusBadge status={car.status} />
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
                      <FeaturedToggle car={car} />

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
              <span className="text-lg font-bold text-red-600">
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
            <div className="mt-5 border-t border-gray-200 pt-5">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={cars.length}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CarTable;
