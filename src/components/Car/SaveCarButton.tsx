"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
    <motion.button
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
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 460, damping: 18 }}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-red-600 focus:ring-2 focus:ring-red-200 focus:outline-none ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={saved ? "saved" : "unsaved"}
          initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
          transition={{ type: "spring", stiffness: 520, damping: 18 }}
          aria-hidden="true"
        >
          <Heart
            className={`h-5 w-5 ${saved ? "fill-red-600 text-red-600" : ""}`}
          />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
