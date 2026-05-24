import type {
  PermissionModule,
  Role,
  StaffUser,
  UsersMetrics,
} from "@/types/users";

/**
 * Capa de datos del módulo Usuarios y Permisos (RBAC).
 * MOCK para demo de UI. Para conectar el backend, reemplazar los retornos por:
 *   getMetrics             -> apiFetch<UsersMetrics>("/api/users/metrics")
 *   getStaff               -> apiFetch<Paginated<StaffUser>>("/api/users?page=…")
 *   getRoles               -> apiFetch<Role[]>("/api/roles")
 *   getPermissionCatalog   -> apiFetch<PermissionModule[]>("/api/permissions/catalog")
 *   inviteUser             -> apiFetch<StaffUser>("/api/users/invite", { method: "POST", body })
 *   updateRolePermissions  -> apiFetch<Role>(`/api/roles/${id}/permissions`, { method: "PUT", body })
 */

/** Catálogo de módulos y acciones autorizables del ERP de gimnasio. */
export const permissionCatalogMock: PermissionModule[] = [
  {
    key: "clientes",
    label: "Clientes y Membresías",
    actions: [
      { key: "clientes.ver", label: "Ver" },
      { key: "clientes.crear", label: "Crear" },
      { key: "clientes.editar", label: "Editar" },
      { key: "clientes.eliminar", label: "Eliminar" },
    ],
  },
  {
    key: "pos",
    label: "Ventas / POS",
    actions: [
      { key: "pos.ver", label: "Ver" },
      { key: "pos.cobrar", label: "Cobrar" },
      { key: "pos.reembolsar", label: "Reembolsar" },
      { key: "pos.cierre", label: "Cierre de caja" },
    ],
  },
  {
    key: "agenda",
    label: "Agenda y Clases",
    actions: [
      { key: "agenda.ver", label: "Ver" },
      { key: "agenda.reservar", label: "Reservar" },
      { key: "agenda.gestionar", label: "Gestionar clases" },
    ],
  },
  {
    key: "entrenamiento",
    label: "Entrenamiento",
    actions: [
      { key: "entrenamiento.ver", label: "Ver" },
      { key: "entrenamiento.asignar", label: "Asignar rutinas" },
      { key: "entrenamiento.editar", label: "Editar planes" },
    ],
  },
  {
    key: "inventario",
    label: "Inventario",
    actions: [
      { key: "inventario.ver", label: "Ver" },
      { key: "inventario.ajustar", label: "Ajustar stock" },
      { key: "inventario.comprar", label: "Registrar compras" },
    ],
  },
  {
    key: "accesos",
    label: "Control de Accesos",
    actions: [
      { key: "accesos.ver", label: "Ver" },
      { key: "accesos.gestionar", label: "Gestionar dispositivos" },
    ],
  },
  {
    key: "reportes",
    label: "Reportes",
    actions: [
      { key: "reportes.ver", label: "Ver" },
      { key: "reportes.exportar", label: "Exportar" },
    ],
  },
  {
    key: "config",
    label: "Configuración",
    actions: [
      { key: "config.ver", label: "Ver" },
      { key: "config.editar", label: "Editar ajustes" },
      { key: "config.usuarios", label: "Gestionar usuarios" },
    ],
  },
];

export const rolesMock: Role[] = [
  {
    id: "role_owner",
    name: "Propietario",
    description: "Acceso total a todos los módulos del gimnasio.",
    isSystem: true,
    permissions: permissionCatalogMock.flatMap((m) => m.actions.map((a) => a.key)),
  },
  {
    id: "role_manager",
    name: "Gerente",
    description: "Gestión operativa diaria sin ajustes críticos.",
    isSystem: true,
    permissions: [
      "clientes.ver", "clientes.crear", "clientes.editar",
      "pos.ver", "pos.cobrar", "pos.reembolsar", "pos.cierre",
      "agenda.ver", "agenda.reservar", "agenda.gestionar",
      "inventario.ver", "inventario.ajustar",
      "accesos.ver",
      "reportes.ver", "reportes.exportar",
      "config.ver",
    ],
  },
  {
    id: "role_reception",
    name: "Recepción",
    description: "Atención en mostrador, cobros y reservas.",
    isSystem: false,
    permissions: [
      "clientes.ver", "clientes.crear",
      "pos.ver", "pos.cobrar",
      "agenda.ver", "agenda.reservar",
      "accesos.ver",
    ],
  },
  {
    id: "role_trainer",
    name: "Entrenador",
    description: "Programas de entrenamiento y seguimiento de clientes.",
    isSystem: false,
    permissions: [
      "clientes.ver",
      "agenda.ver", "agenda.reservar",
      "entrenamiento.ver", "entrenamiento.asignar", "entrenamiento.editar",
    ],
  },
];

export const staffMock: StaffUser[] = [
  { id: "usr_1", name: "Marco Guzmán", email: "marco@ironbox.com", roleId: "role_owner", roleName: "Propietario", status: "active", lastActiveAt: "2026-05-24T09:12:00" },
  { id: "usr_2", name: "Lucía Fernández", email: "lucia@ironbox.com", roleId: "role_manager", roleName: "Gerente", status: "active", lastActiveAt: "2026-05-24T08:47:00" },
  { id: "usr_3", name: "Diego Ramírez", email: "diego@ironbox.com", roleId: "role_reception", roleName: "Recepción", status: "active", lastActiveAt: "2026-05-23T19:30:00" },
  { id: "usr_4", name: "Carla Méndez", email: "carla@ironbox.com", roleId: "role_trainer", roleName: "Entrenador", status: "active", lastActiveAt: "2026-05-24T07:05:00" },
  { id: "usr_5", name: "Javier Soto", email: "javier@ironbox.com", roleId: "role_trainer", roleName: "Entrenador", status: "invited", lastActiveAt: null },
  { id: "usr_6", name: "Ana López", email: "ana@ironbox.com", roleId: "role_reception", roleName: "Recepción", status: "invited", lastActiveAt: null },
  { id: "usr_7", name: "Pedro Salas", email: "pedro@ironbox.com", roleId: "role_reception", roleName: "Recepción", status: "disabled", lastActiveAt: "2026-02-10T14:22:00" },
];

export const usersMetricsMock: UsersMetrics = {
  activeUsers: staffMock.filter((u) => u.status === "active").length,
  rolesCount: rolesMock.length,
  pendingInvites: staffMock.filter((u) => u.status === "invited").length,
};
