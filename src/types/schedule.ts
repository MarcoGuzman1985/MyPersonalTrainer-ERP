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
  coachId: ID | null;
  room: string;
  roomId: ID;
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
  /** Solo presente cuando se filtra por memberId: su estado de reserva en esta clase. */
  memberBookingStatus?: "confirmed" | "waitlisted" | null;
}

/** Socio inscrito en una clase (detalle del modal). */
export interface ClassAttendee {
  id: ID;
  memberId: ID;
  name: string;
  avatarUrl?: string;
  /** En lista de espera en lugar de plaza confirmada. */
  waitlisted?: boolean;
}

/** Estado operativo de una sala/espacio. */
export type RoomStatus = "active" | "maintenance";

/** Sala o espacio físico donde se imparten clases. */
export interface Room {
  id: ID;
  name: string;
  capacity: number;
  status: RoomStatus;
  notes: string | null;
}

/** Entrenador/coach del gimnasio (entidad propia, no requiere acceso al ERP). */
export interface Coach {
  id: ID;
  firstName: string;
  lastName: string;
  /** Computado en servidor: "firstName lastName". */
  name: string;
  dob: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  anthropometricData: Record<string, unknown>;
}
