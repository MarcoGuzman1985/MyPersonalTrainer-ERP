"use client";

import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
  Users, GitBranch, Trophy, Percent, Plus, Phone, MessageCircle, ArrowRight,
} from "lucide-react";
import {
  PageHeader, StatCard, Card, Badge, Button, Avatar, Modal, Field, Input, Select,
} from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { leadsMock } from "@/lib/api/crm";
import type { Lead, LeadStage, LeadSource } from "@/types/crm";
import type { Tone } from "@/types/shared";

const stages: { stage: LeadStage; label: string; accent: string }[] = [
  { stage: "new", label: "Lead Nuevo", accent: "border-t-brand-800" },
  { stage: "contacted", label: "Contactado", accent: "border-t-blue-500" },
  { stage: "scheduled", label: "Visita Programada", accent: "border-t-amber-500" },
  { stage: "won", label: "Membresía Vendida", accent: "border-t-teal-700" },
  { stage: "lost", label: "Perdido", accent: "border-t-red-500" },
];

const sourceTone: Record<LeadSource, Tone> = {
  Instagram: "brand",
  Web: "info",
  Referido: "success",
  "Walk-in": "warning",
};

const sourceOptions: LeadSource[] = ["Instagram", "Web", "Referido", "Walk-in"];

/** Etapa siguiente en el embudo para el botón "avanzar". */
const nextStage: Partial<Record<LeadStage, LeadStage>> = {
  new: "contacted",
  contacted: "scheduled",
  scheduled: "won",
};

export default function CrmPage() {
  // TODO(backend): sustituir leadsMock por getLeads() en un effect/hook de datos.
  const [leads, setLeads] = useState<Lead[]>(leadsMock);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<LeadStage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", source: "Instagram" as LeadSource, value: "" });

  const byStage = useMemo(() => {
    const map: Record<LeadStage, Lead[]> = { new: [], contacted: [], scheduled: [], won: [], lost: [] };
    for (const lead of leads) map[lead.stage].push(lead);
    return map;
  }, [leads]);

  const metrics = useMemo(() => {
    const total = leads.length;
    const pipeline = leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;
    const won = byStage.won.length;
    const closed = won + byStage.lost.length;
    const conversion = closed > 0 ? Math.round((won / closed) * 100) : 0;
    return { total, pipeline, won, conversion };
  }, [leads, byStage]);

  function moveLead(id: string, stage: LeadStage) {
    // TODO(backend): PATCH /api/leads/:id { stage } al soltar la tarjeta.
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, stage: LeadStage) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) moveLead(id, stage);
    setDragId(null);
    setOverStage(null);
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    // TODO(backend): POST /api/leads con los datos del formulario.
    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      source: form.source,
      value: Number(form.value) || 0,
      assignedTo: "Sin asignar",
      createdAt: new Date().toISOString().slice(0, 10),
      stage: "new",
    };
    setLeads((prev) => [newLead, ...prev]);
    setForm({ name: "", phone: "", source: "Instagram", value: "" });
    setModalOpen(false);
  }

  return (
    <>
      <PageHeader
        title="CRM y Leads"
        description="Embudo comercial: arrastra los prospectos entre etapas para actualizar su estado."
        actions={<Button icon={Plus} onClick={() => setModalOpen(true)}>Nuevo lead</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads totales" value={metrics.total} icon={Users} />
        <StatCard label="En pipeline" value={metrics.pipeline} icon={GitBranch} />
        <StatCard label="Ganados este mes" value={metrics.won} icon={Trophy} accent="teal" />
        <StatCard label="Tasa de conversión" value={`${metrics.conversion}%`} icon={Percent} accent="teal" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(({ stage, label, accent }) => {
          const items = byStage[stage];
          const sum = items.reduce((acc, l) => acc + l.value, 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => handleDrop(e, stage)}
              className={cn(
                "flex min-w-[17rem] flex-1 flex-col rounded-xl border border-t-4 border-line bg-surface-muted/50 transition-colors",
                accent,
                overStage === stage && "bg-brand-800/5 ring-2 ring-brand-500/30",
              )}
            >
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-content">{label}</h3>
                  <Badge tone="neutral">{items.length}</Badge>
                </div>
                <span className="text-xs font-medium text-content-muted">{formatCurrency(sum)}</span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-3 pt-0">
                {items.map((lead) => {
                  const adv = nextStage[lead.stage];
                  return (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", lead.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(lead.id);
                      }}
                      onDragEnd={() => setDragId(null)}
                      className={cn(
                        "cursor-grab space-y-3 p-3 active:cursor-grabbing",
                        dragId === lead.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={lead.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-content">{lead.name}</p>
                          <p className="truncate text-xs text-content-subtle">{lead.assignedTo}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={sourceTone[lead.source]}>{lead.source}</Badge>
                        <span className="text-sm font-semibold text-content">{formatCurrency(lead.value)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-content-subtle">{formatDate(lead.createdAt)}</span>
                        <div className="flex items-center gap-1">
                          {/* Acciones rápidas */}
                          <Button
                            size="icon"
                            variant="ghost"
                            icon={Phone}
                            aria-label="Llamar"
                            onClick={() => window.open(`tel:${lead.phone.replace(/\s/g, "")}`)}
                            className="h-8 w-8"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            icon={MessageCircle}
                            aria-label="WhatsApp"
                            onClick={() =>
                              window.open(`https://wa.me/${lead.phone.replace(/[^\d]/g, "")}`, "_blank")
                            }
                            className="h-8 w-8"
                          />
                          {adv && (
                            <Button
                              size="icon"
                              variant="success"
                              icon={ArrowRight}
                              aria-label="Avanzar etapa"
                              onClick={() => moveLead(lead.id, adv)}
                              className="h-8 w-8"
                            />
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-line py-6 text-center text-xs text-content-subtle">
                    Sin leads
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo lead"
        description="Registra un prospecto en la etapa inicial del embudo."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="crm-new-lead">Crear lead</Button>
          </>
        }
      >
        <form id="crm-new-lead" onSubmit={handleCreate} className="space-y-4">
          <Field label="Nombre" htmlFor="lead-name">
            <Input
              id="lead-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre y apellido"
            />
          </Field>
          <Field label="Teléfono" htmlFor="lead-phone">
            <Input
              id="lead-phone"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+34 600 000 000"
            />
          </Field>
          <Field label="Fuente" htmlFor="lead-source">
            <Select
              id="lead-source"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as LeadSource }))}
            >
              {sourceOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Valor potencial" hint="Importe estimado de la membresía." htmlFor="lead-value">
            <Input
              id="lead-value"
              type="number"
              min={0}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder="79"
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
