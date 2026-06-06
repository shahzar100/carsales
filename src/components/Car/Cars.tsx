"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { CarInterface } from "@/lib/interfaces";
import Image from "next/image";
import {
  Fuel,
  Gauge,
  Car,
  Palette,
  Edit,
  Trash2,
  Star,
  Eye,
} from "lucide-react";
import Button from "@/components/Helpful/Buttons/Button";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { formatPrice, formatMileage } from "@/lib/utils/format";
import { getStatusStyles } from "@/components/UI/StatusBadge";
import { useDeleteCar } from "@/hooks/useDeleteCar";

interface CarsProps {
  car: CarInterface;
  carId: number;
  setCarId: React.Dispatch<React.SetStateAction<number>>;
  length: number;
  loading?: boolean;
}

const Cars = ({ car, carId, setCarId, length }: CarsProps) => {
  const router = useRouter();

  // Delete uses the shared <ConfirmDialog> primitive (Day 4) so accidental
  // clicks can't silently destroy a listing. `onDeleted` steps the carousel
  // back when we just removed the last item, before the hook's refetch.
  const { confirmingDelete, deleting, requestDelete, cancelDelete, confirmDelete } =
    useDeleteCar(car, () => {
      if (carId > 0 && carId === length - 1) {
        setCarId(carId - 1);
      }
    });

  // Navigate to the public-facing detail page (in a new tab so the admin
  // doesn't lose their place in the inventory list).
  const handleView = () => {
    if (!car._id) return;
    window.open(
      `/BrowseFleet/${car._id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Open the admin "quick edit" page for this car.
  const handleEdit = () => {
    if (!car._id) return;
    router.push(`/admin/dashboard/cars/edit/${car._id}`);
  };

  return (
    <>
      {/* Header */}
      <div className="flex w-full items-center justify-between gap-2">
        <h1 className="page-title flex gap-1">
          Car Inventory
          <span className="font-normal text-gray-500">({length})</span>
        </h1>
        <span className="text-sm text-gray-500">
          {carId + 1} / {length}
        </span>
      </div>

      {/* Main Card */}
      <div className="mt-4 w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative aspect-4/3 w-full md:aspect-auto lg:w-1/2">
            <Image
              src={car.image || "/tesla.webp"}
              alt={`${car.make} ${car.model}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${getStatusStyles(car.status)}`}
              >
                {car.status}
              </span>
              {car.featured && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex w-full flex-col p-4 md:p-5">
            {/* Title & Price */}
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="section-title">
                  {car.year} {car.make} {car.model}
                </h2>
                <p className="text-xs text-gray-500">
                  {car.transmission} • {car.fuel} • {car.doors} doors
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(car.price)}
                </p>
              </div>
            </div>

            {/* Compact Specs */}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <Gauge className="h-3.5 w-3.5 shrink-0 text-red-600" />
                <span className="truncate text-xs font-medium text-gray-700">
                  {formatMileage(car.mileage)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <Fuel className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate text-xs font-medium text-gray-700">
                  {car.fuel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <Palette className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span className="truncate text-xs font-medium text-gray-700">
                  {car.colour}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5">
                <Car className="h-3.5 w-3.5 shrink-0 text-gray-900" />
                <span className="truncate text-xs font-medium text-gray-700">
                  {car.year}
                </span>
              </div>
            </div>

            {/* Features (compact) */}
            {car.features && car.features.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {car.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <Button
                variant="dark"
                size="sm"
                className="flex-1"
                onClick={handleEdit}
                disabled={!car._id}
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleView}
                disabled={!car._id}
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={requestDelete}
                disabled={!car._id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete car?"
          description={
            <>
              <strong>
                {car.year} {car.make} {car.model}
              </strong>{" "}
              will be permanently removed from inventory. Bookings already
              attached to this listing stay in the dashboard.
            </>
          }
          confirmLabel="Delete car"
          variant="danger"
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </>
  );
};

export default Cars;
