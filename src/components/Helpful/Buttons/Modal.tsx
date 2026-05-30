"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Optional variant. "default" has the standard header; "clean" renders
   *  children only with a floating close button (good for share modals). */
  variant?: "default" | "clean";
  title?: string;
}

const sizeClasses = {
  sm: "w-11/12 sm:max-w-sm",
  md: "w-11/12 sm:max-w-md",
  lg: "w-11/12 sm:max-w-lg",
  xl: "w-11/12 sm:max-w-xl",
  full: "w-full h-full m-4",
};

// CSS selector for elements that can receive Tab focus. Used by the focus
// trap below to find the dialog's first/last focusable child.
const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const Modal = ({
  title,
  children,
  onClose,
  size = "lg",
  variant = "default",
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Element that had focus before the modal opened — restored on close.
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap: cycle Tab/Shift-Tab inside the dialog.
  // Without this, Tab walks back into the page underneath, which violates
  // the WAI-ARIA dialog pattern and confuses keyboard / SR users.
  const handleFocusTrap = useCallback((event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (active === first || active === dialog)) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && active === last) {
      first.focus();
      event.preventDefault();
    }
  }, []);

  // Body scroll lock is owned by useScrollLock so multiple overlays
  // (Modal + NavMenu + ConfirmDialog) can share the lock without racing.
  useScrollLock(true);

  useEffect(() => {
    setMounted(true);
    // Remember who had focus, then move focus into the dialog so the trap
    // has somewhere to start.
    previousActiveElement.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;

    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("keydown", handleFocusTrap);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("keydown", handleFocusTrap);
      // Restore focus on close. Guard with optional chaining: the previous
      // element may have been removed from the DOM by the time we close.
      previousActiveElement.current?.focus?.();
    };
  }, [handleEscapeKey, handleFocusTrap]);

  // After the dialog mounts, move focus to the first focusable element
  // inside it — usually the close button. Run after the portal renders.
  useEffect(() => {
    if (!mounted) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const first = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        // tabIndex=-1 so the dialog is a focus target programmatically
        // even when no children are focusable (e.g. content-only "clean"
        // variant). The focus trap relies on `document.activeElement`
        // being inside the dialog.
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className={`relative max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl ${sizeClasses[size]} ${
          variant === "default" ? "flex flex-col gap-4 p-8" : ""
        }`}
      >
        {variant === "default" && (
          <div className="flex items-center justify-between gap-4">
            <h2 id="modal-title" className="text-xl font-bold">
              {title}
            </h2>
            <motion.button
              onClick={onClose}
              aria-label="Close"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              <X />
            </motion.button>
          </div>
        )}

        {variant === "clean" && (
          <motion.button
            onClick={onClose}
            aria-label="Close"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}

        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default Modal;
