import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { Skeleton } from "./Skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Variación porcentual respecto al periodo anterior. */
  delta?: number;
  loading?: boolean;
  accent?: "brand" | "teal";
}

export function StatCard({ label, value, icon: Icon, delta, loading, accent = "brand" }: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-32" />
        <Skeleton className="mt-3 h-4 w-20" />
      </Card>
    );
  }

  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-content-muted">{label}</p>
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg",
            accent === "brand" ? "bg-brand-50 text-brand-800 dark:bg-brand-800/20 dark:text-brand-300" : "bg-teal-50 text-teal-700 dark:bg-teal-700/20 dark:text-teal-300",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-content">{value}</p>
      {delta !== undefined && (
        <p className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium", positive ? "text-teal-600" : "text-red-500")}>
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(delta)}% vs. periodo anterior
        </p>
      )}
    </Card>
  );
}
