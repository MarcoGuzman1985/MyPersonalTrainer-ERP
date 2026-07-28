"use client";

import { useEffect, useState } from "react";
import { Users, ShieldCheck, MailPlus, UserPlus, ShieldPlus } from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, DataTable, Button, Avatar,
  type Column,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import {
  getUsersMetrics, getStaff, getRoles, getPermissionCatalog, updateStaff, deleteStaff,
} from "@/lib/api/users";
import type { PermissionModule, Role, StaffStatus, StaffUser, UsersMetrics } from "@/types/users";
import type { Tone } from "@/types/shared";
import { PermissionMatrix } from "@/components/modules/users/PermissionMatrix";
import { InviteUserModal } from "@/components/modules/users/InviteUserModal";
import { EditStaffModal } from "@/components/modules/users/EditStaffModal";
import { NewRoleModal } from "@/components/modules/users/NewRoleModal";
import { StaffRowActions } from "@/components/modules/users/StaffRowActions";

const statusMeta: Record<StaffStatus, { label: string; tone: Tone }> = {
  active: { label: "Activo", tone: "success" },
  invited: { label: "Invitado", tone: "info" },
  disabled: { label: "Inactivo", tone: "neutral" },
};

const emptyMetrics: UsersMetrics = { activeUsers: 0, rolesCount: 0, pendingInvites: 0 };

export default function UsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [metrics, setMetrics] = useState<UsersMetrics>(emptyMetrics);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [catalog, setCatalog] = useState<PermissionModule[]>([]);

  function refreshAll() {
    setLoading(true);
    return Promise.all([
      getUsersMetrics().then(setMetrics).catch(() => setMetrics(emptyMetrics)),
      getStaff().then(setStaff).catch(() => setStaff([])),
      getRoles().then(setRoles).catch(() => setRoles([])),
      getPermissionCatalog().then(setCatalog).catch(() => setCatalog([])),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshAll();
  }, []);

  async function handleToggleStatus(u: StaffUser) {
    await updateStaff(u.id, { status: u.status === "disabled" ? "active" : "disabled" });
    refreshAll();
  }

  async function handleDelete(u: StaffUser) {
    await deleteStaff(u.id);
    refreshAll();
  }

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
      cell: (u) => (
        <StaffRowActions
          staff={u}
          onEdit={() => setEditingStaff(u)}
          onToggleStatus={() => handleToggleStatus(u)}
          onDelete={() => handleDelete(u)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios y Permisos"
        description="Gestiona el personal del gimnasio y sus accesos mediante roles (RBAC)."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={ShieldPlus} onClick={() => setNewRoleOpen(true)}>Nuevo rol</Button>
            <Button icon={UserPlus} onClick={() => setInviteOpen(true)}>Invitar usuario</Button>
          </div>
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
            rows={staff}
            rowKey={(u) => u.id}
            loading={loading}
            emptyMessage="Aún no hay usuarios. Invita a tu equipo para empezar."
          />
        </CardContent>
      </Card>

      {roles.length > 0 && catalog.length > 0 && (
        <PermissionMatrix
          roles={roles}
          catalog={catalog}
          onSaved={() => getRoles().then(setRoles).catch(() => {})}
        />
      )}

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roles={roles}
        onInvited={refreshAll}
      />

      <NewRoleModal
        open={newRoleOpen}
        onClose={() => setNewRoleOpen(false)}
        onCreated={() => getRoles().then(setRoles).catch(() => {})}
      />

      <EditStaffModal
        open={editingStaff !== null}
        onClose={() => setEditingStaff(null)}
        staff={editingStaff}
        roles={roles}
        onSaved={refreshAll}
      />
    </>
  );
}
