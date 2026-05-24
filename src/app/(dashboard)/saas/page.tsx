"use client";

import { useState } from "react";
import { DollarSign, Building2, FlaskConical, TrendingDown, Check } from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, DataTable, Button,
  type Column,
} from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { saasMetricsMock, plansMock, tenantsMock } from "@/lib/api/saas";
import type { Tenant, TenantStatus } from "@/types/saas";
import type { Tone } from "@/types/shared";

const statusMeta: Record<TenantStatus, { label: string; tone: Tone }> = {
  active: { label: "Activo", tone: "success" },
  trial: { label: "Trial", tone: "info" },
  past_due: { label: "Pago vencido", tone: "warning" },
  suspended: { label: "Suspendido", tone: "danger" },
};

export default function SaaSAdminPage() {
  // TODO(backend): sustituir mocks por getMetrics()/getTenants()/getPlans() en un effect/hook de datos.
  const [loading] = useState(false);
  const metrics = saasMetricsMock;

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
        actions={<Button>Nuevo inquilino</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR" value={formatCurrency(metrics.mrr)} icon={DollarSign} delta={metrics.mrrDelta} accent="teal" loading={loading} />
        <StatCard label="Inquilinos activos" value={metrics.activeTenants} icon={Building2} delta={metrics.activeTenantsDelta} loading={loading} />
        <StatCard label="En periodo trial" value={metrics.trials} icon={FlaskConical} loading={loading} />
        <StatCard label="Churn mensual" value={`${metrics.churnRate}%`} icon={TrendingDown} delta={-0.4} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {plansMock.map((plan) => (
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
          <DataTable columns={columns} rows={tenantsMock} rowKey={(t) => t.id} loading={loading} />
        </CardContent>
      </Card>
    </>
  );
}
