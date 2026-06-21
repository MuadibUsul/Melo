"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const TOAST_EVENT = "studio-toast";

/** Fire a toast from anywhere in the client (event handlers, async code). */
export function toast(message: string, variant: ToastVariant = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<Omit<ToastItem, "id">>(TOAST_EVENT, { detail: { message, variant } }),
  );
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const tones: Record<ToastVariant, string> = {
  success: "text-meter-green",
  error: "text-destructive",
  info: "text-studio-gold",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let counter = 0;
    function onToast(event: Event) {
      const detail = (event as CustomEvent<Omit<ToastItem, "id">>).detail;
      const id = ++counter;
      setItems((current) => [...current, { id, ...detail }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 3200);
    }

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  function dismiss(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => {
        const Icon = icons[item.variant];
        return (
          <div
            key={item.id}
            role="status"
            className="studio-surface pointer-events-auto flex items-start gap-3 rounded-lg p-3.5 text-sm shadow-lg animate-[toast-in_0.18s_ease-out]"
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", tones[item.variant])} />
            <span className="flex-1 leading-6">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="关闭提示"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
