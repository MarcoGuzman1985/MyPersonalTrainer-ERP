import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Bloque de carga con efecto shimmer, usado en tablas y tarjetas. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer before:bg-gradient-to-r",
        "before:from-transparent before:via-black/5 before:to-transparent dark:before:via-white/10",
        className,
      )}
      {...props}
    />
  );
}
