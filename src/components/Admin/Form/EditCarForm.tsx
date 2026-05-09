"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { CarInterface } from "@/lib/interfaces";
import Dropdown from "@/components/Form/Dropdown";
import {
  FormInput,
  FormTextarea,
  FormToggle,
} from "@/components/Form/FormPrimitives";
import { useToast } from "@/contexts/ToastContext";

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "reserved", label: "Reserved" },
];

interface EditCarFormProps {
  car: CarInterface;
}

/**
 * Quick-edit form for the most-changed car fields. Wires the existing
 * `PUT /api/admin/cars` endpoint that until now had no UI calling it.
 *
 * Scope is intentionally narrow — status, price, mileage, featured,
 * description — because (a) those are the fields admins change between
 * listings going live, going on hold, and selling, and (b) full
 * make/model/year/photo edits should go through the multi-step
 * `CarForm` pattern (deferred for now).
 */
const EditCarForm: React.FC<EditCarFormProps> = ({ car }) => {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [status, setStatus] = useState(car.status);
  const [price, setPrice] = useState(String(car.price));
  const [mileage, setMileage] = useState(String(car.mileage));
  const [featured, setFeatured] = useState(car.featured);
  const [description, setDescription] = useState(car.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!car._id) {
      toastError("Cannot save changes", "Missing car ID");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/cars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: car._id,
          status,
          price: Number(price),
          mileage: Number(mileage),
          featured,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const detail =
          result?.details && typeof result.details === "object"
            ? Object.values(result.details).flat().join(", ")
            : undefined;
        throw new Error(detail || result?.error || "Failed to update car");
      }

      success(
        "Vehicle updated",
        `${car.year} ${car.make} ${car.model} saved.`
      );
      router.push("/admin/dashboard/cars");
      router.refresh();
    } catch (err) {
      toastError(
        "Failed to update car",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6"
    >
      <Dropdown
        label="Status"
        options={statusOptions}
        value={status}
        onChange={(v) => setStatus(v as CarInterface["status"])}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          label="Price (£)"
          type="number"
          value={price}
          onChange={setPrice}
          min="0"
          required
        />
        <FormInput
          label="Mileage"
          type="number"
          value={mileage}
          onChange={setMileage}
          min="0"
          required
        />
      </div>

      <FormToggle
        label="Featured"
        description="Show on homepage"
        checked={featured}
        onChange={setFeatured}
      />

      <FormTextarea
        label="Description"
        value={description}
        onChange={setDescription}
        rows={4}
        placeholder="Add any extra details about this vehicle..."
      />

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard/cars")}
          disabled={submitting}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EditCarForm;
