"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import type { CarInterface } from "@/lib/interfaces";
import CarListCard from "@/components/Car/CarListCard";
import EmptyState from "@/components/UI/EmptyState";

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
  const [cars, setCars] = useState<CarInterface[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (savedIds.length === 0) {
        setCars([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/admin/cars?limit=500&status=available", {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setCars([]);
          return;
        }
        const json = await res.json();
        const list: CarInterface[] = (json?.data?.cars ?? []) as CarInterface[];
        const setIds = new Set(savedIds);
        if (!cancelled) {
          setCars(list.filter((c) => c._id && setIds.has(String(c._id))));
        }
      } catch {
        if (!cancelled) setCars([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [savedIds]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading your saved cars…</p>;
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
          {cars.length} saved {cars.length === 1 ? "car" : "cars"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear all saved cars?")) clear();
          }}
          className="text-sm font-medium text-gray-600 hover:text-red-600"
        >
          Clear all
        </button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car) => (
          <CarListCard key={String(car._id)} car={car} />
        ))}
      </div>
    </div>
  );
}
