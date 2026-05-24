import type { ID } from "./shared";

/**
 * Tipos del módulo Agenda y Clases (Bloque 6).
 * Cada módulo extiende los contratos transversales de "@/types/shared".
 */

/** Disciplina / categoría de la clase impartida. */
export type ClassType =
  | "crossfit"
  | "spinning"
  | "yoga"
  | "funcional"
  | "boxeo"
  | "hiit";

/** Clase programada en la agenda del gimnasio. */
export interface GymClass {
  id: ID;
  title: string;
  coach: string;
  room: string;
  /** Inicio en ISO 8601 (con offset). */
  start: string;
  /** Fin en ISO 8601 (con offset). */
  end: string;
  /** Aforo máximo de plazas. */
  capacity: number;
  /** Plazas ya reservadas. */
  booked: number;
  /** Personas en lista de espera (cuando booked >= capacity). */
  waitlist: number;
  type: ClassType;
}

/** Socio inscrito en una clase (detalle del modal). */
export interface ClassAttendee {
  id: ID;
  name: string;
  avatarUrl?: string;
  /** En lista de espera en lugar de plaza confirmada. */
  waitlisted?: boolean;
}
