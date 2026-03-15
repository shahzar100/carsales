"use client";
import React from "react";
import { motion } from "framer-motion";

/**
 * Skeleton for the admin Cars card view (Cars.tsx) —
 * large featured card with image, specs grid, and action buttons.
 */
const CarCardSkeleton: React.FC = () => (
  <div className="w-full">
    {/* Header row */}
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="skeleton-shimmer h-8 w-36 rounded-lg" />
        <div className="skeleton-shimmer h-6 w-10 rounded-md" />
      </div>
      <div className="skeleton-shimmer h-5 w-14 rounded" />
    </div>

    {/* Main card */}
    <div className="mt-4 w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
      <div className="flex flex-col md:flex-row">
        {/* Image placeholder */}
        <motion.div
          className="skeleton-shimmer relative aspect-4/3 w-full md:aspect-auto lg:w-1/2"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <div className="skeleton-shimmer h-5 w-16 rounded-full" />
            <div className="skeleton-shimmer h-5 w-16 rounded-full" />
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex w-full flex-col p-4 md:p-5">
          {/* Title & Price row */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="space-y-2">
              <div className="skeleton-shimmer h-6 w-48 rounded-md" />
              <div className="skeleton-shimmer h-4 w-32 rounded" />
            </div>
            <div className="skeleton-shimmer h-7 w-24 rounded-md" />
          </div>

          {/* Specs grid */}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="skeleton-shimmer h-8 rounded-lg"
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
          <div className="mb-3 flex flex-wrap gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="skeleton-shimmer h-6 w-20 rounded-full"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 border-t border-gray-100 pt-3">
            <div className="skeleton-shimmer h-9 flex-1 rounded-lg" />
            <div className="skeleton-shimmer h-9 flex-1 rounded-lg" />
            <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>
    </div>

    {/* Thumbnail strip */}
    <div className="mt-3 flex gap-2 overflow-hidden pb-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="skeleton-shimmer h-12 w-16 shrink-0 rounded-lg"
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
  </div>
);

export default CarCardSkeleton;
