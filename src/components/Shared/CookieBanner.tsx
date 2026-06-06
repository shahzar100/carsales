"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";

/**
 * Cookie consent banner with granular GDPR controls.
 *
 * Storage:
 *   - "cookie-consent" → "accepted" | "rejected" | "customized" (coarse signal
 *     used to decide whether to show the banner; preserves the existing key
 *     so analytics gating like `localStorage["cookie-consent"] === "accepted"`
 *     continues to work).
 *   - "cookie-preferences" → JSON { necessary, functional, analytics, marketing,
 *     timestamp, version } — the granular per-category record. Read this when
 *     gating individual scripts/loaders.
 *
 * UX:
 *   - Pinned to the bottom of the viewport.
 *   - Initial actions: Reject all, Customize, Accept all (+ privacy link).
 *   - Customize expands an inline panel with one toggle per category.
 *   - Necessary cookies are always on and locked.
 *   - Focus moves to the dialog on mount, traps inside it, returns to the
 *     originally-focused element on dismiss. Escape rejects all.
 */

const CONSENT_KEY = "cookie-consent";
const PREFS_KEY = "cookie-preferences";
const PREFS_VERSION = 1;

type Category = "necessary" | "functional" | "analytics" | "marketing";

type Preferences = Record<Category, boolean>;

const DEFAULT_PREFS: Preferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

const CATEGORY_COPY: Record<
  Category,
  { label: string; description: string; locked?: boolean }
> = {
  necessary: {
    label: "Strictly necessary",
    description:
      "Required for the site to work — sign-in, security, and saving your choices on this banner. These can't be turned off.",
    locked: true,
  },
  functional: {
    label: "Functional",
    description:
      "Remember preferences like saved cars and recent searches to improve your experience.",
  },
  analytics: {
    label: "Analytics",
    description:
      "Help us understand how visitors use the site so we can improve it. Aggregated and anonymous.",
  },
  marketing: {
    label: "Marketing",
    description:
      "Used to measure ad performance and show you relevant offers. Off by default.",
  },
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (stored !== "accepted" && stored !== "rejected" && stored !== "customized") {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible || !dialogRef.current) return;

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    focusables()[0]?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        persist("rejected", { ...DEFAULT_PREFS });
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, showCustomize]);

  const persist = (
    choice: "accepted" | "rejected" | "customized",
    next: Preferences
  ) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CONSENT_KEY, choice);
      window.localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          ...next,
          version: PREFS_VERSION,
          timestamp: new Date().toISOString(),
        })
      );
    }
    setVisible(false);
    previousFocusRef.current?.focus();
  };

  const acceptAll = () =>
    persist("accepted", {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });

  const rejectAll = () => persist("rejected", { ...DEFAULT_PREFS });

  const saveCustom = () => persist("customized", prefs);

  const toggle = (key: Category) => {
    if (CATEGORY_COPY[key].locked) return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <AnimatePresence>
    {visible && (
    <m.div
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-live="polite"
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 360, damping: 30, delay: 0.15 }}
      className="fixed inset-x-3 bottom-3 z-100 mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:bottom-6 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p id="cookie-banner-title" className="text-sm font-semibold text-gray-900">
            We use cookies
          </p>
          <p className="mt-1 text-sm text-gray-600">
            We use essential cookies to keep the site working, and — with your
            permission — functional, analytics, and marketing cookies to
            improve your experience. You can choose which to allow.{" "}
            <Link
              href="/privacy"
              className="font-medium text-red-600 underline-offset-2 hover:underline"
            >
              Read our Privacy Policy
            </Link>
            .
          </p>
        </div>
        {!showCustomize && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-red-100 focus:outline-none"
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={() => setShowCustomize(true)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-red-100 focus:outline-none"
            >
              Customize
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-200 focus:outline-none"
            >
              Accept all
            </button>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
      {showCustomize && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="text-sm font-semibold text-gray-900">
            Cookie preferences
          </p>
          <ul className="mt-3 space-y-3">
            {(Object.keys(CATEGORY_COPY) as Category[]).map((key, idx) => {
              const { label, description, locked } = CATEGORY_COPY[key];
              const checked = locked ? true : prefs[key];
              return (
                <m.li
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.1, duration: 0.2 }}
                  className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {label}
                      {locked && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gray-700 uppercase">
                          Always on
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                      {description}
                    </p>
                  </div>
                  <label
                    className={`relative inline-flex shrink-0 cursor-pointer items-center ${
                      locked ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggle(key)}
                      aria-label={`${label} cookies`}
                    />
                    <span className="h-5 w-9 rounded-full bg-gray-300 transition-colors peer-checked:bg-red-600 peer-focus-visible:ring-2 peer-focus-visible:ring-red-200" />
                    <m.span
                      className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow"
                      animate={{ x: checked ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </label>
                </m.li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-red-100 focus:outline-none"
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-red-100 focus:outline-none"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={saveCustom}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-200 focus:outline-none"
            >
              Save preferences
            </button>
          </div>
        </div>
        </m.div>
      )}
      </AnimatePresence>
    </m.div>
    )}
    </AnimatePresence>
  );
}
