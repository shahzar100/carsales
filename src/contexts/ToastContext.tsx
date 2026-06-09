"use client";
import React, {
  createContext,
  use,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Toast, ToastContextType, DEFAULT_TOAST_DURATION } from "./types";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toastData: Omit<Toast, "id">) => {
      const id = generateId();
      const toast: Toast = {
        ...toastData,
        id,
        duration: toastData.duration ?? DEFAULT_TOAST_DURATION,
      };

      setToasts((prevToasts) => [...prevToasts, toast]);

      // Auto-dismissal is owned by the Toast component's pausable countdown
      // (so hovering can pause it before the toast disappears); we only
      // register the toast here.
      return id;
    },
    [generateId]
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const success = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: "success",
        title,
        message,
        ...options,
      });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: "error",
        title,
        message,
        duration: options?.duration ?? 7000, // Errors stay longer by default
        ...options,
      });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: "warning",
        title,
        message,
        duration: options?.duration ?? 6000, // Warnings stay a bit longer
        ...options,
      });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: "info",
        title,
        message,
        ...options,
      });
    },
    [addToast]
  );

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = use(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export { ToastContext };
