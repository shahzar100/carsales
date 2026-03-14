"use client";
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";

  title?: string;
}

const sizeClasses = {
  sm: "w-11/12 sm:w-1/3 h-auto max-h-[60vh]",
  md: "w-11/12 sm:w-1/2 h-1/2",
  lg: "w-11/12 sm:w-2/3 h-2/3",
  xl: "w-11/12 sm:w-4/5 h-4/5",
  full: "w-full h-full m-4",
};

const Modal = ({ title, children, onClose, size = "lg" }: ModalProps) => {
  const [mounted, setMounted] = useState(false);

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    setMounted(true);
    document.body.style.overflowY = "hidden";
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.body.style.overflowY = "";
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [handleEscapeKey]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex flex-col gap-4 overflow-y-auto rounded-lg border bg-white p-8 ${sizeClasses[size]}`}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-xl font-bold"> {title} </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="group transition-all duration-200 rounded-lg flex justify-center items-center gap-2 font-medium cursor-pointer bg-red-600 text-white hover:bg-red-700 py-2.5 px-5 text-sm"
          >
            <X />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
