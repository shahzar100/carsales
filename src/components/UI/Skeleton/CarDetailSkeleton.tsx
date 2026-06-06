"use client";
import React from "react";
import { m } from "motion/react";

/**
 * Skeleton for the car detail/full-page view (CarDetailView.tsx) —
 * hero image gallery, specs grid, description, CTA sidebar.
 */
const CarDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Sticky top bar */}
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="skeleton-shimmer h-5 w-28 rounded" />
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer h-8 w-20 rounded-lg" />
          <div className="skeleton-shimmer h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>

    {/* Hero section */}
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Image gallery */}
          <div className="w-full lg:w-3/5">
            {/* Main image */}
            <m.div
              className="skeleton-shimmer relative aspect-16/10 overflow-hidden rounded-2xl"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Thumbnail strip */}
            <div className="mt-3 flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <m.div
                  key={i}
                  className="skeleton-shimmer h-16 w-20 shrink-0 rounded-lg"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Info sidebar */}
          <div className="flex w-full flex-col gap-6 lg:w-2/5">
            {/* Title block */}
            <div className="space-y-3">
              <div className="skeleton-shimmer h-8 w-3/4 rounded-lg" />
              <div className="skeleton-shimmer h-5 w-1/2 rounded" />
              <div className="skeleton-shimmer h-10 w-36 rounded-lg" />
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <m.div
                  key={i}
                  className="skeleton-shimmer h-16 rounded-xl"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.08,
                  }}
                />
              ))}
            </div>

            {/* CTA buttons */}
            <div className="space-y-3">
              <m.div
                className="skeleton-shimmer h-12 w-full rounded-xl"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <m.div
                className="skeleton-shimmer h-12 w-full rounded-xl"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.15,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Description / features section */}
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Description */}
        <div className="space-y-4 lg:col-span-2">
          <div className="skeleton-shimmer h-7 w-40 rounded-lg" />
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <m.div
                key={i}
                className="skeleton-shimmer h-4 rounded"
                style={{ width: i === 3 ? "65%" : "100%" }}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>

          {/* Features grid */}
          <div className="mt-6">
            <div className="skeleton-shimmer mb-4 h-6 w-28 rounded-lg" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <m.div
                  key={i}
                  className="skeleton-shimmer h-8 w-24 rounded-full"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Contact sidebar */}
        <div className="space-y-4">
          <div className="skeleton-shimmer h-40 rounded-2xl" />
        </div>
      </div>
    </section>
  </div>
);

export default CarDetailSkeleton;
