"use client";

import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const variantStyles = {
  default: "bg-card border border-border",
  destructive: "bg-destructive text-destructive-foreground border-destructive",
  success: "bg-green-600 text-white border-green-700",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right ${variantStyles[t.variant || "default"]}`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && (
              <p className="text-xs mt-0.5 opacity-80">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
