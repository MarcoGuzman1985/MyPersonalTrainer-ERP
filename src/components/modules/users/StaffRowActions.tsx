"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { StaffUser } from "@/types/users";

interface StaffRowActionsProps {
  staff: StaffUser;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function StaffRowActions({ staff, onEdit, onToggleStatus, onDelete }: StaffRowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const isDisabled = staff.status === "disabled";

  return (
    <div className="relative inline-block" ref={ref}>
      <Button variant="ghost" size="icon" icon={MoreHorizontal} aria-label="Acciones" onClick={() => setOpen((o) => !o)} />
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-line bg-surface-elevated py-1 shadow-lg">
          <MenuItem icon={Pencil} label="Editar" onClick={() => { setOpen(false); onEdit(); }} />
          <MenuItem
            icon={isDisabled ? CheckCircle2 : Ban}
            label={isDisabled ? "Reactivar" : "Suspender"}
            onClick={() => { setOpen(false); onToggleStatus(); }}
          />
          <MenuItem icon={Trash2} label="Eliminar" danger onClick={() => { setOpen(false); onDelete(); }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon, label, onClick, danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted ${danger ? "text-red-600" : "text-content"}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
