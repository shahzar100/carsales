"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";

// ═════════════════════════════════════════════════════════════
// DateSelector — client component that sets URL search params
// so the server component can filter data by date range
// ═════════════════════════════════════════════════════════════

const PRESET_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "21d", label: "Last 21 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function getLabel(
  range: string | null,
  from: string | null,
  to: string | null
): string {
  if (!range || range === "all") return "All time";

  const preset = PRESET_RANGES.find((p) => p.value === range);
  if (preset) return preset.label;

  if (range.startsWith("month-")) {
    const idx = parseInt(range.split("-")[1]);
    const year = new Date().getFullYear();
    if (!isNaN(idx) && idx >= 0 && idx < 12) return `${MONTHS[idx]} ${year}`;
  }

  if (range === "custom" && from && to) {
    const f = new Date(from).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    const t = new Date(to).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    return `${f} – ${t}`;
  }

  return "All time";
}

export default function DateSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const currentRange = searchParams.get("range");
  const currentFrom = searchParams.get("from");
  const currentTo = searchParams.get("to");
  const label = getLabel(currentRange, currentFrom, currentTo);

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

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) sp.set(k, v);
      });
      // The Upcoming card owns its own `upcoming` window param — preserve it
      // so changing the top-of-page range doesn't reset it (and vice versa).
      const upcoming = searchParams.get("upcoming");
      if (upcoming) sp.set("upcoming", upcoming);
      const qs = sp.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
      setOpen(false);
      setShowCustom(false);
    },
    [router, pathname, searchParams]
  );

  const handlePreset = (value: string) => {
    if (value === "all") {
      navigate({});
    } else {
      navigate({ range: value });
    }
  };

  const handleMonth = (idx: number) => {
    navigate({ range: `month-${idx}` });
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      navigate({ range: "custom", from: customFrom, to: customTo });
    }
  };

  const handleClear = () => {
    navigate({});
  };

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <Calendar className="h-4 w-4 text-gray-400" />
        <span>{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Clear badge (when a filter is active) */}
      {currentRange && currentRange !== "all" && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute -top-1.5 -right-1.5 rounded-full bg-gray-900 p-0.5 text-white shadow-sm transition-colors hover:bg-gray-700"
          title="Clear filter"
          aria-label="Clear filter"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-xl">
          {!showCustom ? (
            <>
              {/* Quick presets */}
              <div className="border-b border-gray-100 p-2">
                <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                  Quick ranges
                </p>
                {PRESET_RANGES.map((p) => (
                  <button
                    type="button"
                    key={p.value}
                    onClick={() => handlePreset(p.value)}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                      currentRange === p.value ||
                      (!currentRange && p.value === "all")
                        ? "bg-gray-100 font-medium text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Months */}
              <div className="border-b border-gray-100 p-2">
                <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                  {currentYear}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {MONTHS.map((m, i) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => handleMonth(i)}
                      disabled={i > currentMonth}
                      className={`rounded-lg px-2 py-1.5 text-center text-xs transition-colors ${
                        i > currentMonth
                          ? "cursor-not-allowed text-gray-300"
                          : currentRange === `month-${i}`
                            ? "bg-gray-900 font-medium text-white"
                            : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom range trigger */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                    currentRange === "custom"
                      ? "bg-gray-100 font-medium text-gray-900"
                      : "text-gray-600"
                  }`}
                >
                  Custom date range…
                </button>
              </div>
            </>
          ) : (
            /* Custom date inputs */
            <div className="space-y-3 p-4">
              <p className="text-sm font-semibold text-gray-700">
                Custom Range
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="date-selector-custom-from"
                    className="mb-1 block text-xs text-gray-500"
                  >
                    From
                  </label>
                  <input
                    id="date-selector-custom-from"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="date-selector-custom-to"
                    className="mb-1 block text-xs text-gray-500"
                  >
                    To
                  </label>
                  <input
                    id="date-selector-custom-to"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-300 focus:outline-none"
                  />
                </div>
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
                  disabled={!customFrom || !customTo}
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
