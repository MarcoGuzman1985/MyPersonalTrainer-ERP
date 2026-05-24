import type { ID, SaaSPlan } from "./shared";

/** Estado de la cuenta del inquilino dentro de la plataforma. */
export type TenantStatus = "active" | "trial" | "past_due" | "suspended";

/** Inquilino (gimnasio/box/entrenador) gestionado por el superadmin. */
export interface Tenant {
  id: ID;
  name: string;
  owner: string;
  plan: SaaSPlan;
  status: TenantStatus;
  /** MRR aportado por el tenant. */
  mrr: number;
  members: number;
  seats: number;
  createdAt: string;
  renewsAt: string;
}

/** Definición comercial de un plan SaaS. */
export interface PlanDefinition {
  id: SaaSPlan;
  name: string;
  monthlyPrice: number;
  maxMembers: number;
  maxSeats: number;
  features: string[];
  highlighted?: boolean;
}

/** Métricas agregadas de la plataforma para el dashboard del superadmin. */
export interface SaaSMetrics {
  mrr: number;
  mrrDelta: number;
  activeTenants: number;
  activeTenantsDelta: number;
  trials: number;
  churnRate: number;
}
