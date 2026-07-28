"use client";

import { useUiStore } from "@/store/useUiStore";
import { useToastStore } from "@/store/useToastStore";
import { NewMemberModal } from "@/components/modules/members/NewMemberModal";

/** Renderizado en el layout raíz del dashboard, fuera del Topbar a propósito. */
export function GlobalQuickAddMember() {
  const open = useUiStore((s) => s.quickAddMemberOpen);
  const setOpen = useUiStore((s) => s.setQuickAddMemberOpen);
  const pushToast = useToastStore((s) => s.push);

  return (
    <NewMemberModal
      open={open}
      onClose={() => setOpen(false)}
      onCreated={(member) => pushToast(`Socio "${member.name}" creado correctamente.`)}
    />
  );
}
