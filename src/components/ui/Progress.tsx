import { cn } from "@/lib/utils";
import type { Tone } from "@/types/shared";

interface ProgressProps {
  value: number; // 0-100
  tone?: Tone;
  className?: string;
}

const bars: Record<Tone, string> = {
  neutral: "bg-content-subtle",
  brand: "bg-brand-700",
  success: "bg-teal-600",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
};

export function Progress({ value, tone = "brand", className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 ease-linear", bars[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
