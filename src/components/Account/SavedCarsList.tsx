"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Heart } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import type { CarInterface } from "@/lib/interfaces";
import CarListCard from "@/components/Car/CarListCard";
import EmptyState from "@/components/UI/EmptyState";
import { CarListCardSkeleton } from "@/components/UI/Skeleton";
import { useApi } from "@/hooks/useApi";

type AvailableCarsResponse = { cars: CarInterface[] };

/**
 * The saved-cars grid, without page chrome — used as the "Saved" tab of
 * the account dashboard.
 *
 * Same data flow as the standalone /saved page: read the saved ids from
 * SavedCarsContext (which, for signed-in users, has already reconciled
 * with the server), then fetch the full car records and filter to the
 * ones still available. Ids that no longer map to an available car are
 * dropped from the view but kept in storage in case the listing returns.
 */
export default function SavedCarsList() {
  const { savedIds, clear } = useSavedCars();
  // (#cleanup) Skip the network call entirely when nothing is saved —
  // pass null as the URL and useApi short-circuits.
  const init = useMemo<RequestInit>(() => ({ cache: "no-store" }), []);
  const { data, error, loading: fetchLoading } = useApi<AvailableCarsResponse>(
    savedIds.length === 0
      ? null
      : `/api/cars?ids=${encodeURIComponent(savedIds.join(","))}`,
    { init }
  );

  // Filter the fetched cars down to the saved set. An error from the
  // hook (non-2xx or network failure) gracefully falls through to the
  // same empty grid the original effect produced.
  const cars: CarInterface[] = (() => {
    if (savedIds.length === 0 || error || !data) return [];
    const setIds = new Set(savedIds);
    return (data.cars ?? []).filter(
      (c) => c._id && setIds.has(String(c._id))
    );
  })();

  // Match the original "loading until we have a definite answer" rule:
  // empty savedIds → not loading; otherwise loading until the hook
  // resolves to data or error.
  const loading =
    savedIds.length > 0 && fetchLoading && !data && !error;

  if (loading) {
    // Match the loaded layout: a grid of list-card skeletons, sized to the
    // number of saved ids (capped) so the page doesn't jump on resolve.
    const placeholderCount = Math.min(Math.max(savedIds.length, 1), 6);
    return (
      <div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Loading your saved cars"
        aria-busy="true"
      >
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <CarListCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No saved cars yet"
        description={
          <>
            Tap the heart on a car in{" "}
            <Link
              href="/BrowseFleet"
              className="font-semibold text-red-600 hover:underline"
            >
              the fleet
            </Link>{" "}
            to add it here. Your list now syncs across every device you
            sign in on.
          </>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <m.span
            key={cars.length}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="inline-block tabular-nums"
          >
            {cars.length}
          </m.span>{" "}
          saved {cars.length === 1 ? "car" : "cars"}
        </p>
        <m.button
          type="button"
          onClick={() => {
            if (window.confirm("Clear all saved cars?")) clear();
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 460, damping: 22 }}
          className="text-sm font-medium text-gray-600 hover:text-red-600"
        >
          Clear all
        </m.button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {cars.map((car) => (
            <m.div
              key={String(car._id)}
              layout
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            >
              <CarListCard car={car} />
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
