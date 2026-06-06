"use client";
import React from "react";
import { m } from "motion/react";

// ── Base skeleton primitives ───────────────────────────────

interface SkeletonProps {
  className?: string;
  /** Width — any CSS value (default: "100%") */
  width?: string | number;
  /** Height — any CSS value (default: "1rem") */
  height?: string | number;
  /** Border radius — tailwind-style or CSS value */
  rounded?: string;
}

/**
 * A single animated skeleton block with a shimmer effect.
 * Compose more complex skeletons by combining these primitives.
 */
export const SkeletonBlock: React.FC<SkeletonProps> = ({
  className = "",
  width = "100%",
  height = "1rem",
  rounded = "rounded-lg",
}) => (
  <m.div
    className={`skeleton-shimmer ${rounded} ${className}`}
    style={{ width, height }}
    initial={{ opacity: 0.5 }}
    animate={{ opacity: [0.5, 0.8, 0.5] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
  />
);

/** Circular skeleton — avatars, icons, etc. */
export const SkeletonCircle: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className = "" }) => (
  <m.div
    className={`skeleton-shimmer rounded-full ${className}`}
    style={{ width: size, height: size }}
    initial={{ opacity: 0.5 }}
    animate={{ opacity: [0.5, 0.8, 0.5] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
  />
);

/** Skeleton text lines — simulates paragraph text */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  gap?: string;
}> = ({ lines = 3, className = "", gap = "gap-2.5" }) => (
  <div className={`flex flex-col ${gap} ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <m.div
        key={i}
        className="skeleton-shimmer rounded"
        style={{
          height: "0.75rem",
          width: i === lines - 1 ? "60%" : "100%",
        }}
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
);

/** Image placeholder — aspect ratio skeleton */
export const SkeletonImage: React.FC<{
  className?: string;
  aspectRatio?: string;
}> = ({ className = "", aspectRatio = "aspect-16/10" }) => (
  <m.div
    className={`skeleton-shimmer ${aspectRatio} w-full rounded-xl ${className}`}
    initial={{ opacity: 0.4 }}
    animate={{ opacity: [0.4, 0.7, 0.4] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  />
);

/**
 * Wrapper that shows skeleton for a configurable duration,
 * then fades in the real content.
 */
export const SkeletonWrapper: React.FC<{
  /** Whether skeleton is still showing */
  isLoading: boolean;
  /** The skeleton placeholder to render */
  skeleton: React.ReactNode;
  /** The actual content to reveal */
  children: React.ReactNode;
}> = ({ isLoading, skeleton, children }) => {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
};
