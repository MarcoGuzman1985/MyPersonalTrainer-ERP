"use client";

import { useState, type FormEvent } from "react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import { createClass } from "@/lib/api/schedule";
import { ApiError } from "@/lib/api/client";
import type { ClassType, GymClass, Room } from "@/types/schedule";

interface Coach {
  id: string;
  name: string;
}

interface NewClassModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  coaches: Coach[];
  onCreated: (cls: GymClass) => void;
}

const typeOptions: { value: ClassType; label: string }[] = [
  { value: "crossfit", label: "CrossFit" },
  { value: "spinning", label: "Spinning" },
  { value: "yoga", label: "Yoga" },
  { value: "funcional", label: "Funcional" },
  { value: "boxeo", label: "Boxeo" },
  { value: "hiit", label: "HIIT" },
];

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewClassModal({ open, onClose, rooms, coaches, onCreated }: NewClassModalProps) {
  const now = new Date();
  const [form, setForm] = useState({
    title: "",
    roomId: rooms[0]?.id ?? "",
    coachId: "",
    type: "funcional" as ClassType,
    start: toLocalInput(now),
    end: toLocalInput(new Date(now.getTime() + 60 * 60_000)),
    capacity: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.roomId || !form.start || !form.end) {
      setError("Completa todos los campos.");
      return;
    }

    setSubmitting(true);
    try {
      const cls = await createClass({
        title: form.title,
        roomId: form.roomId,
        coachId: form.coachId || null,
        type: form.type,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
        capacity: form.capacity ? Number(form.capacity) : undefined,
      });
      onCreated(cls);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la clase.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva clase"
      description="Agenda una clase asignando sala y coach."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button form="new-class-form" type="submit" loading={submitting}>Crear clase</Button>
        </>
      }
    >
      <form id="new-class-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título" htmlFor="class-title">
          <Input id="class-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Sala" htmlFor="class-room">
            <Select id="class-room" value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))} required>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.capacity})</option>)}
            </Select>
          </Field>
          <Field label="Coach" htmlFor="class-coach">
            <Select id="class-coach" value={form.coachId} onChange={(e) => setForm((f) => ({ ...f, coachId: e.target.value }))}>
              <option value="">Sin asignar</option>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Tipo" htmlFor="class-type">
            <Select id="class-type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ClassType }))}>
              {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Aforo" htmlFor="class-capacity" hint="Vacío = capacidad de la sala">
            <Input id="class-capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
          </Field>
          <Field label="Inicio" htmlFor="class-start">
            <Input id="class-start" type="datetime-local" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} required />
          </Field>
          <Field label="Fin" htmlFor="class-end">
            <Input id="class-end" type="datetime-local" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} required />
          </Field>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
