"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Heart,
  CalendarClock,
  History,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import SavedCarsList from "./SavedCarsList";
import BookingsList, { type ActivityItem } from "./BookingsList";
import AccountSettings from "./AccountSettings";
import EmailVerificationBanner from "./EmailVerificationBanner";
import { useApi } from "@/hooks/useApi";

type BookingsResponse = {
  upcoming?: ActivityItem[];
  history?: ActivityItem[];
};

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

type TabId = "saved" | "upcoming" | "history" | "settings";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "saved", label: "Saved cars", icon: Heart },
  { id: "upcoming", label: "Upcoming", icon: CalendarClock },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function isTabId(value: string | null): value is TabId {
  return (
    value === "saved" ||
    value === "upcoming" ||
    value === "history" ||
    value === "settings"
  );
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

  // (#cleanup) Replaces the hand-rolled useEffect+cancelled-flag fetch
  // with the shared useApi hook. The init object is memoised so the
  // hook's dep array stays stable across re-renders.
  const init = useMemo<RequestInit>(() => ({ cache: "no-store" }), []);
  const {
    data: bookingsData,
    error: bookingsErrorMsg,
    loading: bookingsLoading,
  } = useApi<BookingsResponse>("/api/account/bookings", { init });
  const bookings = {
    upcoming: bookingsData?.upcoming ?? [],
    history: bookingsData?.history ?? [],
  };
  const bookingsError = bookingsErrorMsg !== null;

  const selectTab = useCallback(
    (id: TabId) => {
      setTab(id);
      // Keep the URL in sync without a full navigation.
      router.replace(`/account?tab=${id}`, { scroll: false });
    },
    [router]
  );

  // Prefer the live session (so a name change in Settings shows
  // immediately via useSession().update()), falling back to the
  // server-passed prop for the first paint.
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? user.name;
  const displayEmail = session?.user?.email ?? user.email;
  const greetingName = displayName?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Hi, {greetingName}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {displayEmail} — your saved cars and bookings, all in one place.
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

      {/* ── Email verification nudge (renders nothing once verified) ── */}
      <EmailVerificationBanner />

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
            <m.button
              key={id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => selectTab(id)}
              whileTap={{ scale: 0.96 }}
              className={`relative -mb-px flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "text-red-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
              {count !== null && count > 0 && (
                <m.span
                  layout
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {count}
                </m.span>
              )}
              {active && (
                <m.span
                  layoutId="account-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-red-600"
                  transition={{ type: "spring", stiffness: 480, damping: 32 }}
                />
              )}
            </m.button>
          );
        })}
      </div>

      {/* ── Panels ─────────────────────────────────────────── */}
      <div className="mt-8">
        {bookingsError && (tab === "upcoming" || tab === "history") && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            We couldn&apos;t load your bookings just now. Please refresh the
            page.
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
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

            {tab === "settings" && <AccountSettings />}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
