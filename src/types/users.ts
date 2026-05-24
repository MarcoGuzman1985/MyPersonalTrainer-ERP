import type { ID } from "./shared";

/** Estado de la cuenta de un miembro del personal del gimnasio. */
export type StaffStatus = "active" | "invited" | "disabled";

/** Acción concreta autorizable dentro de un módulo (RBAC granular). */
export interface PermissionAction {
  /** Clave estable usada por el backend, ej. "clientes.crear". */
  key: string;
  label: string;
}

/** Agrupación de permisos por módulo funcional del ERP. */
export interface PermissionModule {
  key: string;
  label: string;
  actions: PermissionAction[];
}

/** Rol asignable al personal, con su set de permisos concedidos. */
export interface Role {
  id: ID;
  name: string;
  description: string;
  /** Roles del sistema no se pueden eliminar (solo editar permisos). */
  isSystem: boolean;
  /** Claves de PermissionAction concedidas, ej. ["clientes.ver", "pos.cobrar"]. */
  permissions: string[];
}

/** Miembro del personal con acceso al ERP del gimnasio. */
export interface StaffUser {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  roleId: ID;
  roleName: string;
  status: StaffStatus;
  /** ISO de la última actividad registrada; null si nunca ha entrado. */
  lastActiveAt: string | null;
}

/** Métricas agregadas para las StatCards del módulo. */
export interface UsersMetrics {
  activeUsers: number;
  rolesCount: number;
  pendingInvites: number;
}

/** Payload del formulario de invitación de usuario. */
export interface InviteUserInput {
  name: string;
  email: string;
  roleId: ID;
}
