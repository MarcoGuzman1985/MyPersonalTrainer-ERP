"use client";

import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Checkbox nativo estilizado. El sistema de diseño no exporta uno,
 * así que lo definimos localmente para el editor de permisos RBAC.
 */
export function Checkbox({ checked, onChange, label, disabled, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 text-sm text-content",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-line bg-surface accent-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-800/40"
      />
      {label && <span className="truncate">{label}</span>}
    </label>
  );
}
