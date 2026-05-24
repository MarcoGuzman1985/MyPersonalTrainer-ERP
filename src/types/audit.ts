import type { ID } from "@/types/shared";

/**
 * Tipos del módulo de Logs de Auditoría (Bloque 12).
 * El registro de auditoría es inmutable y de tipo append-only.
 */

/** Tipo de acción registrada en el log de auditoría. */
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export";

/** Entrada de auditoría: quién hizo qué, cuándo y desde dónde. */
export interface AuditLog {
  id: ID;
  /** Marca temporal ISO 8601 del evento. */
  timestamp: string;
  /** Nombre del usuario que ejecutó la acción. */
  user: string;
  /** Rol del usuario en el momento del evento. */
  userRole: string;
  action: AuditAction;
  /** Módulo del ERP donde se originó el evento. */
  module: string;
  /** Dirección IP de origen. */
  ip: string;
  /** Agente de usuario del cliente. */
  userAgent?: string;
  /** Estado previo del recurso (solo en update/delete). */
  before?: Record<string, unknown>;
  /** Estado posterior del recurso (solo en create/update). */
  after?: Record<string, unknown>;
}
