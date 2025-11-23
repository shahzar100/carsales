"use client";
import React from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/contexts/ToastContext";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  // Don't render anything on the server
  if (typeof window === "undefined") {
    return null;
  }

  if (toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed top-4 right-4"
      style={{ zIndex: 999999 }} // Ensure maximum z-index
    >
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>,
    document.body
  );
}
