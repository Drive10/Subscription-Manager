import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

let toastId = 0;

const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

const emitChange = () => {
  listeners.forEach((l) => l(toasts));
};

export const toast = {
  success: (title: string, description?: string) => {
    const id = String(++toastId);
    toasts = [...toasts, { id, title, description, variant: "success" }];
    emitChange();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emitChange();
    }, 4000);
  },
  error: (title: string, description?: string) => {
    const id = String(++toastId);
    toasts = [...toasts, { id, title, description, variant: "destructive" }];
    emitChange();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emitChange();
    }, 5000);
  },
  default: (title: string, description?: string) => {
    const id = String(++toastId);
    toasts = [...toasts, { id, title, description, variant: "default" }];
    emitChange();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emitChange();
    }, 3000);
  },
};

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  useState(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  });

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, []);

  return { toasts: state, dismiss };
}
