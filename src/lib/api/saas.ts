import type { PlanDefinition, SaaSMetrics, Tenant } from "@/types/saas";

/**
 * Capa de datos del módulo Admin SaaS.
 * MOCK para demo de UI. Para conectar el backend, reemplazar los retornos por:
 *   getMetrics  -> apiFetch<SaaSMetrics>("/admin/metrics")
 *   getTenants  -> apiFetch<Paginated<Tenant>>("/admin/tenants?page=…")
 *   getPlans    -> apiFetch<PlanDefinition[]>("/admin/plans")
 */

export const saasMetricsMock: SaaSMetrics = {
  mrr: 48250,
  mrrDelta: 12.4,
  activeTenants: 142,
  activeTenantsDelta: 8.1,
  trials: 23,
  churnRate: 2.3,
};

export const plansMock: PlanDefinition[] = [
  {
    id: "lite",
    name: "Lite",
    monthlyPrice: 29,
    maxMembers: 150,
    maxSeats: 2,
    features: ["Clientes y membresías", "POS básico", "Agenda de clases"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 79,
    maxMembers: 600,
    maxSeats: 8,
    highlighted: true,
    features: ["Todo en Lite", "Entrenamiento y nutrición", "CRM y leads", "Control de accesos"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 199,
    maxMembers: 99999,
    maxSeats: 50,
    features: ["Todo en Pro", "Mensajería masiva", "Marca blanca total", "API e integraciones", "Soporte dedicado"],
  },
];

export const tenantsMock: Tenant[] = [
  { id: "tnt_1", name: "Iron Box CrossFit", owner: "Marco Guzmán", plan: "pro", status: "active", mrr: 79, members: 312, seats: 8, createdAt: "2024-03-12", renewsAt: "2026-06-12" },
  { id: "tnt_2", name: "PowerHouse Gym", owner: "Lucía Fernández", plan: "enterprise", status: "active", mrr: 199, members: 1840, seats: 24, createdAt: "2023-11-01", renewsAt: "2026-06-01" },
  { id: "tnt_3", name: "FitZone Studio", owner: "Diego Ramírez", plan: "lite", status: "trial", mrr: 0, members: 64, seats: 2, createdAt: "2026-05-02", renewsAt: "2026-06-02" },
  { id: "tnt_4", name: "Élite Performance", owner: "Carla Méndez", plan: "pro", status: "past_due", mrr: 79, members: 410, seats: 6, createdAt: "2024-07-20", renewsAt: "2026-05-20" },
  { id: "tnt_5", name: "Box 23 Atletas", owner: "Javier Soto", plan: "pro", status: "active", mrr: 79, members: 287, seats: 5, createdAt: "2025-01-15", renewsAt: "2026-07-15" },
  { id: "tnt_6", name: "Trainer Ana López", owner: "Ana López", plan: "lite", status: "suspended", mrr: 0, members: 28, seats: 1, createdAt: "2024-09-09", renewsAt: "2026-04-09" },
];
