import type { AccessEvent, AccessStats, AccessStatus } from "@/types/access";

/**
 * Capa de datos del módulo Control de accesos.
 * MOCK para demo de UI. Para conectar el backend, reemplazar por:
 *   // TODO(backend): WebSocket/SSE /api/access/stream  -> feed en tiempo real de AccessEvent
 *   // TODO(backend): GET /api/access/events            -> historial paginado de AccessEvent
 *   // TODO(backend): GET /api/access/stats             -> AccessStats del día
 */

/** Métricas del día para las StatCards del panel. */
export const accessStatsMock: AccessStats = {
  approvedToday: 248,
  deniedToday: 17,
  currentOccupancy: 86,
  maxOccupancy: 150,
};

/** Pool de socios usado para simular el feed en tiempo real. */
export interface AccessMember {
  name: string;
  photoUrl: string;
}

export const memberPoolMock: AccessMember[] = [
  { name: "Marco Guzmán", photoUrl: "https://i.pravatar.cc/120?img=12" },
  { name: "Lucía Fernández", photoUrl: "https://i.pravatar.cc/120?img=47" },
  { name: "Diego Ramírez", photoUrl: "https://i.pravatar.cc/120?img=33" },
  { name: "Carla Méndez", photoUrl: "https://i.pravatar.cc/120?img=24" },
  { name: "Javier Soto", photoUrl: "https://i.pravatar.cc/120?img=15" },
  { name: "Ana López", photoUrl: "https://i.pravatar.cc/120?img=5" },
  { name: "Pablo Herrera", photoUrl: "https://i.pravatar.cc/120?img=51" },
  { name: "Sofía Navarro", photoUrl: "https://i.pravatar.cc/120?img=44" },
  { name: "Tomás Ruiz", photoUrl: "https://i.pravatar.cc/120?img=68" },
  { name: "Valeria Castro", photoUrl: "https://i.pravatar.cc/120?img=20" },
];

/** Motivos de rechazo posibles cuando un acceso es denegado. */
export const denyReasonsMock: string[] = [
  "Membresía vencida",
  "Fuera de horario permitido",
  "Pago pendiente",
  "Acceso restringido a esta zona",
  "Credencial no reconocida",
];

const gatesMock = ["Entrada principal", "Torno A", "Torno B", "Acceso piscina"] as const;

/** Eventos de acceso recientes (aprobados y denegados con motivos). */
export const accessEventsMock: AccessEvent[] = [
  { id: "acc_1", memberName: "Sofía Navarro", photoUrl: memberPoolMock[7].photoUrl, time: "2026-05-24T09:42:11Z", status: "approved", gate: "Entrada principal" },
  { id: "acc_2", memberName: "Tomás Ruiz", photoUrl: memberPoolMock[8].photoUrl, time: "2026-05-24T09:40:58Z", status: "denied", reason: "Membresía vencida", gate: "Torno A" },
  { id: "acc_3", memberName: "Marco Guzmán", photoUrl: memberPoolMock[0].photoUrl, time: "2026-05-24T09:39:30Z", status: "approved", gate: "Torno B" },
  { id: "acc_4", memberName: "Carla Méndez", photoUrl: memberPoolMock[3].photoUrl, time: "2026-05-24T09:37:02Z", status: "denied", reason: "Pago pendiente", gate: "Entrada principal" },
  { id: "acc_5", memberName: "Lucía Fernández", photoUrl: memberPoolMock[1].photoUrl, time: "2026-05-24T09:35:44Z", status: "approved", gate: "Acceso piscina" },
  { id: "acc_6", memberName: "Diego Ramírez", photoUrl: memberPoolMock[2].photoUrl, time: "2026-05-24T09:33:19Z", status: "approved", gate: "Torno A" },
];

let seedCounter = accessEventsMock.length;

/**
 * Genera un evento de acceso simulado. ~25% de probabilidad de ser denegado.
 * Sustituir por el push entrante del WebSocket/SSE al conectar el backend.
 */
export function generateMockAccessEvent(): AccessEvent {
  seedCounter += 1;
  const member = memberPoolMock[Math.floor(Math.random() * memberPoolMock.length)];
  const gate = gatesMock[Math.floor(Math.random() * gatesMock.length)];
  const denied = Math.random() < 0.25;
  const status: AccessStatus = denied ? "denied" : "approved";

  return {
    id: `acc_live_${seedCounter}`,
    memberName: member.name,
    photoUrl: member.photoUrl,
    time: new Date().toISOString(),
    status,
    gate,
    ...(denied ? { reason: denyReasonsMock[Math.floor(Math.random() * denyReasonsMock.length)] } : {}),
  };
}
