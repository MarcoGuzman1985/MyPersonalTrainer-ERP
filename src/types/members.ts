import type { ID, SaaSPlan } from "./shared";

/** Estado de la membresía de un socio. */
export type MembershipStatus = "active" | "expired" | "frozen";

/** Sexo biológico del socio (relevante para baremos antropométricos). */
export type Gender = "male" | "female" | "other";

/** Suscripción/membresía vigente del socio. */
export interface Subscription {
  /** Plan comercial contratado por el socio. */
  plan: SaaSPlan;
  status: MembershipStatus;
  /** Fecha de inicio del periodo actual (ISO). */
  startDate: string;
  /** Fecha de fin/vencimiento del periodo actual (ISO). */
  endDate: string;
  /** Importe periódico de la cuota. */
  price: number;
  /** Renovación automática activa. */
  autoRenew: boolean;
  /** Si está congelada, fecha estimada de reactivación (ISO). */
  frozenUntil?: string;
}

/** Medición antropométrica puntual del socio. */
export interface AnthropometricEntry {
  id: ID;
  /** Fecha de la medición (ISO). */
  date: string;
  weightKg: number;
  bodyFatPct: number;
  /** Masa muscular en kg (opcional). */
  muscleMassKg?: number;
}

/** Registro de check-in / asistencia del socio. */
export interface AttendanceRecord {
  id: ID;
  /** Fecha y hora del check-in (ISO). */
  checkInAt: string;
  /** Tipo de clase o acceso. */
  classType: string;
  /** Entrenador o sala asociada (opcional). */
  coach?: string;
}

/** Socio (cliente) del gimnasio con su perfil 360°. */
export interface Member {
  id: ID;
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  /** Fecha de nacimiento (ISO). */
  birthDate: string;
  /** Foto del socio servida desde el storage del tenant. */
  avatarUrl?: string;
  /** Etiquetas libres para segmentación (ej. "VIP", "Riesgo de baja"). */
  tags: string[];
  /** Alta del socio en la plataforma (ISO). */
  createdAt: string;
  subscription: Subscription;
  /** Historial de mediciones, orden cronológico ascendente. */
  anthropometrics: AnthropometricEntry[];
  /** Historial de asistencias, orden cronológico descendente. */
  attendance: AttendanceRecord[];
}

/** Métricas agregadas de la cartera de socios. */
export interface MembersMetrics {
  active: number;
  activeDelta: number;
  expiringThisWeek: number;
  frozen: number;
  newThisMonth: number;
  newThisMonthDelta: number;
}
