"use client";
import Link from "next/link";
import NavButton from "@/components/Dropdown/NavButton";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { CarInterface } from "@/lib/interfaces";
import { useDeleteCar } from "@/hooks/useDeleteCar";

/**
 * Per-row "Actions" dropdown for the admin cars Table / List views.
 *
 * Edit  → the real admin edit route (`/admin/dashboard/cars/edit/[_id]`).
 * View  → the public listing the customer sees (`/BrowseFleet/[_id]`).
 * Delete→ confirmed via <ConfirmDialog>, then DELETE /api/admin/cars.
 */
const CarActions = ({ car }: { car: CarInterface }) => {
  const { confirmingDelete, deleting, requestDelete, cancelDelete, confirmDelete } =
    useDeleteCar(car);

  return (
    <div>
      <NavButton text={"Actions"} dropdown={true}>
        <Link
          href={`/admin/dashboard/cars/edit/${car._id}`}
          className="block w-full rounded-md px-6 py-2 text-left text-base font-medium text-gray-700 underline-offset-4 decoration-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500 hover:underline"
        >
          Edit Car
        </Link>
        <Link
          href={`/BrowseFleet/${car._id}`}
          className="block w-full rounded-md px-6 py-2 text-left text-base font-medium text-gray-700 underline-offset-4 decoration-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500 hover:underline"
        >
          View Listing
        </Link>
        <NavButton text={"Delete Car"} onClick={requestDelete} />
      </NavButton>

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
    </div>
  );
};

export default CarActions;
