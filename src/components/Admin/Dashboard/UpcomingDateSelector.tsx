"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";

// ═════════════════════════════════════════════════════════════
// UpcomingDateSelector — future-facing look-ahead picker for the
// Upcoming Appointments card. Writes its own `upcoming` search param
// and is INTENTIONALLY separate from the top-of-page DateSelector
// (which only offers past ranges and drives the KPIs/charts).
// ═════════════════════════════════════════════════════════════

const UPCOMING_PRESETS = [
  { value: "7d", label: "Next 7 days" },
  { value: "14d", label: "Next 14 days" },
  { value: "30d", label: "Next 30 days" },
  { value: "90d", label: "Next 90 days" },
  { value: "all", label: "All upcoming" },
] as const;

const DEFAULT_LABEL = "Next 30 days";

function getLabel(upcoming: string | null): string {
  if (!upcoming) return DEFAULT_LABEL;

  const preset = UPCOMING_PRESETS.find((p) => p.value === upcoming);
  if (preset) return preset.label;

  if (/^\d{4}-\d{2}-\d{2}$/.test(upcoming)) {
    const d = new Date(`${upcoming}T00:00:00`);
    return `Until ${d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })}`;
  }

  return DEFAULT_LABEL;
}

export default function UpcomingDateSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customUntil, setCustomUntil] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const current = searchParams.get("upcoming");
  const label = getLabel(current);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Preserve the top-of-page range params (range/from/to); this control only
  // owns `upcoming`, so the two selectors never clobber each other.
  const navigate = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("upcoming", value);
      const qs = sp.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
      setOpen(false);
      setShowCustom(false);
    },
    [router, pathname, searchParams]
  );

  // `min` on the date input — only future dates make sense here.
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const handleCustomApply = () => {
    if (customUntil) navigate(customUntil);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
        <span>{label}</span>
        <ChevronDown
          className={`h-3 w-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-xl">
          {!showCustom ? (
            <>
              <div className="border-b border-gray-100 p-2">
                <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                  Look ahead
                </p>
                {UPCOMING_PRESETS.map((p) => {
                  const active =
                    current === p.value || (!current && p.value === "30d");
                  return (
                    <button
                      type="button"
                      key={p.value}
                      onClick={() => navigate(p.value)}
                      className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                        active
                          ? "bg-gray-100 font-medium text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                    current && /^\d{4}-\d{2}-\d{2}$/.test(current)
                      ? "bg-gray-100 font-medium text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  Until a date…
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 p-4">
              <p className="text-sm font-semibold text-gray-700">
                Show appointments until
              </p>
              <div>
                <label
                  htmlFor="upcoming-until"
                  className="mb-1 block text-xs text-gray-500"
                >
                  Date
                </label>
                <input
                  id="upcoming-until"
                  type="date"
                  min={minDate}
                  value={customUntil}
                  onChange={(e) => setCustomUntil(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-300 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCustomApply}
                  disabled={!customUntil}
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
