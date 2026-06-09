/**
 * EmptyState — the panel shown in place of a list/table when there's
 * nothing to render yet. Replaces five inline empty panels flagged by the
 * reusability audit (admin tables, BrowseFleet "no results", carparts list,
 * dashboards). Always include a clear path forward — either an action
 * button or instructional copy — so the panel doesn't read as a dead end.
 *
 * Usage:
 *
 * ```tsx
 * <EmptyState
 *   icon={Car}
 *   title="No cars in inventory yet"
 *   description="Add your first car to start taking bookings."
 *   action={<Button onClick={openCarForm}>Add a car</Button>}
 * />
 * ```
 */

"use client";
import React from "react";
import type { LucideIcon } from "lucide-react";
import { m } from "motion/react";

interface EmptyStateProps {
  /** Lucide icon component (not an instance — pass `Car`, not `<Car />`). */
  icon?: LucideIcon;
  /** Title — short, sentence case. "No bookings yet". */
  title: string;
  /** Optional description — explains why the list is empty and what to do. */
  description?: React.ReactNode;
  /** Optional CTA button or link, rendered below the description. */
  action?: React.ReactNode;
  /** Compact variant for sidebars or sub-tabs. */
  size?: "sm" | "md" | "lg";
  /** Use a dashed border for "drop zone" / "add the first item" feel.
   *  Defaults to dashed only when an `action` is present; unactionable
   *  empty states get a calmer solid border so they don't read as a
   *  prompt to drop/add something. */
  dashed?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  sm: "py-8 px-4 gap-2",
  md: "py-12 px-6 gap-3",
  lg: "py-16 px-8 gap-4",
};

const ICON_SIZE_CLASSES: Record<NonNullable<EmptyStateProps["size"]>, string> =
  {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  dashed,
  className = "",
}) => {
  // A dashed "drop zone" border only makes sense when there's something to
  // do (an action). When unactionable, default to a calmer solid border.
  const useDashed = dashed ?? Boolean(action);
  return (
    <m.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "flex flex-col items-center justify-center text-center",
        useDashed
          ? "rounded-xl border-2 border-dashed border-gray-200 bg-gray-50"
          : "rounded-xl border border-gray-200 bg-gray-50",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
    >
      {Icon && (
        <m.span
          initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.05 }}
        >
          <Icon
            className={`text-gray-400 ${ICON_SIZE_CLASSES[size]}`}
            aria-hidden="true"
          />
        </m.span>
      )}
      <m.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.12 }}
        className="text-base font-semibold text-gray-900"
      >
        {title}
      </m.h3>
      {description && (
        <m.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.18 }}
          className="max-w-md text-sm text-gray-500"
        >
          {description}
        </m.p>
      )}
      {action && (
        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.24 }}
          className="mt-2"
        >
          {action}
        </m.div>
      )}
    </m.div>
  );
};

export default EmptyState;
