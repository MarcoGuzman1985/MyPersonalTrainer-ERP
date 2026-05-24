import type { ID } from "./shared";

/** Resultado del intento de acceso en una puerta/torno. */
export type AccessStatus = "approved" | "denied";

/** Evento individual registrado por el control de accesos. */
export interface AccessEvent {
  id: ID;
  memberName: string;
  /** Foto del socio servida desde el storage del tenant. */
  photoUrl?: string;
  /** Marca temporal del intento en formato ISO 8601. */
  time: string;
  status: AccessStatus;
  /** Motivo del rechazo (membresía vencida, fuera de horario, etc.). */
  reason?: string;
  /** Puerta o torno por el que se intentó el acceso. */
  gate: string;
}

/** Métricas agregadas del control de accesos para el panel de monitoreo. */
export interface AccessStats {
  /** Accesos aprobados registrados hoy. */
  approvedToday: number;
  /** Accesos denegados registrados hoy. */
  deniedToday: number;
  /** Personas actualmente dentro de las instalaciones. */
  currentOccupancy: number;
  /** Aforo máximo permitido. */
  maxOccupancy: number;
}
