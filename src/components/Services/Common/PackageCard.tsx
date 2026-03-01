import React from "react";

// ── Accent colour tokens ────────────────────────────────────
// Full class names so Tailwind JIT picks them up.
export type AccentColor = "red" | "crimson" | "dark";

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
  red: {
    border: "border-red-500",
    badge: "bg-red-600",
    text: "text-red-400",
    hoverBorder: "hover:border-red-500/60",
    primaryBtn: "bg-red-600 text-white hover:bg-red-500",
    secondaryBtn:
      "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
    highlight: "text-red-400",
    highlightIcon: "text-red-400",
  },
  crimson: {
    border: "border-red-600",
    badge: "bg-red-700",
    text: "text-red-400",
    hoverBorder: "hover:border-red-600/60",
    primaryBtn: "bg-red-700 text-white hover:bg-red-600",
    secondaryBtn:
      "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
    highlight: "text-red-400",
    highlightIcon: "text-red-400",
  },
  dark: {
    border: "border-gray-600",
    badge: "bg-gray-700",
    text: "text-gray-300",
    hoverBorder: "hover:border-gray-500",
    primaryBtn: "bg-white text-gray-900 hover:bg-gray-100",
    secondaryBtn:
      "bg-white/10 text-gray-300 border border-white/10 hover:bg-white/15",
    highlight: "text-gray-300",
    highlightIcon: "text-gray-400",
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
  accent = "red",
  children,
  footer,
}) => {
  const c = accentColors[accent];

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ${
        popular
          ? `border border-red-500/50 shadow-2xl shadow-red-500/20 lg:scale-105`
          : `border border-white/12 hover:-translate-y-1 hover:border-white/25 hover:shadow-xl hover:shadow-red-500/10`
      }`}
      style={{
        background: popular
          ? "linear-gradient(160deg, rgba(220,38,38,0.20) 0%, rgba(220,38,38,0.08) 50%, rgba(30,5,5,0.95) 100%)"
          : "linear-gradient(160deg, rgba(220,38,38,0.14) 0%, rgba(220,38,38,0.05) 50%, rgba(25,5,5,0.95) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Glass shine overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-red-600/10 via-transparent to-transparent" />

      {/* Card inner */}
      <div className="relative flex flex-1 flex-col p-5 sm:p-7">
        {/* Top accent line */}
        <div
          className={`absolute top-0 right-4 left-4 h-0.5 rounded-full ${
            popular
              ? "bg-linear-to-r from-transparent via-red-500 to-transparent"
              : "bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          }`}
        />

        {/* Popular badge */}
        {popular && (
          <div className="absolute -top-px left-1/2 -translate-x-1/2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-b-lg ${c.badge} px-5 py-1.5 text-xs font-semibold tracking-wide text-white uppercase shadow-lg`}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {popularLabel}
            </span>
          </div>
        )}

        {/* Header */}
        <div className={`text-center ${popular ? "mt-4" : ""}`}>
          <h3 className="text-lg font-bold tracking-tight text-white">
            {name}
          </h3>
          {subtitle && (
            <div className={`mt-1 text-sm font-medium ${c.text}`}>
              {subtitle}
            </div>
          )}
          <div
            className={`mt-2 text-3xl font-extrabold tracking-tight ${c.text}`}
          >
            {price}
          </div>
          {extra && (
            <div className="mt-1 text-xs font-medium text-gray-500">
              {extra}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-5 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

        {/* Body */}
        <div className="flex-1">{children}</div>

        {/* Footer */}
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  );
};

export default PackageCard;
