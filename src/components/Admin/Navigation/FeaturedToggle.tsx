"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { CarInterface } from "@/lib/interfaces";
import { useToast } from "@/contexts/ToastContext";
import { logError } from "@/lib/utils/observability";

/**
 * Admin-only "featured" toggle for a car in the Table / List views.
 *
 * Clicking flips the car's `featured` flag via `PUT /api/admin/cars` and
 * refreshes the route so the change is reflected. (The card view has its
 * own controls in `Cars.tsx`.)
 */
const FeaturedToggle = ({ car }: { car: CarInterface }) => {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const featured = Boolean(car.featured);

  const handleToggle = async () => {
    if (!car._id || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: String(car._id), featured: !featured }),
      });
      const body = await res.json();
      if (!res.ok || body?.success === false) {
        toast.error(
          "Update failed",
          body?.error || "Could not update the featured status."
        );
        return;
      }
      toast.success(
        featured ? "Removed from featured" : "Added to featured",
        `${car.year} ${car.make} ${car.model}`
      );
      router.refresh();
    } catch (err) {
      logError(err, { context: "FeaturedToggle.handleToggle" });
      toast.error("Update failed", "Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving || !car._id}
      aria-pressed={featured}
      aria-label={featured ? "Remove from featured" : "Add to featured"}
      title={
        featured
          ? "Featured — click to unfeature"
          : "Not featured — click to feature"
      }
      className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        featured
          ? "bg-red-50 text-red-600 ring-2 ring-red-200 hover:scale-110 hover:shadow-md"
          : "bg-gray-100 text-gray-400 ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-500 hover:ring-red-200"
      }`}
    >
      <Star className="h-4 w-4" fill={featured ? "currentColor" : "none"} />
    </button>
  );
};

export default FeaturedToggle;
