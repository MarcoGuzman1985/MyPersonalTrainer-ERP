"use client";

import { useState, type FormEvent } from "react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import { createMember } from "@/lib/api/members";
import { ApiError } from "@/lib/api/client";
import type { Member } from "@/types/members";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  gender: "female" as Member["gender"],
  birthDate: "",
  plan: "lite" as Member["subscription"]["plan"],
  price: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
};

interface NewMemberModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (member: Member) => void;
}

/** Alta de socio reutilizada en /clientes y como acceso rápido global (Topbar). */
export function NewMemberModal({ open, onClose, onCreated }: NewMemberModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name || !form.email || !form.phone || !form.birthDate || !form.price || !form.endDate) {
      setFormError("Completa todos los campos.");
      return;
    }

    setSubmitting(true);
    try {
      const member = await createMember({
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        birthDate: form.birthDate,
        subscription: {
          plan: form.plan,
          status: "active",
          startDate: form.startDate,
          endDate: form.endDate,
          price: Number(form.price),
          autoRenew: true,
        },
      });
      setForm(emptyForm);
      onClose();
      onCreated?.(member);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo crear el socio. Verifica los datos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo socio"
      description="Alta de un socio con su membresía inicial."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button form="new-member-form" type="submit" loading={submitting}>Crear socio</Button>
        </>
      }
    >
      <form id="new-member-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" htmlFor="name">
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Correo electrónico" htmlFor="email">
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </Field>
          <Field label="Teléfono" htmlFor="phone">
            <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </Field>
          <Field label="Género" htmlFor="gender">
            <Select id="gender" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Member["gender"] }))}>
              <option value="female">Femenino</option>
              <option value="male">Masculino</option>
              <option value="other">Otro</option>
            </Select>
          </Field>
          <Field label="Fecha de nacimiento" htmlFor="birthDate">
            <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} required />
          </Field>
          <Field label="Plan" htmlFor="plan">
            <Select id="plan" value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as Member["subscription"]["plan"] }))}>
              <option value="lite">Lite</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </Field>
          <Field label="Precio de la cuota" htmlFor="price">
            <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
          </Field>
          <Field label="Inicio de membresía" htmlFor="startDate">
            <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
          </Field>
          <Field label="Vencimiento" htmlFor="endDate">
            <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required />
          </Field>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </form>
    </Modal>
  );
}
