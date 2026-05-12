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

import React from "react";
import type { LucideIcon } from "lucide-react";

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
   *  Defaults to true when no action is provided (i.e. unactionable empty
   *  states feel calmer). */
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
  const useDashed = dashed ?? true;
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "flex flex-col items-center justify-center text-center",
        useDashed
          ? "rounded-xl border-2 border-dashed border-gray-200 bg-gray-50"
          : "rounded-xl bg-gray-50",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
    >
      {Icon && (
        <Icon
          className={`text-gray-400 ${ICON_SIZE_CLASSES[size]}`}
          aria-hidden="true"
        />
      )}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="max-w-md text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
