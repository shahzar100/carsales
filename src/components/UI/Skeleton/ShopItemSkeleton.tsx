"use client";
import React from "react";
import { motion } from "framer-motion";

/**
 * Skeleton for the customer-facing shop item card (Item.tsx) —
 * dark themed card with image, specs pill row, and action buttons.
 */
const ShopItemSkeleton: React.FC = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-gray-950 shadow-md">
    {/* Image */}
    <motion.div
      className="skeleton-shimmer-dark relative aspect-16/10 w-full"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Year badge */}
      <div className="absolute top-3 left-3">
        <div className="h-5 w-12 rounded-full bg-white/10" />
      </div>
      {/* Title + price overlay area */}
      <div className="absolute inset-x-0 bottom-0 space-y-2 px-5 pb-4">
        <div className="h-5 w-36 rounded bg-white/10" />
        <div className="flex items-baseline justify-between">
          <div className="h-6 w-24 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
      </div>
    </motion.div>

    {/* Content */}
    <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
      {/* Spec pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="h-6 w-20 rounded-full bg-white/5 ring-1 ring-white/10"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
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
      <div className="mt-auto flex gap-2">
        <motion.div
          className="h-10 flex-1 rounded-lg bg-white/5 ring-1 ring-white/10"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1,
          }}
        />
        <motion.div
          className="h-10 flex-1 rounded-lg bg-red-600/20"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />
      </div>
    </div>
  </div>
);

/** Grid of shop-item skeletons (mirrors ItemGrid layout) */
export const ShopItemSkeletonGrid: React.FC<{ count?: number }> = ({
  count = 6,
}) => (
  <>
    {/* Desktop grid */}
    <div className="hidden grid-cols-1 gap-6 md:grid-cols-2 lg:grid xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.08 }}
        >
          <ShopItemSkeleton />
        </motion.div>
      ))}
    </div>

    {/* Mobile single */}
    <div className="flex flex-col gap-4 lg:hidden">
      <ShopItemSkeleton />
      <div className="flex items-center justify-center gap-3">
        <div className="skeleton-shimmer h-9 w-9 rounded-full" />
        <div className="skeleton-shimmer h-4 w-16 rounded" />
        <div className="skeleton-shimmer h-9 w-9 rounded-full" />
      </div>
    </div>
  </>
);

export default ShopItemSkeleton;
