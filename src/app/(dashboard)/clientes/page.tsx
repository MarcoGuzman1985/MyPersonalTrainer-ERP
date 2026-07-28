"use client";

import { useEffect, useState } from "react";
import { UserCheck, CalendarClock, Snowflake, UserPlus, Search, X } from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, Avatar, DataTable,
  Button, Input, Select, type Column,
} from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import { getMembers, getMembersMetrics } from "@/lib/api/members";
import { MemberProfile, statusMeta } from "@/components/modules/members/MemberProfile";
import { NewMemberModal } from "@/components/modules/members/NewMemberModal";
import type { Member, MembersMetrics, MembershipStatus } from "@/types/members";

type StatusFilter = MembershipStatus | "all";

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas las membresías" },
  { value: "active", label: "Activas" },
  { value: "expired", label: "Vencidas" },
  { value: "frozen", label: "Congeladas" },
];

const emptyMetrics: MembersMetrics = {
  active: 0, activeDelta: 0, expiringThisWeek: 0, frozen: 0, newThisMonth: 0, newThisMonthDelta: 0,
};

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MembersMetrics>(emptyMetrics);
  const [rows, setRows] = useState<Member[]>([]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  // Socio seleccionado -> abre el panel de Perfil 360° a la derecha.
  const [selected, setSelected] = useState<Member | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  function refreshMetrics() {
    getMembersMetrics().then(setMetrics).catch(() => setMetrics(emptyMetrics));
  }

  function refreshMembers() {
    setLoading(true);
    return getMembers({ search: query, status })
      .then((res) => setRows(res.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshMetrics();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(refreshMembers, 300);
    return () => clearTimeout(timeout);
  }, [query, status]);

  const columns: Column<Member>[] = [
    {
      key: "member",
      header: "Socio",
      cell: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} src={m.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-content">{m.name}</p>
            <p className="truncate text-xs text-content-subtle">{m.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Membresía",
      cell: (m) => (
        <Badge tone={statusMeta[m.subscription.status].tone} dot>
          {statusMeta[m.subscription.status].label}
        </Badge>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (m) => <Badge tone="brand" className="capitalize">{m.subscription.plan}</Badge>,
    },
    {
      key: "endDate",
      header: "Próx. vencimiento",
      align: "right",
      cell: (m) => <span className="text-content-muted">{formatDate(m.subscription.endDate)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Clientes y membresías"
        description="Cartera de socios con su perfil 360°: datos, suscripción, antropométricos y asistencia."
        actions={<Button icon={UserPlus} onClick={() => setModalOpen(true)}>Nuevo socio</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Socios activos" value={metrics.active} icon={UserCheck} delta={metrics.activeDelta} accent="teal" loading={loading} />
        <StatCard label="Vencen esta semana" value={metrics.expiringThisWeek} icon={CalendarClock} loading={loading} />
        <StatCard label="Congelados" value={metrics.frozen} icon={Snowflake} loading={loading} />
        <StatCard label="Nuevos del mes" value={metrics.newThisMonth} icon={UserPlus} delta={metrics.newThisMonthDelta} loading={loading} />
      </div>

      {/* Lista + panel de detalle. En escritorio el perfil se muestra a la derecha. */}
      <div className={cn("grid grid-cols-1 gap-6", selected && "xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]")}>
        <Card>
          <CardHeader
            title="Socios"
            description="Selecciona un socio para abrir su perfil 360°."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, correo o teléfono"
                    className="pl-9 sm:w-64"
                    aria-label="Buscar socios"
                  />
                </div>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  aria-label="Filtrar por estado de membresía"
                  className="sm:w-48"
                >
                  {statusFilterOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
            }
          />
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(m) => m.id}
              loading={loading}
              onRowClick={(m) => setSelected(m)}
              emptyMessage="Ningún socio coincide con los filtros."
            />
          </CardContent>
        </Card>

        {/* Perfil 360° del socio seleccionado (panel conmutado por estado). */}
        {selected && (
          <div className="xl:sticky xl:top-0 xl:self-start">
            <MemberProfile
              key={selected.id}
              member={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      <NewMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          refreshMembers();
          refreshMetrics();
        }}
      />
    </>
  );
}
