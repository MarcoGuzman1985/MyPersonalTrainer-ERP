"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Trash2,
  Users,
  Download,
  ShieldCheck,
  Lock,
  Eye,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardContent,
  Badge,
  DataTable,
  Button,
  Modal,
  Input,
  Select,
  Field,
  type Column,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { auditLogsMock } from "@/lib/api/audit";
import type { AuditLog, AuditAction } from "@/types/audit";
import type { Tone } from "@/types/shared";

const PAGE_SIZE = 6;

const actionMeta: Record<AuditAction, { label: string; tone: Tone }> = {
  create: { label: "Creación", tone: "success" },
  update: { label: "Actualización", tone: "info" },
  delete: { label: "Eliminación", tone: "danger" },
  login: { label: "Inicio de sesión", tone: "neutral" },
  logout: { label: "Cierre de sesión", tone: "neutral" },
  export: { label: "Exportación", tone: "brand" },
};

const modules = Array.from(new Set(auditLogsMock.map((l) => l.module))).sort();
const actions = Object.keys(actionMeta) as AuditAction[];

export default function AuditoriaPage() {
  // TODO(backend): sustituir auditLogsMock por GET /api/audit?module=&user=&from=&to=
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auditLogsMock.filter((log) => {
      if (moduleFilter && log.module !== moduleFilter) return false;
      if (actionFilter && log.action !== actionFilter) return false;
      if (q && !log.user.toLowerCase().includes(q) && !log.ip.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [moduleFilter, actionFilter, search]);

  const total = filtered.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Métricas derivadas del mock (no del filtro) para reflejar el estado global.
  const stats = useMemo(() => {
    const today = "2026-05-24";
    return {
      eventsToday: auditLogsMock.filter((l) => l.timestamp.startsWith(today)).length,
      deletions: auditLogsMock.filter((l) => l.action === "delete").length,
      activeUsers: new Set(auditLogsMock.map((l) => l.user)).size,
      exports: auditLogsMock.filter((l) => l.action === "export").length,
    };
  }, []);

  const resetPage = () => setPage(1);

  const columns: Column<AuditLog>[] = [
    {
      key: "timestamp",
      header: "Fecha y hora",
      cell: (l) => <span className="whitespace-nowrap text-content-muted">{formatDateTime(l.timestamp)}</span>,
    },
    {
      key: "user",
      header: "Usuario",
      cell: (l) => (
        <div>
          <p className="font-medium text-content">{l.user}</p>
          <p className="text-xs text-content-subtle">{l.userRole}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Acción",
      cell: (l) => <Badge tone={actionMeta[l.action].tone} dot>{actionMeta[l.action].label}</Badge>,
    },
    { key: "module", header: "Módulo", cell: (l) => l.module },
    {
      key: "ip",
      header: "Dirección IP",
      cell: (l) => <span className="font-mono text-xs text-content-muted">{l.ip}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (l) => (
        <Button variant="outline" size="sm" icon={Eye} onClick={() => setSelected(l)}>
          Ver detalle
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Logs de auditoría"
        description="Registro inmutable de las acciones realizadas en la plataforma."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Eventos hoy" value={stats.eventsToday} icon={CalendarClock} accent="teal" />
        <StatCard label="Acciones de borrado" value={stats.deletions} icon={Trash2} />
        <StatCard label="Usuarios activos" value={stats.activeUsers} icon={Users} />
        <StatCard label="Exportaciones" value={stats.exports} icon={Download} />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-muted/50 px-4 py-3 text-sm text-content-muted">
        <Lock className="h-4 w-4 shrink-0 text-content-subtle" />
        <p>
          Registro <span className="font-medium text-content">inmutable y de solo lectura</span>. Las entradas no pueden
          editarse ni eliminarse (append-only).
        </p>
      </div>

      <Card>
        <CardHeader
          title="Eventos registrados"
          description="Filtra por módulo, acción o busca por usuario / IP."
        />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Módulo">
              <Select
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  resetPage();
                }}
              >
                <option value="">Todos los módulos</option>
                {modules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Acción">
              <Select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  resetPage();
                }}
              >
                <option value="">Todas las acciones</option>
                {actions.map((a) => (
                  <option key={a} value={a}>
                    {actionMeta[a].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Buscar">
              <Input
                placeholder="Usuario o dirección IP…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
              />
            </Field>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(l) => l.id}
            onRowClick={(l) => setSelected(l)}
            emptyMessage="No hay eventos que coincidan con los filtros."
            pagination={{
              page: safePage,
              pageSize: PAGE_SIZE,
              total,
              onPageChange: setPage,
            }}
          />
        </CardContent>
      </Card>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalle del evento"
        description={selected ? `${actionMeta[selected.action].label} · ${selected.module}` : undefined}
        size="lg"
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Meta label="Usuario" value={`${selected.user} (${selected.userRole})`} />
              <Meta label="Fecha y hora" value={formatDateTime(selected.timestamp)} />
              <Meta label="Dirección IP" value={selected.ip} mono />
              <Meta label="Acción">
                <Badge tone={actionMeta[selected.action].tone} dot>
                  {actionMeta[selected.action].label}
                </Badge>
              </Meta>
              {selected.userAgent && (
                <div className="sm:col-span-2">
                  <Meta label="Agente de usuario" value={selected.userAgent} mono />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-line bg-surface-muted/40 px-3 py-2 text-xs text-content-subtle">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Detalles técnicos del cambio (solo lectura)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChangeBlock title="Estado anterior" data={selected.before} />
              <ChangeBlock title="Estado posterior" data={selected.after} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Meta({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-content-subtle">{label}</p>
      {children ?? (
        <p className={mono ? "break-all font-mono text-xs text-content" : "text-content"}>{value}</p>
      )}
    </div>
  );
}

function ChangeBlock({ title, data }: { title: string; data?: Record<string, unknown> }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-content-muted">{title}</p>
      <pre className="max-h-64 overflow-auto rounded-xl border border-line bg-surface-muted/60 p-3 font-mono text-xs leading-relaxed text-content">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}
