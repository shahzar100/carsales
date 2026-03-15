"use client";
import React from "react";
import { motion } from "framer-motion";

/**
 * Skeleton for a single PackageCard — dark-themed to match
 * the black background of PackageGrid sections.
 */
const PackageCardSkeleton: React.FC<{ popular?: boolean }> = ({
  popular = false,
}) => (
  <div
    className={`relative flex flex-col overflow-hidden rounded-2xl ${
      popular
        ? "border border-red-500/50 shadow-2xl shadow-red-500/20 lg:scale-105"
        : "border border-white/12"
    }`}
    style={{
      background: popular
        ? "linear-gradient(160deg, rgba(220,38,38,0.20) 0%, rgba(220,38,38,0.08) 50%, rgba(30,5,5,0.95) 100%)"
        : "linear-gradient(160deg, rgba(220,38,38,0.14) 0%, rgba(220,38,38,0.05) 50%, rgba(25,5,5,0.95) 100%)",
    }}
  >
    <div className="relative flex flex-1 flex-col p-5 sm:p-7">
      {/* Popular badge placeholder */}
      {popular && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <motion.div
            className="h-7 w-28 rounded-b-lg bg-red-600/30"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* Header — name, subtitle, price */}
      <div className={`space-y-3 text-center ${popular ? "mt-4" : ""}`}>
        <motion.div
          className="mx-auto h-5 w-40 rounded bg-white/10"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="mx-auto h-4 w-24 rounded bg-white/8"
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
          className="mx-auto h-8 w-28 rounded bg-white/10"
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
          className="mx-auto h-3 w-20 rounded bg-white/6"
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

      {/* Divider */}
      <div className="my-5 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      {/* Feature list placeholder */}
      <div className="flex-1 space-y-3">
        {[85, 92, 78, 88, 70].map((width, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <motion.div
              className="h-4 w-4 shrink-0 rounded-full bg-white/8"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.08,
              }}
            />
            <motion.div
              className="h-3 rounded bg-white/8"
              style={{ width: `${width}%` }}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.08,
              }}
            />
          </div>
        ))}
      </div>

      {/* Footer button placeholder */}
      <motion.div
        className="mt-5 h-11 w-full rounded-xl bg-white/8"
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
  </div>
);

/** Grid of package card skeletons */
export const PackageCardSkeletonGrid: React.FC<{
  count?: number;
  columns?: 2 | 3;
  popularIndex?: number;
}> = ({ count = 3, columns = 3, popularIndex = 1 }) => (
  <div
    className={`mx-auto grid max-w-7xl gap-6 lg:gap-8 ${
      columns === 2
        ? "md:max-w-5xl md:grid-cols-2"
        : "md:grid-cols-2 lg:grid-cols-3"
    }`}
  >
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: i * 0.1 }}
      >
        <PackageCardSkeleton popular={i === popularIndex} />
      </motion.div>
    ))}
  </div>
);

export default PackageCardSkeleton;
