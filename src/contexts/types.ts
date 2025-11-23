export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  success: (
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => string;
  error: (title: string, message?: string, options?: Partial<Toast>) => string;
  warning: (
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => string;
  info: (title: string, message?: string, options?: Partial<Toast>) => string;
}

export const DEFAULT_TOAST_DURATION = 5000;
