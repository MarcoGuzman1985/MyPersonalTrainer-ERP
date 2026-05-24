"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui";
import type { CartLine } from "@/store/usePosStore";

interface CartLineRowProps {
  line: CartLine;
  onInc: (id: CartLine["id"]) => void;
  onDec: (id: CartLine["id"]) => void;
  onRemove: (id: CartLine["id"]) => void;
}

/** Fila del carrito con control de cantidad táctil (+/-) y eliminar. */
export function CartLineRow({ line, onInc, onDec, onRemove }: CartLineRowProps) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-content">{line.name}</p>
        <p className="text-xs text-content-subtle">
          {formatCurrency(line.price)} · {formatCurrency(line.price * line.qty)}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Quitar uno" onClick={() => onDec(line.id)}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-7 text-center text-sm font-semibold tabular-nums text-content">{line.qty}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Añadir uno" onClick={() => onInc(line.id)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-content-subtle hover:text-red-600"
        aria-label={`Eliminar ${line.name}`}
        onClick={() => onRemove(line.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
