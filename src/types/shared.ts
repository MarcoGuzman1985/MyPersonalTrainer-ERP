/**
 * Tipos transversales reutilizados por múltiples módulos del ERP.
 * Cada módulo extiende estos contratos con sus propias interfaces.
 */

/** Identificador opaco de entidad (UUID en backend). */
export type ID = string;

/** Respuesta paginada estándar del backend. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Estado genérico de carga para vistas conectadas a API. */
export type LoadState = "idle" | "loading" | "success" | "error";

/** Planes comerciales de la plataforma SaaS. */
export type SaaSPlan = "lite" | "pro" | "enterprise";

/** Variante semántica usada por Badge / indicadores. */
export type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

/** Usuario autenticado (sesión). */
export interface SessionUser {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  tenantId: ID;
  permissions: string[];
}

/** Datos básicos del inquilino activo (marca blanca). */
export interface TenantContext {
  id: ID;
  name: string;
  plan: SaaSPlan;
  logoUrl?: string;
  primaryColor: string;
  currency: string;
  locale: string;
}
