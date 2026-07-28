"use client";

import { useState, type FormEvent } from "react";
import { Trash2, Plus, Pencil } from "lucide-react";
import { Modal, Button, Field, Input, Select, Badge } from "@/components/ui";
import { createRoom, updateRoom, deleteRoom } from "@/lib/api/rooms";
import { ApiError } from "@/lib/api/client";
import type { Room } from "@/types/schedule";

interface RoomManagerModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  onChanged: () => void;
}

const emptyForm = { name: "", capacity: "", status: "active" as Room["status"], notes: "" };

export function RoomManagerModal({ open, onClose, rooms, onChanged }: RoomManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function startEdit(r: Room) {
    setEditingId(r.id);
    setEditForm({ name: r.name, capacity: String(r.capacity), status: r.status, notes: r.notes ?? "" });
    setRowError(null);
  }

  async function handleSaveEdit(id: string) {
    setSavingId(id);
    setRowError(null);
    try {
      await updateRoom(id, { ...editForm, capacity: Number(editForm.capacity) });
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
      await deleteRoom(id);
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
    const capacity = Number(createForm.capacity);
    if (!createForm.name || !Number.isInteger(capacity) || capacity <= 0) {
      setCreateError("Completa nombre y capacidad válidos.");
      return;
    }
    setCreating(true);
    try {
      await createRoom({ ...createForm, capacity });
      setCreateForm(emptyForm);
      onChanged();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "No se pudo crear la sala.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Administrar salas" description="Espacios donde se imparten las clases." size="lg"
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-6">
        <ul className="divide-y divide-line rounded-lg border border-line">
          {rooms.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              {editingId === r.id ? (
                <div className="grid flex-1 grid-cols-3 gap-2">
                  <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                  <Input type="number" min={1} value={editForm.capacity} onChange={(e) => setEditForm((f) => ({ ...f, capacity: e.target.value }))} />
                  <Select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Room["status"] }))}>
                    <option value="active">Activa</option>
                    <option value="maintenance">Mantenimiento</option>
                  </Select>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-content">
                    {r.name} <Badge tone={r.status === "active" ? "success" : "warning"} className="ml-2">{r.status === "active" ? "Activa" : "Mantenimiento"}</Badge>
                  </p>
                  <p className="text-content-subtle">Capacidad: {r.capacity}{r.notes ? ` · ${r.notes}` : ""}</p>
                </div>
              )}
              <div className="flex shrink-0 gap-2">
                {editingId === r.id ? (
                  <Button size="sm" loading={savingId === r.id} onClick={() => handleSaveEdit(r.id)}>Guardar</Button>
                ) : (
                  <Button variant="outline" size="icon" icon={Pencil} aria-label={`Editar ${r.name}`} onClick={() => startEdit(r)} />
                )}
                <Button variant="outline" size="icon" icon={Trash2} aria-label={`Eliminar ${r.name}`} loading={savingId === r.id && editingId !== r.id} onClick={() => handleDelete(r.id)} />
              </div>
            </li>
          ))}
        </ul>

        {rowError && <p className="text-sm text-red-600">{rowError}</p>}

        <form onSubmit={handleCreate} className="space-y-4 border-t border-line pt-5">
          <p className="text-sm font-medium text-content">Nueva sala</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Nombre" htmlFor="room-name">
              <Input id="room-name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} required />
            </Field>
            <Field label="Capacidad" htmlFor="room-capacity">
              <Input id="room-capacity" type="number" min={1} value={createForm.capacity} onChange={(e) => setCreateForm((f) => ({ ...f, capacity: e.target.value }))} required />
            </Field>
            <Field label="Estado" htmlFor="room-status">
              <Select id="room-status" value={createForm.status} onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value as Room["status"] }))}>
                <option value="active">Activa</option>
                <option value="maintenance">Mantenimiento</option>
              </Select>
            </Field>
          </div>
          <Field label="Notas" htmlFor="room-notes">
            <Input id="room-notes" value={createForm.notes} onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <Button type="submit" icon={Plus} loading={creating}>Crear sala</Button>
        </form>
      </div>
    </Modal>
  );
}
