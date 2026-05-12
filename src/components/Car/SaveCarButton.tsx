"use client";

import { Heart } from "lucide-react";
import { useSavedCars } from "@/contexts/SavedCarsContext";

interface Props {
  carId: string;
  className?: string;
  label?: string; // overrides the default sr-only labels
}

/**
 * Day 10 / Fix 10.4 — heart-toggle to save / unsave a car.
 *
 * Reads from SavedCarsProvider in (main)/layout; the saved state
 * persists in localStorage and survives reloads.
 */
export default function SaveCarButton({ carId, className = "", label }: Props) {
  const { isSaved, toggle } = useSavedCars();
  const saved = isSaved(carId);

  return (
    <button
      type="button"
      onClick={(e) => {
        // The button often lives inside a wrapping <Link> to the car
        // detail page — stop the save click from also navigating.
        e.preventDefault();
        e.stopPropagation();
        toggle(carId);
      }}
      aria-pressed={saved}
      aria-label={
        label ?? (saved ? "Remove from saved cars" : "Save this car")
      }
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-red-600 focus:ring-2 focus:ring-red-200 focus:outline-none ${className}`}
    >
      <Heart
        className={`h-5 w-5 ${saved ? "fill-red-600 text-red-600" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}
