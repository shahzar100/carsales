"use client";
import React, { useEffect, useState } from "react";
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { Toast as ToastType } from "@/contexts/types";

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: {
    container: "bg-white border-l-4 border-green-500 shadow-lg",
    icon: "text-green-500",
    title: "text-green-800",
    message: "text-green-700",
    progress: "bg-green-500",
  },
  error: {
    container: "bg-white border-l-4 border-red-500 shadow-lg",
    icon: "text-red-500",
    title: "text-red-800",
    message: "text-red-700",
    progress: "bg-red-500",
  },
  warning: {
    container: "bg-white border-l-4 border-yellow-500 shadow-lg",
    icon: "text-yellow-500",
    title: "text-yellow-800",
    message: "text-yellow-700",
    progress: "bg-yellow-500",
  },
  info: {
    container: "bg-white border-l-4 border-blue-500 shadow-lg",
    icon: "text-blue-500",
    title: "text-blue-800",
    message: "text-blue-700",
    progress: "bg-blue-500",
  },
};

export default function Toast({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isRemoving, setIsRemoving] = useState(false);

  const Icon = toastIcons[toast.type];
  const styles = toastStyles[toast.type];

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Progress bar animation (only if not persistent and has duration)
    let progressTimer: NodeJS.Timeout;
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      const updateInterval = 50; // Update every 50ms
      const decrement = (updateInterval / toast.duration) * 100;

      progressTimer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - decrement;
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, updateInterval);
    }

    return () => {
      clearTimeout(showTimer);
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [toast.persistent, toast.duration]);

  const handleRemove = () => {
    if (isRemoving) return;

    setIsRemoving(true);
    setIsVisible(false);

    // Wait for exit animation before removing
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
    }
  };

  return (
    <div
      className={`
        relative max-w-md w-full rounded-lg p-4 mb-3 transition-all duration-300 ease-in-out transform
        ${styles.container}
        ${
          isVisible
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }
        ${isRemoving ? "translate-x-full opacity-0 scale-95" : ""}
      `}
    >
      {/* Progress bar */}
      {!toast.persistent && toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-50 ease-linear ${styles.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          <Icon className={`w-5 h-5 ${styles.icon}`} />
        </div>

        {/* Content */}
        <div className="ml-3 flex-1 min-w-0">
          <div className={`text-sm font-semibold ${styles.title}`}>
            {toast.title}
          </div>
          {toast.message && (
            <div className={`mt-1 text-sm ${styles.message}`}>
              {toast.message}
            </div>
          )}

          {/* Action button */}
          {toast.action && (
            <div className="mt-3">
              <button
                onClick={handleAction}
                className={`text-sm font-medium hover:underline focus:outline-none ${styles.title}`}
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={handleRemove}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
