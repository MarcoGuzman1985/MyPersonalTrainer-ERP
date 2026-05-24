"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative z-10 w-full animate-fade-in rounded-2xl border border-line bg-surface-elevated shadow-xl", sizes[size])}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div>
              {title && <h3 className="text-lg font-semibold text-content">{title}</h3>}
              {description && <p className="mt-1 text-sm text-content-muted">{description}</p>}
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-content-subtle hover:bg-surface-muted hover:text-content" aria-label="Cerrar">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-line p-5">{footer}</div>}
      </div>
    </div>
  );
}
