"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import { updateStaff } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import type { Role, StaffUser } from "@/types/users";

interface EditStaffModalProps {
  open: boolean;
  onClose: () => void;
  staff: StaffUser | null;
  roles: Role[];
  onSaved: () => void;
}

export function EditStaffModal({ open, onClose, staff, roles, onSaved }: EditStaffModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staff) return;
    setName(staff.name);
    setEmail(staff.email);
    setRoleId(staff.roleId);
    setError(null);
  }, [staff]);

  if (!staff) return null;

  async function handleSubmit() {
    if (!staff) return;
    setSaving(true);
    setError(null);
    try {
      await updateStaff(staff.id, { name, email, roleId });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar usuario"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving}>Guardar cambios</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre completo" htmlFor="edit-staff-name">
          <Input id="edit-staff-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Correo electrónico" htmlFor="edit-staff-email">
          <Input id="edit-staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Rol" htmlFor="edit-staff-role">
          <Select id="edit-staff-role" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
