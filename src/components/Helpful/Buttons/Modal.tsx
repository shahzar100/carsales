"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
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

  useEffect(() => {
    setMounted(true);
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "";
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50">
      <div
        className={`flex flex-col gap-4 overflow-y-auto rounded-lg border bg-white p-8 ${sizeClasses[size]}`}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold"> {title} </h2>
          <Button disabled={false} onClick={onClose}>
            <X />
          </Button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
