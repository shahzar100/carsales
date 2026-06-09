"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
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
  const [progress, setProgress] = useState(100);
  const [present, setPresent] = useState(true);
  // Hovering pauses the auto-dismiss countdown so errors aren't hidden
  // before they've been read; leaving resumes it.
  const pausedRef = useRef(false);

  const Icon = toastIcons[toast.type];
  const styles = toastStyles[toast.type];

  useEffect(() => {
    // Drive both the progress bar AND the auto-dismiss from one pausable
    // countdown (only if not persistent and has a duration). Hovering sets
    // pausedRef, which freezes the elapsed clock so the toast isn't removed
    // while the user is reading it.
    if (toast.persistent || !toast.duration || toast.duration <= 0) {
      return;
    }
    const duration = toast.duration;
    const updateInterval = 50; // ms
    let elapsed = 0;

    const progressTimer = setInterval(() => {
      if (pausedRef.current) return; // paused on hover → no time passes
      elapsed += updateInterval;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
      if (elapsed >= duration) {
        clearInterval(progressTimer);
        setPresent(false); // exit animation → onExitComplete → onRemove
      }
    }, updateInterval);

    return () => clearInterval(progressTimer);
  }, [toast.persistent, toast.duration]);

  const handleRemove = () => setPresent(false);

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
    }
  };

  return (
    <AnimatePresence onExitComplete={() => onRemove(toast.id)}>
      {present && (
        <m.div
          role="alert"
          layout
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
          initial={{ x: 380, scale: 0.9, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          exit={{ x: 380, scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className={`relative mb-3 w-full max-w-md rounded-lg p-4 ${styles.container}`}
        >
          {/* Progress bar */}
          {!toast.persistent && toast.duration && toast.duration > 0 && (
            <div className="absolute right-0 bottom-0 left-0 h-1 overflow-hidden rounded-b-lg bg-gray-200">
              <div
                className={`h-full transition-all duration-50 ease-linear ${styles.progress}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex items-start">
            {/* Icon */}
            <m.div
              className="shrink-0 pt-0.5"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 460, damping: 18, delay: 0.08 }}
            >
              <Icon className={`h-5 w-5 ${styles.icon}`} />
            </m.div>

            {/* Content */}
            <div className="ml-3 min-w-0 flex-1">
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
                  <m.button
                    onClick={handleAction}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`text-sm font-medium hover:underline focus:outline-none ${styles.title}`}
                  >
                    {toast.action.label}
                  </m.button>
                </div>
              )}
            </div>

            {/* Close button */}
            <div className="ml-4 shrink-0">
              <m.button
                onClick={handleRemove}
                aria-label="Close notification"
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 420, damping: 16 }}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </m.button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
