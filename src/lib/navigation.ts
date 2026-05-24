import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  ShoppingCart,
  Dumbbell,
  CalendarDays,
  Salad,
  ScanLine,
  Boxes,
  KanbanSquare,
  MessageSquare,
  ScrollText,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** Bloque del 1 al 14 según especificación. */
  block: number;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permiso RBAC requerido para ver el módulo. */
  permission: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Mapa de navegación de los 14 bloques agrupados por dominio funcional.
 * El Sidebar filtra estos items según los permisos del usuario en sesión.
 */
export const navigation: NavGroup[] = [
  {
    label: "Plataforma",
    items: [
      { block: 1, label: "Admin SaaS", href: "/saas", icon: LayoutDashboard, permission: "saas.view" },
      { block: 2, label: "Usuarios y Permisos", href: "/usuarios", icon: ShieldCheck, permission: "users.view" },
    ],
  },
  {
    label: "Operación",
    items: [
      { block: 3, label: "Clientes y Membresías", href: "/clientes", icon: Users, permission: "members.view" },
      { block: 4, label: "Ventas / POS", href: "/pos", icon: ShoppingCart, permission: "pos.view" },
      { block: 6, label: "Agenda y Clases", href: "/agenda", icon: CalendarDays, permission: "schedule.view" },
      { block: 8, label: "Control de Accesos", href: "/accesos", icon: ScanLine, permission: "access.view" },
    ],
  },
  {
    label: "Programas",
    items: [
      { block: 5, label: "Entrenamiento", href: "/entrenamiento", icon: Dumbbell, permission: "training.view" },
      { block: 7, label: "Nutrición", href: "/nutricion", icon: Salad, permission: "nutrition.view" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { block: 10, label: "CRM y Leads", href: "/crm", icon: KanbanSquare, permission: "crm.view" },
      { block: 11, label: "Mensajería Masiva", href: "/mensajeria", icon: MessageSquare, permission: "messaging.view" },
      { block: 9, label: "Inventario", href: "/inventario", icon: Boxes, permission: "inventory.view" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { block: 12, label: "Logs de Auditoría", href: "/auditoria", icon: ScrollText, permission: "audit.view" },
      { block: 13, label: "Salud del Sistema", href: "/sistema", icon: Activity, permission: "system.view" },
      { block: 14, label: "Configuración Tenant", href: "/configuracion", icon: Settings, permission: "tenant.view" },
    ],
  },
];

/** Lista plana de todos los módulos (útil para breadcrumbs / búsqueda). */
export const allNavItems: NavItem[] = navigation.flatMap((g) => g.items);
