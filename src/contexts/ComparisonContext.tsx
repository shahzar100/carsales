"use client";

import React, {
  createContext,
  use,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { CarInterface } from "@/lib/interfaces";
import { useToast } from "@/contexts/ToastContext";

const MAX_COMPARE = 3;
const STORAGE_KEY = "car-comparison";

interface ComparisonContextType {
  comparedCars: CarInterface[];
  addToCompare: (car: CarInterface) => void;
  removeFromCompare: (carId: string) => void;
  clearComparison: () => void;
  isInComparison: (carId: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(
  undefined
);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparedCars, setComparedCars] = useState<CarInterface[]>([]);
  const toast = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CarInterface[];
        if (Array.isArray(parsed)) {
          setComparedCars(parsed.slice(0, MAX_COMPARE));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedCars));
    } catch {
      // Ignore storage errors
    }
  }, [comparedCars]);

  const isInComparison = useCallback(
    (carId: string) => {
      return comparedCars.some((c) => String(c._id) === carId);
    },
    [comparedCars]
  );

  const addToCompare = useCallback(
    (car: CarInterface) => {
      if (!car._id) return;
      const carId = String(car._id);

      if (isInComparison(carId)) {
        toast.info(
          "Already in comparison",
          `${car.make} ${car.model} is already in your comparison list.`
        );
        return;
      }

      if (comparedCars.length >= MAX_COMPARE) {
        toast.warning(
          "Comparison full",
          `You can compare up to ${MAX_COMPARE} cars. Remove one first.`
        );
        return;
      }

      setComparedCars((prev) => [...prev, car]);
      toast.success(
        "Added to comparison",
        `${car.make} ${car.model} has been added.`
      );
    },
    [comparedCars, isInComparison, toast]
  );

  const removeFromCompare = useCallback(
    (carId: string) => {
      const car = comparedCars.find((c) => String(c._id) === carId);
      setComparedCars((prev) => prev.filter((c) => String(c._id) !== carId));
      if (car) {
        toast.info(
          "Removed from comparison",
          `${car.make} ${car.model} has been removed.`
        );
      }
    },
    [comparedCars, toast]
  );

  const clearComparison = useCallback(() => {
    setComparedCars([]);
    toast.info(
      "Comparison cleared",
      "All cars have been removed from comparison."
    );
  }, [toast]);

  const value = useMemo(
    () => ({
      comparedCars,
      addToCompare,
      removeFromCompare,
      clearComparison,
      isInComparison,
    }),
    [
      comparedCars,
      addToCompare,
      removeFromCompare,
      clearComparison,
      isInComparison,
    ]
  );

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = use(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}

export { ComparisonContext };
