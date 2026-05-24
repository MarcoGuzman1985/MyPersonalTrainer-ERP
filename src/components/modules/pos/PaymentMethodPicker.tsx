"use client";

import { Banknote, CreditCard, ArrowRightLeft, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/store/usePosStore";

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
}

export const paymentMeta: Record<PaymentMethod, { label: string; icon: LucideIcon }> = {
  cash: { label: "Efectivo", icon: Banknote },
  card: { label: "Tarjeta", icon: CreditCard },
  transfer: { label: "Transferencia", icon: ArrowRightLeft },
  wallet: { label: "Wallet", icon: Wallet },
};

const methods: PaymentMethod[] = ["cash", "card", "transfer", "wallet"];

/** Botones grandes táctiles para elegir el método de pago. */
export function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {methods.map((m) => {
        const { label, icon: Icon } = paymentMeta[m];
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              active
                ? "border-brand-800 bg-brand-50 text-brand-800 dark:bg-brand-800/20 dark:text-brand-300"
                : "border-line bg-surface text-content-muted hover:bg-surface-muted",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
