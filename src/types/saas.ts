import type { ID } from "./shared";

/** Estado de la cuenta del inquilino dentro de la plataforma. */
export type TenantStatus = "active" | "trial" | "past_due" | "suspended";

/** Inquilino (gimnasio/box/entrenador) gestionado por el superadmin. */
export interface Tenant {
  id: ID;
  name: string;
  owner: string;
  ownerEmail: string;
  /** Catálogo dinámico de plan_definitions (alta/baja vía API), no un enum cerrado. */
  plan: string;
  status: TenantStatus;
  /** MRR aportado por el tenant. */
  mrr: number;
  members: number;
  seats: number;
  createdAt: string;
  renewsAt: string;
  metadata: Record<string, unknown>;
}

/** Definición comercial de un plan SaaS (catálogo dinámico, administrable por API). */
export interface PlanDefinition {
  id: string;
  name: string;
  monthlyPrice: number;
  maxMembers: number;
  maxSeats: number;
  features: string[];
  highlighted?: boolean;
}

/** Proveedores de integraciones externas soportados por tenant. */
export type IntegrationProvider = "google_calendar" | "meta" | "whatsapp" | "gemini";

/** Credenciales de una integración externa configurada para un tenant. */
export interface TenantIntegration {
  provider: IntegrationProvider;
  credentials: Record<string, unknown>;
  isActive: boolean;
}

/** Estado de revisión de un comprobante de renovación. */
export type RenewalStatus = "pending" | "approved" | "rejected";

/** Comprobante de pago subido por el tenant para renovar su suscripción. */
export interface SubscriptionRenewal {
  id: ID;
  amount: number;
  receiptUrl: string;
  status: RenewalStatus;
  createdAt: string;
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
