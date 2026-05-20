"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NavButton from "@/components/Dropdown/NavButton";
import NavLink from "@/components/Dropdown/NavLink";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { CarInterface } from "@/lib/interfaces";
import { useToast } from "@/contexts/ToastContext";
import { logError } from "@/lib/utils/observability";

/**
 * Per-row "Actions" dropdown for the admin cars Table / List views.
 *
 * Edit  → the real admin edit route (`/admin/dashboard/cars/edit/[_id]`).
 * View  → the public listing the customer sees (`/BrowseFleet/[_id]`).
 * Delete→ confirmed via <ConfirmDialog>, then DELETE /api/admin/cars.
 */
const CarActions = ({ car }: { car: CarInterface }) => {
  const router = useRouter();
  const toast = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!car._id) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/cars?id=${encodeURIComponent(String(car._id))}`,
        { method: "DELETE" }
      );
      const body = await res.json();
      if (!res.ok || body?.success === false) {
        toast.error(
          "Delete failed",
          body?.error || "Could not delete the car. Please try again."
        );
        return;
      }
      toast.success("Car deleted", `${car.year} ${car.make} ${car.model}`);
      setConfirmingDelete(false);
      router.refresh();
    } catch (err) {
      logError(err, { context: "CarActions.deleteCar" });
      toast.error(
        "Delete failed",
        "Network error — please check your connection and try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <NavButton text={"Actions"} dropdown={true}>
        <NavLink
          text={"Edit Car"}
          href={`/admin/dashboard/cars/edit/${car._id}`}
        />
        <NavLink text={"View Listing"} href={`/BrowseFleet/${car._id}`} />
        <NavButton
          text={"Delete Car"}
          onClick={() => setConfirmingDelete(true)}
        />
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
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
};

export default CarActions;
