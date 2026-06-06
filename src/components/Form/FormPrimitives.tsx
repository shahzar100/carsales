"use client";
import React, { useId, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Copy,
  CheckCheck,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";

/**
 * Inline validation message with a subtle fade + shake on first appearance.
 * Used by FormInput and FormTextarea — keep them visually consistent so
 * "an error appeared" reads the same anywhere on the page.
 */
const FieldError: React.FC<{ id?: string; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <AnimatePresence>
    {children && (
      <m.p
        id={id}
        role="alert"
        initial={{ opacity: 0, y: -4, x: 0 }}
        animate={{
          opacity: 1,
          y: 0,
          x: [0, -6, 6, -4, 4, -2, 0],
          transition: {
            opacity: { duration: 0.15 },
            y: { duration: 0.15 },
            x: { duration: 0.32, ease: "easeOut" },
          },
        }}
        exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
        className="mt-1 text-xs text-red-600"
      >
        {children}
      </m.p>
    )}
  </AnimatePresence>
);

// ═════════════════════════════════════════════════════════════
// Button
// ═════════════════════════════════════════════════════════════
type ButtonVariant = "primary" | "secondary" | "ghost" | "success" | "danger";

export const FormButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
}> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  loadingText,
  icon,
  iconPosition = "right",
  className = "",
}) => {
  const base =
    "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
    secondary: "text-gray-700 hover:text-red-500 hover:bg-red-100",
    ghost: "cursor-not-allowed text-gray-300",
    success:
      "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          {children}
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </button>
  );
};

// Convenience buttons used by Form.tsx navigation
export const NextButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}> = ({ onClick, disabled }) => (
  <FormButton
    onClick={onClick}
    disabled={disabled}
    icon={<ChevronRight className="h-4 w-4" />}
  >
    Next
  </FormButton>
);

export const PreviousButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}> = ({ onClick, disabled }) => (
  <FormButton
    onClick={onClick}
    variant={disabled ? "ghost" : "secondary"}
    disabled={disabled}
    icon={<ChevronLeft className="h-4 w-4" />}
    iconPosition="left"
  >
    Previous
  </FormButton>
);

export const SubmitButton: React.FC<{
  label?: string;
  loading?: boolean;
  disabled?: boolean;
}> = ({ label = "Submit", loading, disabled }) => (
  <FormButton
    type="submit"
    variant="success"
    loading={loading}
    disabled={disabled}
    loadingText="Submitting..."
    icon={!loading ? <Check className="h-4 w-4" /> : undefined}
  >
    {label}
  </FormButton>
);

// ═════════════════════════════════════════════════════════════
// Badge
// ═════════════════════════════════════════════════════════════
type BadgeColour = "blue" | "amber" | "red" | "emerald" | "gray";

const badgeColours: Record<BadgeColour, string> = {
  blue: "bg-red-50 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  emerald: "bg-emerald-100 text-emerald-700",
  gray: "bg-gray-100 text-gray-700",
};

export const Badge: React.FC<{
  children: React.ReactNode;
  colour?: BadgeColour;
  icon?: React.ReactNode;
}> = ({ children, colour = "gray", icon }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColours[colour]}`}
  >
    {icon}
    {children}
  </span>
);

// ═════════════════════════════════════════════════════════════
// Info Banner  (note / warning / success / error callouts)
// ═════════════════════════════════════════════════════════════
type BannerVariant = "info" | "warning" | "success" | "error";

const bannerStyles: Record<BannerVariant, string> = {
  info: "border-red-100 bg-red-50/50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

export const InfoBanner: React.FC<{
  children: React.ReactNode;
  variant?: BannerVariant;
  className?: string;
  /**
   * Optional leading icon (e.g. <AlertCircle className="h-4 w-4 shrink-0" />).
   * When present we wrap it + the children in a flex row so the icon sits
   * to the left of the text.
   */
  icon?: React.ReactNode;
  /**
   * When true, wrap the banner in the standard fade-in + horizontal shake
   * presentation used for form error banners across the auth pages. Pair
   * with `key={message}` on the parent if you want it to re-shake on each
   * new error string.
   */
  animated?: boolean;
}> = ({ children, variant = "info", className = "", icon, animated = false }) => {
  const base = `rounded-lg border text-sm ${bannerStyles[variant]} ${className}`;
  const inner = icon ? (
    <div className="flex items-start gap-2 px-4 py-3">
      {icon}
      <span>{children}</span>
    </div>
  ) : (
    <div className="px-4 py-3">{children}</div>
  );

  if (!animated) {
    return <div className={base}>{inner}</div>;
  }

  // Same motion spec the inline auth error banners were using before
  // they migrated to InfoBanner — single source of truth for the shake.
  return (
    <m.div
      initial={{ opacity: 0, y: -4, height: 0 }}
      animate={{
        opacity: 1,
        y: 0,
        height: "auto",
        x: [0, -6, 6, -4, 4, -2, 0],
        transition: {
          opacity: { duration: 0.18 },
          y: { duration: 0.18 },
          height: { duration: 0.18 },
          x: { duration: 0.36, ease: "easeOut" },
        },
      }}
      exit={{ opacity: 0, y: -4, height: 0, transition: { duration: 0.15 } }}
      style={{ overflow: "hidden" }}
      className={base}
    >
      {inner}
    </m.div>
  );
};

// ═════════════════════════════════════════════════════════════
// Selection Card  (radio-like card with optional checklist)
// ═════════════════════════════════════════════════════════════
export const SelectionCard: React.FC<{
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  items?: string[];
  activeColour?: string; // tailwind border+bg classes when selected
}> = ({
  selected,
  onSelect,
  title,
  description,
  items,
  activeColour = "border-red-500 bg-red-50/50",
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
      selected
        ? `${activeColour} shadow-sm`
        : "border-gray-200 bg-white hover:border-gray-300"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-gray-900">{title}</span>
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
          selected ? "border-red-600 bg-red-600" : "border-gray-300 bg-white"
        }`}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>
    </div>
    {description && <p className="text-xs text-gray-500">{description}</p>}
    {items && items.length > 0 && (
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-1.5 text-xs text-gray-600"
          >
            <span className="text-emerald-500">✓</span>
            {item}
          </li>
        ))}
      </ul>
    )}
  </button>
);

// ═════════════════════════════════════════════════════════════
// Copyable Code  (success card with copy-to-clipboard)
// ═════════════════════════════════════════════════════════════
export const CopyableCode: React.FC<{
  value: string;
  title?: string;
  description?: string;
}> = ({ value, title = "Success", description }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <CheckCheck className="h-5 w-5 text-emerald-600" />
        <h4 className="text-sm font-semibold text-emerald-800">{title}</h4>
      </div>
      {description && (
        <p className="mb-3 text-xs text-emerald-700">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg border border-emerald-300 bg-white px-4 py-2.5 font-mono text-sm tracking-wider text-gray-900 select-all">
          {value}
        </code>
        <FormButton
          onClick={handleCopy}
          variant={copied ? "success" : "secondary"}
          icon={
            copied ? (
              <CheckCheck className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )
          }
          iconPosition="left"
          className={
            !copied ? "border border-gray-300 bg-white hover:bg-gray-50" : ""
          }
        >
          {copied ? "Copied" : "Copy"}
        </FormButton>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// Styled Input
//
// Generates a unique id with `useId()` and wires `htmlFor`/`id` so
// screen readers correctly associate the visible label with the input.
// (CODEBASE_ISSUES G4.) Forwards `required` + `aria-required` and
// supports an `error` prop so the field can describe its own validation
// failure to assistive tech via `aria-describedby`/`aria-invalid`.
// ═════════════════════════════════════════════════════════════
export const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Optional inline error — also wires `aria-invalid` + `aria-describedby`. */
  error?: string;
}> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
  max,
  disabled,
  error,
}) => {
  const generatedId = useId();
  const inputId = `form-input-${generatedId}`;
  const errorId = error ? `form-input-error-${generatedId}` : undefined;
  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// Styled Textarea
// (CODEBASE_ISSUES G4 — same label-association fix as FormInput.)
// ═════════════════════════════════════════════════════════════
export const FormTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
}> = ({ label, value, onChange, placeholder, rows = 3, required, error }) => {
  const generatedId = useId();
  const inputId = `form-textarea-${generatedId}`;
  const errorId = error ? `form-textarea-error-${generatedId}` : undefined;
  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none"
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// Toggle Switch
// ═════════════════════════════════════════════════════════════
export const FormToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-red-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

// ═════════════════════════════════════════════════════════════
// Summary Row
// ═════════════════════════════════════════════════════════════
export const SummaryRow: React.FC<{
  label: string;
  value?: string;
  children?: React.ReactNode;
}> = ({ label, value, children }) => (
  <div className="flex items-center justify-between border-b border-dashed border-gray-100 py-1.5 last:border-0">
    <span className="text-gray-500">{label}</span>
    {children || (
      <span className="font-medium text-gray-900">{value || "—"}</span>
    )}
  </div>
);

// ═════════════════════════════════════════════════════════════
// Summary Card
// ═════════════════════════════════════════════════════════════
export const SummaryCard: React.FC<{
  children: React.ReactNode;
  title?: string;
}> = ({ children, title = "Summary" }) => (
  <div className="rounded-lg border border-gray-200 bg-white">
    <div className="border-b border-gray-100 px-5 py-3">
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
    </div>
    <div className="grid gap-x-8 gap-y-2 px-5 py-4 text-sm sm:grid-cols-2">
      {children}
    </div>
  </div>
);
