"use client";

import { useState } from "react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import type { InviteUserInput, Role } from "@/types/users";

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  onInvite?: (input: InviteUserInput) => void;
}

/** Modal de invitación de personal con asignación de rol. */
export function InviteUserModal({ open, onClose, roles, onInvite }: InviteUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>(roles[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isValid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && roleId !== "";

  const reset = () => {
    setName("");
    setEmail("");
    setRoleId(roles[0]?.id ?? "");
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    // TODO(backend): POST /api/users/invite
    //   await inviteUser({ name, email, roleId });
    await new Promise((r) => setTimeout(r, 600));
    onInvite?.({ name: name.trim(), email: email.trim(), roleId });
    setSubmitting(false);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invitar usuario"
      description="Enviaremos un correo con el enlace de acceso al ERP."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!isValid}>
            Enviar invitación
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre completo" htmlFor="invite-name">
          <Input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Sofía Martínez"
            autoComplete="off"
          />
        </Field>
        <Field label="Correo electrónico" htmlFor="invite-email">
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="persona@gimnasio.com"
            autoComplete="off"
          />
        </Field>
        <Field label="Rol" htmlFor="invite-role" hint="Define qué módulos podrá usar.">
          <Select id="invite-role" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
