"use client";

/**
 * Unified Button primitive — replaces the legacy `Helpful/Buttons/Button` and
 * `Form/FormPrimitives.FormButton` over time. Both will keep working until
 * call sites are migrated.
 *
 * Renders a `<button>` by default, or a Next.js `<Link>` when `href` is
 * provided. The visual styling and disabled/loading behaviour stay identical
 * across both render paths so adding `href` to a button never changes its
 * appearance.
 *
 * Variants:
 *   - primary   → red-600, white text (CTAs, submits)
 *   - secondary → ghost button with red hover (subtle actions)
 *   - outline   → bordered, white background (cancel, secondary actions)
 *   - ghost     → transparent, no background hover (toolbar items)
 *   - danger    → red-600 (visually identical to primary; use for delete-style
 *                 actions so call sites read declaratively)
 *   - success   → emerald-600 (confirmations, completed states)
 *
 * Sizes: `sm`, `md` (default), `lg`.
 *
 * Loading state shows a spinner and disables the button. Icons can be placed
 * before or after the label via `icon` + `iconPosition`.
 */

import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

const MotionLink = motion.create(Link);

const TAP = { scale: 0.97 };
const HOVER = { scale: 1.02 };
const SPRING = { type: "spring" as const, stiffness: 420, damping: 22, mass: 0.6 };

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

type ButtonSize = "sm" | "md" | "lg";

interface CommonProps {
  /** Visible label / contents. */
  children: React.ReactNode;
  /** Visual style. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Size. Defaults to `md`. */
  size?: ButtonSize;
  /** Optional icon. */
  icon?: React.ReactNode;
  /** Icon placement relative to the label. Defaults to `right`. */
  iconPosition?: "left" | "right";
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Disable interaction. `loading` implies `disabled`. */
  disabled?: boolean;
  /** Full-width style. */
  fullWidth?: boolean;
  /** Additional Tailwind utilities, applied last. */
  className?: string;
  /** Aria label, e.g. for icon-only buttons. */
  "aria-label"?: string;
}

interface ButtonAsButtonProps extends CommonProps {
  href?: undefined;
  /** Click handler. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Defaults to `button` so adding `<Button>` inside a form doesn't accidentally submit. */
  type?: "button" | "submit" | "reset";
}

interface ButtonAsLinkProps extends CommonProps {
  /** Render as a Next.js Link. Internal/external links both work. */
  href: string;
  /** Open in a new tab. Adds `rel="noopener noreferrer"` automatically. */
  target?: "_blank";
  /** External absolute URLs use a plain anchor; internal paths use `next/link`. */
  type?: never;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

// ── Style maps ─────────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  secondary:
    "text-gray-700 hover:text-red-600 hover:bg-red-50 focus-visible:ring-red-500",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus-visible:ring-gray-400",
  ghost:
    "text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function buildClassName({
  variant,
  size,
  fullWidth,
  className,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  return [
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function renderInner(
  children: React.ReactNode,
  icon: React.ReactNode | undefined,
  iconPosition: "left" | "right",
  loading: boolean
): React.ReactNode {
  if (loading) {
    return (
      <>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{children}</span>
      </>
    );
  }
  if (icon && iconPosition === "left") {
    return (
      <>
        <span aria-hidden="true">{icon}</span>
        <span>{children}</span>
      </>
    );
  }
  if (icon) {
    return (
      <>
        <span>{children}</span>
        <span aria-hidden="true">{icon}</span>
      </>
    );
  }
  return children;
}

// ── Component ──────────────────────────────────────────────────────────

const Button: React.FC<ButtonProps> = (props) => {
  const {
    children,
    variant = "primary",
    size = "md",
    icon,
    iconPosition = "right",
    loading = false,
    disabled = false,
    fullWidth = false,
    className,
    "aria-label": ariaLabel,
  } = props;

  const cls = buildClassName({ variant, size, fullWidth, className });
  const inner = renderInner(children, icon, iconPosition, loading);
  const interactive = !(disabled || loading);

  if ("href" in props && props.href) {
    // Disabled link — render a non-interactive span styled like the button.
    if (disabled || loading) {
      return (
        <span
          className={cls}
          aria-disabled="true"
          aria-label={ariaLabel}
          role="link"
        >
          {inner}
        </span>
      );
    }

    const isExternal =
      props.href.startsWith("http://") ||
      props.href.startsWith("https://") ||
      props.href.startsWith("mailto:") ||
      props.href.startsWith("tel:");

    if (isExternal) {
      return (
        <motion.a
          href={props.href}
          target={props.target}
          rel={props.target === "_blank" ? "noopener noreferrer" : undefined}
          className={cls}
          aria-label={ariaLabel}
          onClick={props.onClick}
          whileHover={HOVER}
          whileTap={TAP}
          transition={SPRING}
        >
          {inner}
        </motion.a>
      );
    }

    return (
      <MotionLink
        href={props.href}
        target={props.target}
        className={cls}
        aria-label={ariaLabel}
        onClick={props.onClick}
        whileHover={HOVER}
        whileTap={TAP}
        transition={SPRING}
      >
        {inner}
      </MotionLink>
    );
  }

  const buttonProps = props as ButtonAsButtonProps;
  return (
    <motion.button
      type={buttonProps.type ?? "button"}
      disabled={disabled || loading}
      className={cls}
      aria-label={ariaLabel}
      onClick={buttonProps.onClick}
      whileHover={interactive ? HOVER : undefined}
      whileTap={interactive ? TAP : undefined}
      transition={SPRING}
    >
      {inner}
    </motion.button>
  );
};

export default Button;
