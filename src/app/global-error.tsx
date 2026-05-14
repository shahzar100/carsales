"use client";

import { useEffect } from "react";
import { logError } from "@/lib/utils/observability";

/**
 * Global error boundary — catches errors thrown in the root layout
 * itself, which the route-level `error.tsx` can't reach because it
 * renders *inside* that layout. It replaces the entire document, so it
 * renders its own `<html>` / `<body>`.
 *
 * KNOWN ISSUE — `next build` currently fails while prerendering the
 * synthetic `/_global-error` route with
 * "TypeError: Cannot read properties of null (reading 'useContext')".
 * This was investigated extensively (Auth-hardening branch):
 *   - reproduces with a zero-import, zero-hook version of this file,
 *   - reproduces under both Turbopack and webpack,
 *   - reproduces on Next 16.1.6 and 16.2.6, React 19.1.0 and 19.2.0,
 *   - the failing frame is pure framework code — the built
 *     `_global-error/page.js` references none of our source files.
 * So it's a Next.js framework bug, not app code. The file is kept
 * because it's still the correct runtime error boundary (and good
 * practice); the build failure needs a Next-side fix or upstream issue.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { context: "app/global-error.tsx", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600">
              Something went wrong
            </h1>
            <p className="mt-3 max-w-md text-gray-600">
              An unexpected error occurred. Please try again or return to the
              home page.
            </p>
            {error.digest && (
              <p className="mt-2 text-sm text-gray-400">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="rounded-lg bg-red-600 px-6 py-2.5 text-white transition-colors hover:bg-red-700"
            >
              Try again
            </button>
            {/* Plain anchor, not next/link: global-error renders outside
                the app-router tree, so the Link router context isn't
                available here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
