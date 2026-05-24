import type { ID } from "@/types/shared";

/** Severidad de un evento registrado por el sistema. */
export type LogLevel = "error" | "warning" | "info";

/** Excepción o evento capturado por el sistema de monitorización. */
export interface SystemError {
  id: ID;
  level: LogLevel;
  message: string;
  /** Origen del error (servicio, módulo o endpoint). */
  source: string;
  /** Número de ocurrencias agregadas del mismo error. */
  count: number;
  firstSeen: string;
  lastSeen: string;
  /** Traza de pila opcional (solo disponible en algunos errores). */
  stack?: string;
  resolved: boolean;
}

/** Canal por el que se entrega una alerta. */
export type AlertChannel = "push" | "email" | "webhook";

/** Regla configurable que dispara una notificación interna. */
export interface AlertRule {
  id: ID;
  name: string;
  description: string;
  channel: AlertChannel;
  enabled: boolean;
  /** Umbral de ocurrencias/segundos a partir del cual se dispara. */
  threshold: number;
}

/** Métrica de salud puntual del sistema (uso de recursos). */
export interface HealthStat {
  id: ID;
  label: string;
  /** Valor actual en porcentaje (0-100). */
  value: number;
  /** Umbral de advertencia. Por encima -> warning. */
  warnAt: number;
  /** Umbral crítico. Por encima -> danger. */
  dangerAt: number;
}
