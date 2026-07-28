"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Modal, Button, Field, Input, Select, Badge } from "@/components/ui";
import { inviteUser, type InviteUserResult } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import type { Role } from "@/types/users";

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  /** Se llama tras invitar con éxito, para refrescar listas/métricas. */
  onInvited?: () => void;
}

/** Modal de invitación de personal con asignación de rol. */
export function InviteUserModal({ open, onClose, roles, onInvited }: InviteUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>(roles[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteUserResult | null>(null);

  const isValid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && roleId !== "";

  const reset = () => {
    setName("");
    setEmail("");
    setRoleId(roles[0]?.id ?? "");
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const invited = await inviteUser({ name: name.trim(), email: email.trim(), roleId });
      setResult(invited);
      onInvited?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar la invitación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invitar usuario"
      description={result ? undefined : "Se generará una contraseña temporal y se le enviará por correo."}
      size="md"
      footer={
        result ? (
          <div className="flex justify-end">
            <Button onClick={handleClose}>Listo</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!isValid}>
              Enviar invitación
            </Button>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <p className="text-sm text-content-muted">
            Cuenta creada para <span className="font-medium text-content">{result.name}</span>. Deberá
            cambiar esta contraseña en su primer inicio de sesión.
          </p>
          <div className="space-y-2 rounded-lg border border-line bg-surface-muted p-4">
            <p className="text-sm text-content-muted">
              Envía esto a <span className="font-medium text-content">{result.email}</span>:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-surface px-3 py-2 text-sm font-mono">
                {result.tempPassword}
              </code>
              <Button
                variant="outline"
                size="icon"
                icon={Copy}
                aria-label="Copiar contraseña"
                onClick={() => navigator.clipboard.writeText(result.tempPassword)}
              />
            </div>
            <Badge tone={result.emailSent ? "success" : "danger"} dot>
              {result.emailSent ? "Correo enviado" : "No se pudo enviar el correo — compártela manualmente"}
            </Badge>
          </div>
        </div>
      ) : (
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
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
