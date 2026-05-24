"use client";

import { useEffect, useRef } from "react";
import { logError } from "@/lib/utils/observability";

/**
 * Global error boundary — catches errors thrown in the root layout
 * itself, which the route-level `error.tsx` can't reach because it
 * renders *inside* that layout. It replaces the entire document, so it
 * renders its own `<html>` / `<body>`.
 *
 * `logError` is called exactly once per error instance via a ref guard;
 * React 19 / dev StrictMode would otherwise fire the effect twice and
 * double-report the same error to Sentry.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    logError(error, { boundary: "global-error", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
          <div className="max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wider text-red-600 uppercase">
              Error
            </p>
            <h1 className="page-title mt-2">Something went wrong</h1>
            <p className="description mt-4">
              Something went wrong on our end. We&apos;ve been notified and are
              looking into it.
            </p>
            {error.digest && (
              <p className="mt-3 text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-red-600 px-6 py-2.5 text-white transition-colors hover:bg-red-700"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Reload the page
            </button>
            {/* Plain anchor, not next/link: global-error renders outside
                the app-router tree, so the Link router context isn't
                available here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-center text-gray-700 transition-colors hover:bg-gray-50"
            >
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
