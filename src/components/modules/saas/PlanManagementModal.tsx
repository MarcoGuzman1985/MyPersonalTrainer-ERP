"use client";

import { useState, type FormEvent } from "react";
import { Trash2, Plus } from "lucide-react";
import { Modal, Button, Field, Input, Badge } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { createPlan, deletePlan } from "@/lib/api/saas";
import { ApiError } from "@/lib/api/client";
import type { PlanDefinition } from "@/types/saas";

interface PlanManagementModalProps {
  open: boolean;
  onClose: () => void;
  plans: PlanDefinition[];
  onChanged: () => void;
}

const emptyForm = {
  id: "", name: "", monthlyPrice: "", maxMembers: "", maxSeats: "",
  features: "[]", highlighted: false,
};

export function PlanManagementModal({ open, onClose, plans, onChanged }: PlanManagementModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);

    let features: string[];
    try {
      features = JSON.parse(form.features || "[]");
      if (!Array.isArray(features)) throw new Error();
    } catch {
      setCreateError("Features debe ser un array JSON, ej: [\"Feature 1\", \"Feature 2\"]");
      return;
    }

    const monthlyPrice = Number(form.monthlyPrice);
    const maxMembers = Number(form.maxMembers);
    const maxSeats = Number(form.maxSeats);

    setCreating(true);
    try {
      await createPlan({
        id: form.id, name: form.name, monthlyPrice, maxMembers, maxSeats,
        features, highlighted: form.highlighted,
      });
      setForm(emptyForm);
      onChanged();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "No se pudo crear el plan.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deletePlan(id);
      onChanged();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "No se pudo eliminar el plan.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gestión de planes"
      description="Crea planes estacionales o elimina los que ya no uses."
      size="lg"
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-6">
        <ul className="divide-y divide-line rounded-lg border border-line">
          {plans.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-content">
                  {p.name} <span className="text-content-subtle">({p.id})</span>
                  {p.highlighted && <Badge tone="brand" className="ml-2">Popular</Badge>}
                </p>
                <p className="text-content-subtle">
                  {formatCurrency(p.monthlyPrice)}/mes · {p.maxMembers >= 99999 ? "∞" : p.maxMembers} socios · {p.maxSeats} usuarios
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                icon={Trash2}
                aria-label={`Eliminar ${p.name}`}
                loading={deletingId === p.id}
                onClick={() => handleDelete(p.id)}
              />
            </li>
          ))}
        </ul>

        {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

        <form onSubmit={handleCreate} className="space-y-4 border-t border-line pt-5">
          <p className="text-sm font-medium text-content">Nuevo plan</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ID" htmlFor="plan-id" hint="minúsculas, números y guiones">
              <Input id="plan-id" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="black-friday-2026" required />
            </Field>
            <Field label="Nombre" htmlFor="plan-name">
              <Input id="plan-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </Field>
            <Field label="Precio mensual" htmlFor="plan-price">
              <Input id="plan-price" type="number" min={0} step={0.01} value={form.monthlyPrice} onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))} required />
            </Field>
            <Field label="Máx. socios" htmlFor="plan-max-members">
              <Input id="plan-max-members" type="number" min={1} value={form.maxMembers} onChange={(e) => setForm((f) => ({ ...f, maxMembers: e.target.value }))} required />
            </Field>
            <Field label="Máx. usuarios (seats)" htmlFor="plan-max-seats">
              <Input id="plan-max-seats" type="number" min={1} value={form.maxSeats} onChange={(e) => setForm((f) => ({ ...f, maxSeats: e.target.value }))} required />
            </Field>
            <Field label="Destacado" htmlFor="plan-highlighted">
              <label className="flex h-10 items-center gap-2 text-sm text-content">
                <input
                  id="plan-highlighted"
                  type="checkbox"
                  checked={form.highlighted}
                  onChange={(e) => setForm((f) => ({ ...f, highlighted: e.target.checked }))}
                />
                Mostrar como &quot;Popular&quot;
              </label>
            </Field>
          </div>

          <Field label="Features (JSON)" htmlFor="plan-features">
            <Input
              id="plan-features"
              value={form.features}
              onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
              className="font-mono text-xs"
              placeholder='["Todo en Pro", "Soporte prioritario"]'
            />
          </Field>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <Button type="submit" icon={Plus} loading={creating}>Crear plan</Button>
        </form>
      </div>
    </Modal>
  );
}
