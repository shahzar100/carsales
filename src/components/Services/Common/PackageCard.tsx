import React from "react";

// ── Accent colour tokens ────────────────────────────────────
// Full class names so Tailwind JIT picks them up.
export type AccentColor = "blue" | "purple" | "green";

export const accentColors: Record<
  AccentColor,
  {
    border: string;
    badge: string;
    text: string;
    hoverBorder: string;
    primaryBtn: string;
    secondaryBtn: string;
    highlight: string;
    highlightIcon: string;
  }
> = {
  blue: {
    border: "border-blue-500",
    badge: "bg-blue-500",
    text: "text-blue-600",
    hoverBorder: "hover:border-blue-300",
    primaryBtn: "bg-blue-600 text-white hover:bg-blue-700",
    secondaryBtn: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    highlight: "text-blue-700",
    highlightIcon: "text-blue-500",
  },
  purple: {
    border: "border-purple-500",
    badge: "bg-purple-500",
    text: "text-purple-600",
    hoverBorder: "hover:border-purple-300",
    primaryBtn: "bg-purple-600 text-white hover:bg-purple-700",
    secondaryBtn: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    highlight: "text-purple-700",
    highlightIcon: "text-purple-500",
  },
  green: {
    border: "border-green-500",
    badge: "bg-green-500",
    text: "text-green-600",
    hoverBorder: "hover:border-green-300",
    primaryBtn: "bg-green-600 text-white hover:bg-green-700",
    secondaryBtn: "bg-green-100 text-green-700 hover:bg-green-200",
    highlight: "text-green-700",
    highlightIcon: "text-green-500",
  },
};

// ── PackageCard ─────────────────────────────────────────────
interface PackageCardProps {
  /** Package / option name */
  name: string;
  /** Secondary line under the name (e.g. "Ceramic Film", "Mini Valet") */
  subtitle?: string;
  /** Price string (e.g. "£280", "£300–£600") */
  price: string;
  /** Extra info below price (e.g. duration) */
  extra?: string;
  /** Mark as the "popular" option */
  popular?: boolean;
  /** Label inside the popular badge */
  popularLabel?: string;
  /** Accent colour scheme (default "blue") */
  accent?: AccentColor;
  /** Body content between header and CTAs (features, info boxes, etc.) */
  children: React.ReactNode;
  /** Optional footer content (e.g. link button) rendered below the body */
  footer?: React.ReactNode;
}

const PackageCard: React.FC<PackageCardProps> = ({
  name,
  subtitle,
  price,
  extra,
  popular = false,
  popularLabel = "Most Popular",
  accent = "blue",
  children,
  footer,
}) => {
  const c = accentColors[accent];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 bg-white p-4 transition-all duration-300 sm:p-7 ${
        popular
          ? `lg:scale-105 transform ${c.border} shadow-lg`
          : `border-gray-200 ${c.hoverBorder} hover:shadow-md`
      }`}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
          <span
            className={`rounded-full ${c.badge} px-4 py-2 text-sm font-medium text-white`}
          >
            {popularLabel}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 text-center">
        <h3 className="mb-0.5 text-2xl font-bold text-gray-900">{name}</h3>
        {subtitle && (
          <div className={`mb-1 text-base font-medium ${c.text}`}>
            {subtitle}
          </div>
        )}
        <div className={`text-3xl font-bold ${c.text}`}>{price}</div>
        {extra && <div className="text-xs text-gray-500">{extra}</div>}
      </div>

      {/* Body (features, info boxes, etc.) */}
      <div className="flex-1">{children}</div>

      {/* Optional footer */}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};

export default PackageCard;
