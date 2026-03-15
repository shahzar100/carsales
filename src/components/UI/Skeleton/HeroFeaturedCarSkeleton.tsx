"use client";
import React from "react";
import { motion } from "framer-motion";

/**
 * Skeleton for the hero section's featured car card —
 * dark-themed to match the hero's black background.
 */
const HeroFeaturedCarSkeleton: React.FC = () => (
  <div className="relative">
    <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-white/6 to-white/2 shadow-2xl ring-1 shadow-black/40 ring-white/5">
      {/* Image placeholder */}
      <motion.div
        className="skeleton-shimmer-dark relative aspect-16/10 w-full"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Featured badge placeholder */}
        <div className="absolute top-4 left-4">
          <div className="h-6 w-20 rounded-full bg-white/10" />
        </div>
      </motion.div>

      {/* Details placeholder */}
      <div className="space-y-4 p-5 sm:p-6">
        {/* Title block */}
        <div className="space-y-2">
          <motion.div
            className="h-6 w-3/4 rounded bg-white/10"
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
            className="h-4 w-1/2 rounded bg-white/8"
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

        {/* Price row */}
        <div className="flex items-end justify-between">
          <motion.div
            className="h-8 w-28 rounded bg-white/10"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.15,
            }}
          />
          <motion.div
            className="h-4 w-20 rounded bg-white/8"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.25,
            }}
          />
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-2">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="h-6 w-32 rounded-full bg-white/5 ring-1 ring-white/10"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex w-full gap-3 pt-1">
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
  </div>
);

export default HeroFeaturedCarSkeleton;
