"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Heart, CalendarClock, History, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SavedCarsList from "./SavedCarsList";
import BookingsList, { type ActivityItem } from "./BookingsList";

/**
 * The single customer dashboard. Saved cars, upcoming bookings and
 * booking history all live here as tabs — there are no separate
 * `/saved`-style pages to navigate between.
 *
 * The active tab is reflected in the `?tab=` query param so it survives
 * a refresh and can be deep-linked (e.g. the nav "Saved" link points at
 * `/account?tab=saved`).
 *
 * Bookings are fetched once on mount and pre-split by the API into
 * `upcoming` / `history`; the Saved tab gets its data from
 * SavedCarsContext instead, so switching tabs never refetches.
 */

type TabId = "saved" | "upcoming" | "history";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "saved", label: "Saved cars", icon: Heart },
  { id: "upcoming", label: "Upcoming", icon: CalendarClock },
  { id: "history", label: "History", icon: History },
];

function isTabId(value: string | null): value is TabId {
  return value === "saved" || value === "upcoming" || value === "history";
}

export default function AccountDashboard({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get("tab");
  const [tab, setTab] = useState<TabId>(
    isTabId(initialTab) ? initialTab : "saved"
  );

  const [bookings, setBookings] = useState<{
    upcoming: ActivityItem[];
    history: ActivityItem[];
  }>({ upcoming: [], history: [] });
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/bookings", {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setBookingsError(true);
          return;
        }
        const json = await res.json();
        if (!cancelled && json?.success) {
          setBookings({
            upcoming: json.data.upcoming ?? [],
            history: json.data.history ?? [],
          });
        }
      } catch {
        if (!cancelled) setBookingsError(true);
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectTab = useCallback(
    (id: TabId) => {
      setTab(id);
      // Keep the URL in sync without a full navigation.
      router.replace(`/account?tab=${id}`, { scroll: false });
    },
    [router]
  );

  const greetingName = user.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Hi, {greetingName}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {user.email} — your saved cars and bookings, all in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Account sections"
        className="mt-8 flex gap-1 border-b border-gray-200"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          const count =
            id === "upcoming"
              ? bookings.upcoming.length
              : id === "history"
                ? bookings.history.length
                : null;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => selectTab(id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
              {count !== null && count > 0 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Panels ─────────────────────────────────────────── */}
      <div className="mt-8">
        {bookingsError && tab !== "saved" && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            We couldn&apos;t load your bookings just now. Please refresh the
            page.
          </p>
        )}

        {tab === "saved" && <SavedCarsList />}

        {tab === "upcoming" && (
          <BookingsList
            items={bookings.upcoming}
            loading={bookingsLoading}
            emptyTitle="No upcoming bookings"
            emptyDescription="When you book a service, car viewing or reservation, it'll show up here."
          />
        )}

        {tab === "history" && (
          <BookingsList
            items={bookings.history}
            loading={bookingsLoading}
            emptyTitle="No past bookings yet"
            emptyDescription="Completed and cancelled bookings made with your email address will appear here."
          />
        )}
      </div>
    </div>
  );
}
