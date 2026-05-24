import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="max-w-2xl text-center">
        <p className="text-sm font-semibold tracking-wider text-red-600 uppercase">
          404
        </p>
        <h1 className="page-title mt-2">Page not found</h1>
        <p className="description mt-4">
          The page you&apos;re looking for may have moved or been removed.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/BrowseFleet"
          className="rounded-lg bg-red-600 px-6 py-2.5 text-center text-white transition-colors hover:bg-red-700"
        >
          Browse our fleet
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-center text-gray-700 transition-colors hover:bg-gray-50"
        >
          Visit homepage
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-center text-gray-700 transition-colors hover:bg-gray-50"
        >
          Contact us
        </Link>
      </div>
    </main>
  );
}
