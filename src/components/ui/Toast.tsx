"use client";

import { CheckCircle2, XCircle, X } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/lib/utils";

/** Monta una sola vez (en el layout); renderiza los toasts activos del store global. */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-2.5 rounded-lg border border-line bg-surface-elevated p-3.5 text-sm shadow-lg animate-fade-in",
          )}
        >
          {t.variant === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-red-600" />
          )}
          <p className="flex-1 text-content">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-content-subtle hover:text-content" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
