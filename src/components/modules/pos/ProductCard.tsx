"use client";

import { Crown, Package, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui";
import type { PosProduct } from "@/store/usePosStore";

interface ProductCardProps {
  product: PosProduct;
  onAdd: (p: PosProduct) => void;
}

/** Tarjeta táctil grande del catálogo. Al pulsar añade la línea al carrito. */
export function ProductCard({ product, onAdd }: ProductCardProps) {
  const isMembership = product.kind === "membership";
  const outOfStock = product.stock === 0;
  const Icon = isMembership ? Crown : Package;

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={() => onAdd(product)}
      aria-label={`Añadir ${product.name}`}
      className={cn(
        "group relative flex h-full min-h-[120px] flex-col justify-between rounded-2xl border border-line bg-surface p-4 text-left transition-all",
        "hover:border-brand-500 hover:shadow-md active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
        outOfStock && "pointer-events-none opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isMembership ? "bg-brand-50 text-brand-800 dark:bg-brand-800/20 dark:text-brand-300" : "bg-surface-muted text-content-muted",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {outOfStock ? (
          <Badge tone="danger">Sin stock</Badge>
        ) : isMembership ? (
          <Badge tone="brand">Membresía</Badge>
        ) : typeof product.stock === "number" ? (
          <Badge tone="neutral">{product.stock} ud</Badge>
        ) : null}
      </div>

      <div className="mt-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-content">{product.name}</p>
        <p className="mt-1 text-lg font-bold text-content">{formatCurrency(product.price)}</p>
      </div>

      <span className="pointer-events-none absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-800 text-white opacity-0 transition-opacity group-hover:opacity-100">
        <Plus className="h-4 w-4" />
      </span>
    </button>
  );
}
