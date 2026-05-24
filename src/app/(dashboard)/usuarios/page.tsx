"use client";

import { useState } from "react";
import { Users, ShieldCheck, MailPlus, MoreHorizontal, UserPlus } from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, DataTable, Button, Avatar,
  type Column,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import {
  permissionCatalogMock, rolesMock, staffMock, usersMetricsMock,
} from "@/lib/api/users";
import type { StaffStatus, StaffUser } from "@/types/users";
import type { Tone } from "@/types/shared";
import { PermissionMatrix } from "@/components/modules/users/PermissionMatrix";
import { InviteUserModal } from "@/components/modules/users/InviteUserModal";

const statusMeta: Record<StaffStatus, { label: string; tone: Tone }> = {
  active: { label: "Activo", tone: "success" },
  invited: { label: "Invitado", tone: "info" },
  disabled: { label: "Inactivo", tone: "neutral" },
};

export default function UsuariosPage() {
  // TODO(backend): sustituir mocks por getMetrics()/getStaff()/getRoles()/getPermissionCatalog() en un hook de datos.
  const [loading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const metrics = usersMetricsMock;

  const columns: Column<StaffUser>[] = [
    {
      key: "user",
      header: "Usuario",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-content">{u.name}</p>
            <p className="truncate text-xs text-content-subtle">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Rol", cell: (u) => <Badge tone="brand">{u.roleName}</Badge> },
    {
      key: "status",
      header: "Estado",
      cell: (u) => <Badge tone={statusMeta[u.status].tone} dot>{statusMeta[u.status].label}</Badge>,
    },
    {
      key: "lastActiveAt",
      header: "Última actividad",
      align: "right",
      cell: (u) => (
        <span className="text-content-muted">
          {u.lastActiveAt ? formatDateTime(u.lastActiveAt) : "Sin accesos"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: () => (
        // TODO(backend): menú de acciones (editar rol, desactivar, reenviar invitación).
        <Button variant="ghost" size="icon" icon={MoreHorizontal} aria-label="Acciones" />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios y Permisos"
        description="Gestiona el personal del gimnasio y sus accesos mediante roles (RBAC)."
        actions={
          <Button icon={UserPlus} onClick={() => setInviteOpen(true)}>
            Invitar usuario
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Usuarios activos" value={metrics.activeUsers} icon={Users} accent="teal" loading={loading} />
        <StatCard label="Roles definidos" value={metrics.rolesCount} icon={ShieldCheck} loading={loading} />
        <StatCard label="Invitaciones pendientes" value={metrics.pendingInvites} icon={MailPlus} loading={loading} />
      </div>

      <Card>
        <CardHeader title="Personal" description="Miembros con acceso al sistema." />
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={staffMock}
            rowKey={(u) => u.id}
            loading={loading}
            emptyMessage="Aún no hay usuarios. Invita a tu equipo para empezar."
          />
        </CardContent>
      </Card>

      <PermissionMatrix roles={rolesMock} catalog={permissionCatalogMock} />

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roles={rolesMock}
        onInvite={(input) => {
          // TODO(backend): refrescar lista de staff tras invitar.
          console.info("Invitación enviada (mock):", input);
        }}
      />
    </>
  );
}
