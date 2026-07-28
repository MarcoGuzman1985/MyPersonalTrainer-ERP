"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DollarSign, Building2, FlaskConical, TrendingDown, Check, Settings } from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, DataTable, Button,
  Input, Select, Field, Modal, type Column,
} from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getSaasMetrics, getPlans, getTenants, createTenant } from "@/lib/api/saas";
import { ApiError } from "@/lib/api/client";
import { TenantDrawer } from "@/components/modules/saas/TenantDrawer";
import { PlanManagementModal } from "@/components/modules/saas/PlanManagementModal";
import type { PlanDefinition, SaaSMetrics, Tenant, TenantStatus } from "@/types/saas";
import type { Tone } from "@/types/shared";

const statusMeta: Record<TenantStatus, { label: string; tone: Tone }> = {
  active: { label: "Activo", tone: "success" },
  trial: { label: "Trial", tone: "info" },
  past_due: { label: "Pago vencido", tone: "warning" },
  suspended: { label: "Suspendido", tone: "danger" },
};

const emptyMetrics: SaaSMetrics = { mrr: 0, mrrDelta: 0, activeTenants: 0, activeTenantsDelta: 0, trials: 0, churnRate: 0 };

export default function SaaSAdminPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SaaSMetrics>(emptyMetrics);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    gymName: "", ownerName: "", ownerEmail: "", tempPassword: "", plan: "lite", trialDays: "14",
  });

  function refreshAll() {
    setLoading(true);
    return Promise.all([
      getSaasMetrics().then(setMetrics).catch(() => setMetrics(emptyMetrics)),
      getPlans().then(setPlans).catch(() => setPlans([])),
      getTenants().then(setTenants).catch(() => setTenants([])),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshAll();
  }, []);

  async function handleCreateTenant(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trialDays = Number(form.trialDays);
    if (!form.gymName || !form.ownerName || !form.ownerEmail || !form.tempPassword) {
      setFormError("Completa todos los campos.");
      return;
    }
    if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 365) {
      setFormError("Los días de prueba deben ser un entero entre 0 y 365.");
      return;
    }

    setSubmitting(true);
    try {
      await createTenant({ ...form, trialDays });
      setModalOpen(false);
      setForm({ gymName: "", ownerName: "", ownerEmail: "", tempPassword: "", plan: "lite", trialDays: "14" });
      await refreshAll();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo crear el inquilino.");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      header: "Inquilino",
      cell: (t) => (
        <div>
          <p className="font-medium text-content">{t.name}</p>
          <p className="text-xs text-content-subtle">{t.owner}</p>
        </div>
      ),
    },
    { key: "plan", header: "Plan", cell: (t) => <Badge tone="brand" className="capitalize">{t.plan}</Badge> },
    {
      key: "status",
      header: "Estado",
      cell: (t) => <Badge tone={statusMeta[t.status].tone} dot>{statusMeta[t.status].label}</Badge>,
    },
    { key: "members", header: "Socios", align: "right", cell: (t) => t.members.toLocaleString("es-ES") },
    { key: "mrr", header: "MRR", align: "right", cell: (t) => formatCurrency(t.mrr) },
    { key: "renewsAt", header: "Renueva", align: "right", cell: (t) => <span className="text-content-muted">{formatDate(t.renewsAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Admin SaaS"
        description="Métricas globales de la plataforma, inquilinos y planes comerciales."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={Settings} onClick={() => setPlanModalOpen(true)}>
              Gestión de planes
            </Button>
            <Button onClick={() => setModalOpen(true)}>Nuevo inquilino</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR" value={formatCurrency(metrics.mrr)} icon={DollarSign} delta={metrics.mrrDelta} accent="teal" loading={loading} />
        <StatCard label="Inquilinos activos" value={metrics.activeTenants} icon={Building2} delta={metrics.activeTenantsDelta} loading={loading} />
        <StatCard label="En periodo trial" value={metrics.trials} icon={FlaskConical} loading={loading} />
        <StatCard label="Churn mensual" value={`${metrics.churnRate}%`} icon={TrendingDown} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={cn(plan.highlighted && "ring-2 ring-brand-800")}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  {plan.name}
                  {plan.highlighted && <Badge tone="brand">Popular</Badge>}
                </span>
              }
              description={`Hasta ${plan.maxMembers >= 99999 ? "∞" : plan.maxMembers} socios · ${plan.maxSeats} usuarios`}
            />
            <CardContent>
              <p className="mb-4 text-2xl font-bold text-content">
                {formatCurrency(plan.monthlyPrice)}
                <span className="text-sm font-normal text-content-subtle">/mes</span>
              </p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-content-muted">
                    <Check className="h-4 w-4 shrink-0 text-teal-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Inquilinos" description="Cuentas registradas en la plataforma." />
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={tenants}
            rowKey={(t) => t.id}
            loading={loading}
            onRowClick={(t) => setSelectedTenant(t)}
          />
        </CardContent>
      </Card>

      <TenantDrawer
        open={selectedTenant !== null}
        onClose={() => setSelectedTenant(null)}
        tenant={selectedTenant}
        plans={plans}
        onUpdated={() => {
          setSelectedTenant(null);
          refreshAll();
        }}
      />

      <PlanManagementModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        plans={plans}
        onChanged={refreshAll}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo inquilino"
        description="Alta de un gimnasio/box con su usuario dueño inicial."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button form="new-tenant-form" type="submit" loading={submitting}>Crear inquilino</Button>
          </>
        }
      >
        <form id="new-tenant-form" onSubmit={handleCreateTenant} className="space-y-4">
          <Field label="Nombre del gimnasio" htmlFor="gymName">
            <Input id="gymName" value={form.gymName} onChange={(e) => setForm((f) => ({ ...f, gymName: e.target.value }))} required />
          </Field>
          <Field label="Nombre del dueño" htmlFor="ownerName">
            <Input id="ownerName" value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} required />
          </Field>
          <Field label="Correo del dueño" htmlFor="ownerEmail">
            <Input id="ownerEmail" type="email" value={form.ownerEmail} onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))} required />
          </Field>
          <Field label="Contraseña temporal" htmlFor="tempPassword">
            <Input id="tempPassword" type="text" value={form.tempPassword} onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))} required />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Plan" htmlFor="plan">
              <Select id="plan" value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.monthlyPrice)}/mes</option>
                ))}
              </Select>
            </Field>
            <Field label="Días de prueba gratuita" htmlFor="trialDays">
              <Input
                id="trialDays"
                type="number"
                min={0}
                max={365}
                value={form.trialDays}
                onChange={(e) => setForm((f) => ({ ...f, trialDays: e.target.value }))}
                required
              />
            </Field>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </form>
      </Modal>
    </>
  );
}
