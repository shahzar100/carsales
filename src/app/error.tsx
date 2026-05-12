"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { logError } from "@/lib/utils/observability";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    logError(error, { context: "app/error.tsx", digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-md text-gray-600">
          An unexpected error occurred. Please try again or return to the home
          page.
        </p>
        {error.digest && (
          <p className="mt-2 text-sm text-gray-400">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-red-600 px-6 py-2.5 text-white transition-colors hover:bg-red-700"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
