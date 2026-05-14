"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import type { CarInterface } from "@/lib/interfaces";
import CarListCard from "./CarListCard";

/**
 * Day 10 / Fix 10.4 — the customer-facing "Saved cars" page.
 *
 * Reads the saved-ids from SavedCarsContext, then fetches the full car
 * records from the existing /api/admin/cars endpoint (filtered by
 * status:available in buildCarMongoFilter — sold cars naturally drop off
 * when re-fetched). If a saved id no longer maps to an available car,
 * it's filtered out of the displayed list but kept in storage in case
 * the seller marks it available again.
 *
 * The list is localStorage-backed for signed-out visitors and synced to
 * the customer's account once signed in (see SavedCarsContext) — the
 * sub-heading reflects which of those applies.
 */
export default function SavedCarsPage() {
  const { savedIds, clear } = useSavedCars();
  const { status } = useSession();
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
        // Fetch a fresh page from BrowseFleet and filter client-side.
        // Saved lists are capped at 50 entries so a single request that
        // pulls available cars is plenty; if we ever grow past one page
        // of fleet results, add a `?ids=` server endpoint instead.
        const res = await fetch(
          `/api/admin/cars?limit=500&status=available`,
          { cache: "no-store" }
        );
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Heart className="h-7 w-7 fill-red-600 text-red-600" />
            Saved cars
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {status === "authenticated" ? (
              "Synced to your account — your saved cars follow you across devices."
            ) : (
              <>
                Saved on this device.{" "}
                <Link
                  href="/login?callbackUrl=/saved"
                  className="font-semibold text-red-600 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to sync them across devices.
              </>
            )}
          </p>
        </div>
        {savedIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all saved cars?")) clear();
            }}
            className="text-sm font-medium text-gray-600 hover:text-red-600"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-gray-500">Loading your saved cars…</p>
        ) : cars.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Heart className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-600">
              You haven&apos;t saved any cars yet. Tap the heart on a car in{" "}
              <Link
                href="/BrowseFleet"
                className="font-semibold text-red-600 hover:underline"
              >
                the fleet
              </Link>{" "}
              to add it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarListCard key={String(car._id)} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
