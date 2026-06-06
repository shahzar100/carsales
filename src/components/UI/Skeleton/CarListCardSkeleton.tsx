"use client";
import React from "react";
import { m } from "motion/react";

/**
 * Skeleton for the horizontal list-card layout (CarListCard.tsx) —
 * image on left, content on right, action row at the bottom.
 */
const CarListCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
    <div className="flex flex-col sm:flex-row">
      {/* Image placeholder */}
      <m.div
        className="skeleton-shimmer relative aspect-16/10 w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-64 md:w-72 lg:w-80"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Badge placeholders */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="skeleton-shimmer h-5 w-16 rounded-full" />
        </div>
      </m.div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        {/* Title + Price row */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="skeleton-shimmer h-6 w-44 rounded-md" />
            <div className="flex items-center gap-2">
              <div className="skeleton-shimmer h-4 w-12 rounded" />
              <div className="skeleton-shimmer h-4 w-24 rounded" />
            </div>
          </div>
          <div className="hidden shrink-0 space-y-1 sm:block">
            <div className="skeleton-shimmer h-8 w-28 rounded-md" />
            <div className="skeleton-shimmer ml-auto h-3 w-16 rounded" />
          </div>
        </div>

        {/* Specs row */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <m.div
              key={i}
              className="skeleton-shimmer h-7 w-24 rounded-lg"
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

        {/* Features */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <m.div
              key={i}
              className="skeleton-shimmer h-5 w-16 rounded-full"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
            />
          ))}
        </div>

        {/* Action bar */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="skeleton-shimmer h-2 w-2 rounded-full" />
            <div className="skeleton-shimmer h-4 w-16 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
            <div className="skeleton-shimmer h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Multiple list-card skeletons stacked */
export const CarListCardSkeletonGrid: React.FC<{ count?: number }> = ({
  count = 3,
}) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <m.div
        key={i}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: i * 0.1 }}
      >
        <CarListCardSkeleton />
      </m.div>
    ))}
  </div>
);

export default CarListCardSkeleton;
