"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Day 9 / Fix 9.1 — cookie consent banner.
 *
 * Future-proofs analytics: when Google Analytics / Plausible / etc. is
 * wired, gate the loader on `localStorage.cookie-consent === "accepted"`.
 * Nothing is gated today; this is the consent signal sitting in place.
 *
 * UX:
 *   - Pinned to the bottom of the viewport, above WhatsAppButton z-index.
 *   - Two actions: Accept, Reject. Either choice persists and the banner
 *     hides for that browser.
 *   - aria-live="polite" so screen readers announce it when it appears.
 *   - Focus moves to the dialog on mount + traps inside it; Escape rejects.
 *   - Returns focus to whatever was active when the banner appeared.
 */

const STORAGE_KEY = "cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== "accepted" && stored !== "rejected") {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible || !dialogRef.current) return;

    // Focus the first interactive element when the banner appears.
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    );
    focusables[0]?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss("rejected");
        return;
      }
      if (e.key !== "Tab") return;
      // Trap focus inside the dialog.
      const list = Array.from(focusables);
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
    // dismiss is stable (defined below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismiss = (choice: "accepted" | "rejected") => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, choice);
    }
    setVisible(false);
    previousFocusRef.current?.focus();
  };

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-100 mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:bottom-6 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p id="cookie-banner-title" className="text-sm font-semibold text-gray-900">
            We use cookies
          </p>
          <p className="mt-1 text-sm text-gray-600">
            We use a small set of essential cookies to keep the site working.
            With your permission we&apos;ll add analytics later — accept now
            and you won&apos;t see this again.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => dismiss("rejected")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-red-100 focus:outline-none"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => dismiss("accepted")}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-200 focus:outline-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
