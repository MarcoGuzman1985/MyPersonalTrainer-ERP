"use client";

import { useState, type FormEvent } from "react";
import { Trash2, Plus, Pencil } from "lucide-react";
import { Modal, Button, Field, Input, Textarea } from "@/components/ui";
import { createCoach, updateCoach, deleteCoach } from "@/lib/api/coaches";
import { ApiError } from "@/lib/api/client";
import type { Coach } from "@/types/schedule";

interface CoachManagerModalProps {
  open: boolean;
  onClose: () => void;
  coaches: Coach[];
  onChanged: () => void;
}

const emptyForm = {
  firstName: "", lastName: "", dob: "", phone: "", address: "", email: "", anthropometricData: "{}",
};

function toForm(c: Coach) {
  return {
    firstName: c.firstName, lastName: c.lastName, dob: c.dob ?? "", phone: c.phone ?? "",
    address: c.address ?? "", email: c.email ?? "",
    anthropometricData: JSON.stringify(c.anthropometricData ?? {}, null, 2),
  };
}

export function CoachManagerModal({ open, onClose, coaches, onChanged }: CoachManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function parseAnthropometric(text: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(text || "{}");
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function startEdit(c: Coach) {
    setEditingId(c.id);
    setEditForm(toForm(c));
    setRowError(null);
  }

  async function handleSaveEdit(id: string) {
    const anthropometricData = parseAnthropometric(editForm.anthropometricData);
    if (!anthropometricData) {
      setRowError("El JSON de datos antropométricos no es válido.");
      return;
    }
    setSavingId(id);
    setRowError(null);
    try {
      await updateCoach(id, { ...editForm, dob: editForm.dob || null, anthropometricData });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    setSavingId(id);
    setRowError(null);
    try {
      await deleteCoach(id);
      onChanged();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "No se pudo eliminar.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const anthropometricData = parseAnthropometric(createForm.anthropometricData);
    if (!createForm.firstName || !createForm.lastName) {
      setCreateError("Completa nombre y apellido.");
      return;
    }
    if (!anthropometricData) {
      setCreateError("El JSON de datos antropométricos no es válido.");
      return;
    }

    setCreating(true);
    try {
      await createCoach({ ...createForm, dob: createForm.dob || null, anthropometricData });
      setCreateForm(emptyForm);
      onChanged();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "No se pudo crear el coach.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Administrar coaches" description="Entrenadores del gimnasio disponibles para asignar a clases." size="lg"
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-6">
        <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {coaches.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
              {editingId === c.id ? (
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input placeholder="Nombre" value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} />
                  <Input placeholder="Apellido" value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} />
                  <Input type="date" value={editForm.dob} onChange={(e) => setEditForm((f) => ({ ...f, dob: e.target.value }))} />
                  <Input placeholder="Teléfono" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                  <Input placeholder="Correo" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                  <Input placeholder="Dirección" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
                  <Textarea
                    className="col-span-full min-h-[100px] font-mono text-xs"
                    spellCheck={false}
                    value={editForm.anthropometricData}
                    onChange={(e) => setEditForm((f) => ({ ...f, anthropometricData: e.target.value }))}
                  />
                </div>
              ) : (
                <div>
                  <p className="font-medium text-content">{c.name}</p>
                  <p className="text-content-subtle">{[c.email, c.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}</p>
                </div>
              )}
              <div className="flex shrink-0 gap-2">
                {editingId === c.id ? (
                  <Button size="sm" loading={savingId === c.id} onClick={() => handleSaveEdit(c.id)}>Guardar</Button>
                ) : (
                  <Button variant="outline" size="icon" icon={Pencil} aria-label={`Editar ${c.name}`} onClick={() => startEdit(c)} />
                )}
                <Button variant="outline" size="icon" icon={Trash2} aria-label={`Eliminar ${c.name}`} loading={savingId === c.id && editingId !== c.id} onClick={() => handleDelete(c.id)} />
              </div>
            </li>
          ))}
        </ul>

        {rowError && <p className="text-sm text-red-600">{rowError}</p>}

        <form onSubmit={handleCreate} className="space-y-4 border-t border-line pt-5">
          <p className="text-sm font-medium text-content">Nuevo coach</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="coach-first-name">
              <Input id="coach-first-name" value={createForm.firstName} onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))} required />
            </Field>
            <Field label="Apellido" htmlFor="coach-last-name">
              <Input id="coach-last-name" value={createForm.lastName} onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))} required />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="coach-dob">
              <Input id="coach-dob" type="date" value={createForm.dob} onChange={(e) => setCreateForm((f) => ({ ...f, dob: e.target.value }))} />
            </Field>
            <Field label="Teléfono" htmlFor="coach-phone">
              <Input id="coach-phone" value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label="Correo" htmlFor="coach-email">
              <Input id="coach-email" type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Dirección" htmlFor="coach-address">
              <Input id="coach-address" value={createForm.address} onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))} />
            </Field>
          </div>
          <Field label="Datos antropométricos (JSON)" htmlFor="coach-anthro" hint='Ej. { "weightKg": 78, "heightCm": 178 }'>
            <Textarea
              id="coach-anthro"
              className="min-h-[100px] font-mono text-xs"
              spellCheck={false}
              value={createForm.anthropometricData}
              onChange={(e) => setCreateForm((f) => ({ ...f, anthropometricData: e.target.value }))}
            />
          </Field>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <Button type="submit" icon={Plus} loading={creating}>Crear coach</Button>
        </form>
      </div>
    </Modal>
  );
}
