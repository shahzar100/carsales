"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarInterface } from "@/lib/interfaces";
import { useToast } from "@/contexts/ToastContext";
import { logError } from "@/lib/utils/observability";

/**
 * Shared delete flow for a car listing. Owns the confirm-dialog state plus
 * the `DELETE /api/admin/cars` round-trip, toast feedback and router
 * refresh — the inventory carousel (`Cars`) and the table-row actions menu
 * (`CarActions`) both drive the same flow.
 *
 * `onDeleted` is the single seam for caller-specific cleanup that has to run
 * after a successful delete but before the refresh (e.g. stepping the
 * carousel index back when the last item is removed).
 */
export function useDeleteCar(car: CarInterface, onDeleted?: () => void) {
  const router = useRouter();
  const toast = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const requestDelete = () => setConfirmingDelete(true);
  const cancelDelete = () => setConfirmingDelete(false);

  const confirmDelete = async () => {
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
      onDeleted?.();
      router.refresh();
    } catch (err) {
      logError(err, { context: "useDeleteCar" });
      toast.error(
        "Delete failed",
        "Network error — please check your connection and try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return { confirmingDelete, deleting, requestDelete, cancelDelete, confirmDelete };
}
