import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-gray-900">404</h1>
        <p className="mt-3 text-xl text-gray-600">
          This page could not be found.
        </p>
        <p className="mt-1 text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-red-600 px-6 py-2.5 text-white transition-colors hover:bg-red-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
