"use client";
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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

const Modal = ({
  title,
  children,
  onClose,
  size = "lg",
  variant = "default",
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Body scroll lock is owned by useScrollLock so multiple overlays
  // (Modal + NavMenu + ConfirmDialog) can share the lock without racing.
  useScrollLock(true);

  useEffect(() => {
    setMounted(true);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [handleEscapeKey]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`relative max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl ${sizeClasses[size]} ${
          variant === "default" ? "flex flex-col gap-4 p-8" : ""
        }`}
      >
        {variant === "default" && (
          <div className="flex items-center justify-between gap-4">
            <h2 id="modal-title" className="text-xl font-bold">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700"
            >
              <X />
            </button>
          </div>
        )}

        {variant === "clean" && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
