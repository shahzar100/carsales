"use client";

/**
 * Accessible confirmation dialog. Use whenever an action is destructive or
 * irreversible (delete a car, cancel a booking, log out unsaved changes).
 *
 * Built on top of the existing `Helpful/Buttons/Modal`, so it inherits ESC
 * handling, click-outside to dismiss, and body scroll lock. Adds focus
 * management and a default-focused Cancel button so a stray Enter key never
 * fires the destructive action.
 *
 * Usage:
 *
 * ```tsx
 * const [confirming, setConfirming] = useState(false);
 *
 * <Button variant="danger" onClick={() => setConfirming(true)}>Delete</Button>
 * {confirming && (
 *   <ConfirmDialog
 *     title="Delete car?"
 *     description="This permanently removes the listing. Bookings already
 *                  attached to it stay in the dashboard."
 *     confirmLabel="Delete"
 *     variant="danger"
 *     onConfirm={async () => {
 *       await deleteCar(id);
 *       setConfirming(false);
 *     }}
 *     onCancel={() => setConfirming(false)}
 *   />
 * )}
 * ```
 */

import React, { useEffect, useRef } from "react";
import Modal from "@/components/Helpful/Buttons/Modal";
import Button from "@/components/UI/Button";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  /** Short, action-oriented title — "Delete car?" or "Cancel booking?" */
  title: string;
  /** One or two sentences explaining what the action does and any consequences. */
  description: React.ReactNode;
  /** Confirm-button label. Defaults to "Confirm". For destructive actions use the verb ("Delete", "Cancel booking"). */
  confirmLabel?: string;
  /** Cancel-button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * Visual variant.
   *  - `danger`   — red confirm button + alert icon (default for delete/cancel actions).
   *  - `warning`  — amber icon, red confirm (irreversible but not destructive).
   *  - `info`     — neutral; primary confirm (asks for confirmation, no risk).
   */
  variant?: "danger" | "warning" | "info";
  /** Called when the user confirms. Awaited so the button can show a spinner. */
  onConfirm: () => void | Promise<void>;
  /** Called on Cancel, ESC, or backdrop click. */
  onCancel: () => void;
  /** Disable confirm while an external operation is in flight. */
  loading?: boolean;
}

const ICON_BY_VARIANT: Record<
  NonNullable<ConfirmDialogProps["variant"]>,
  { icon: React.ReactNode; bg: string }
> = {
  danger: {
    icon: <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />,
    bg: "bg-red-100",
  },
  warning: {
    icon: <AlertCircle className="h-6 w-6 text-amber-600" aria-hidden="true" />,
    bg: "bg-amber-100",
  },
  info: {
    icon: <AlertCircle className="h-6 w-6 text-gray-700" aria-hidden="true" />,
    bg: "bg-gray-100",
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the safe option (Cancel) on open so a stray Enter key dismisses
  // the dialog instead of firing the destructive action.
  //
  // Modal (our parent) runs its own auto-focus on the first focusable
  // child (the Close × button) inside its own useEffect — parent effects
  // fire *after* child effects, so a synchronous focus call here gets
  // overridden. Defer to the next microtask so Modal's focus runs first
  // and we land on Cancel deterministically. (Test: __tests__/components/
  // UI/ConfirmDialog.test.tsx → "auto-focuses Cancel".)
  useEffect(() => {
    const id = requestAnimationFrame(() => cancelRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const { icon, bg } = ICON_BY_VARIANT[variant];

  const confirmVariant: "danger" | "primary" =
    variant === "info" ? "primary" : "danger";

  return (
    <Modal onClose={onCancel} size="sm" variant="clean">
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${bg}`}
          >
            {icon}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        </div>

        <div className="mt-2 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <Button
            variant={confirmVariant}
            onClick={() => {
              void onConfirm();
            }}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
