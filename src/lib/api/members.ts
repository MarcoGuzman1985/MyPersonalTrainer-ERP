import type { Member, MembersMetrics } from "@/types/members";

/**
 * Capa de datos del módulo Clientes y Membresías.
 * MOCK para demo de UI. Para conectar el backend, reemplazar los retornos por
 * llamadas asíncronas (apiFetch) en hooks/effects de los componentes:
 *   getMembersMetrics -> apiFetch<MembersMetrics>("/members/metrics")
 *   getMembers        -> apiFetch<Paginated<Member>>("/members?search=&status=&page=")
 *   getMember         -> apiFetch<Member>(`/members/${id}`)
 *
 * Mutaciones de suscripción (ver perfil 360°):
 *   renovar   -> POST /api/members/:id/subscription/renew
 *   congelar  -> POST /api/members/:id/subscription/freeze
 *   reactivar -> POST /api/members/:id/subscription/unfreeze
 */

export const membersMetricsMock: MembersMetrics = {
  active: 248,
  activeDelta: 6.2,
  expiringThisWeek: 14,
  frozen: 9,
  newThisMonth: 31,
  newThisMonthDelta: 11.5,
};

export const membersMock: Member[] = [
  {
    id: "mbr_1",
    name: "Marco Guzmán",
    email: "marco.guzman@example.com",
    phone: "+34 612 345 678",
    gender: "male",
    birthDate: "1991-04-18",
    tags: ["VIP", "CrossFit"],
    createdAt: "2024-02-11",
    subscription: {
      plan: "pro",
      status: "active",
      startDate: "2026-05-01",
      endDate: "2026-06-01",
      price: 49.9,
      autoRenew: true,
    },
    anthropometrics: [
      { id: "an_1a", date: "2026-01-10", weightKg: 84.2, bodyFatPct: 21.4, muscleMassKg: 38.1 },
      { id: "an_1b", date: "2026-02-12", weightKg: 83.1, bodyFatPct: 20.1, muscleMassKg: 38.6 },
      { id: "an_1c", date: "2026-03-14", weightKg: 82.0, bodyFatPct: 18.9, muscleMassKg: 39.2 },
      { id: "an_1d", date: "2026-04-16", weightKg: 81.3, bodyFatPct: 17.8, muscleMassKg: 39.8 },
      { id: "an_1e", date: "2026-05-18", weightKg: 80.6, bodyFatPct: 16.9, muscleMassKg: 40.3 },
    ],
    attendance: [
      { id: "at_1a", checkInAt: "2026-05-23T19:05:00", classType: "WOD CrossFit", coach: "Lucía F." },
      { id: "at_1b", checkInAt: "2026-05-21T08:30:00", classType: "Halterofilia", coach: "Diego R." },
      { id: "at_1c", checkInAt: "2026-05-19T19:10:00", classType: "WOD CrossFit", coach: "Lucía F." },
      { id: "at_1d", checkInAt: "2026-05-17T11:00:00", classType: "Open Box" },
      { id: "at_1e", checkInAt: "2026-05-14T18:45:00", classType: "Movilidad", coach: "Ana L." },
    ],
  },
  {
    id: "mbr_2",
    name: "Lucía Fernández",
    email: "lucia.fernandez@example.com",
    phone: "+34 600 112 233",
    gender: "female",
    birthDate: "1995-09-02",
    tags: ["Coach", "VIP"],
    createdAt: "2023-11-20",
    subscription: {
      plan: "enterprise",
      status: "active",
      startDate: "2026-05-10",
      endDate: "2026-06-10",
      price: 79.0,
      autoRenew: true,
    },
    anthropometrics: [
      { id: "an_2a", date: "2026-02-01", weightKg: 62.0, bodyFatPct: 24.0 },
      { id: "an_2b", date: "2026-03-05", weightKg: 61.4, bodyFatPct: 23.1 },
      { id: "an_2c", date: "2026-04-08", weightKg: 60.9, bodyFatPct: 22.4 },
      { id: "an_2d", date: "2026-05-12", weightKg: 60.5, bodyFatPct: 21.8 },
    ],
    attendance: [
      { id: "at_2a", checkInAt: "2026-05-24T07:00:00", classType: "Funcional", coach: "Diego R." },
      { id: "at_2b", checkInAt: "2026-05-22T07:00:00", classType: "Funcional", coach: "Diego R." },
      { id: "at_2c", checkInAt: "2026-05-20T20:00:00", classType: "Yoga", coach: "Ana L." },
    ],
  },
  {
    id: "mbr_3",
    name: "Diego Ramírez",
    email: "diego.ramirez@example.com",
    phone: "+34 655 778 899",
    gender: "male",
    birthDate: "1988-12-30",
    tags: ["Riesgo de baja"],
    createdAt: "2024-07-05",
    subscription: {
      plan: "lite",
      status: "expired",
      startDate: "2026-04-01",
      endDate: "2026-05-01",
      price: 29.9,
      autoRenew: false,
    },
    anthropometrics: [
      { id: "an_3a", date: "2026-01-15", weightKg: 95.0, bodyFatPct: 28.5 },
      { id: "an_3b", date: "2026-02-18", weightKg: 94.2, bodyFatPct: 27.9 },
      { id: "an_3c", date: "2026-03-20", weightKg: 95.6, bodyFatPct: 28.8 },
    ],
    attendance: [
      { id: "at_3a", checkInAt: "2026-04-28T18:00:00", classType: "Sala de pesas" },
      { id: "at_3b", checkInAt: "2026-04-25T18:30:00", classType: "Sala de pesas" },
    ],
  },
  {
    id: "mbr_4",
    name: "Carla Méndez",
    email: "carla.mendez@example.com",
    phone: "+34 699 001 020",
    gender: "female",
    birthDate: "2000-06-21",
    tags: ["Nueva", "Plan nutrición"],
    createdAt: "2026-05-09",
    subscription: {
      plan: "pro",
      status: "frozen",
      startDate: "2026-05-09",
      endDate: "2026-08-09",
      price: 49.9,
      autoRenew: true,
      frozenUntil: "2026-07-01",
    },
    anthropometrics: [
      { id: "an_4a", date: "2026-05-09", weightKg: 58.4, bodyFatPct: 26.2 },
      { id: "an_4b", date: "2026-05-20", weightKg: 58.0, bodyFatPct: 25.7 },
    ],
    attendance: [
      { id: "at_4a", checkInAt: "2026-05-18T17:30:00", classType: "Onboarding", coach: "Lucía F." },
    ],
  },
  {
    id: "mbr_5",
    name: "Javier Soto",
    email: "javier.soto@example.com",
    phone: "+34 644 556 677",
    gender: "male",
    birthDate: "1983-03-11",
    tags: ["Maratón"],
    createdAt: "2025-01-22",
    subscription: {
      plan: "pro",
      status: "active",
      startDate: "2026-05-15",
      endDate: "2026-05-28",
      price: 49.9,
      autoRenew: true,
    },
    anthropometrics: [
      { id: "an_5a", date: "2026-02-02", weightKg: 74.0, bodyFatPct: 14.2 },
      { id: "an_5b", date: "2026-03-06", weightKg: 73.2, bodyFatPct: 13.5 },
      { id: "an_5c", date: "2026-04-10", weightKg: 72.6, bodyFatPct: 12.9 },
      { id: "an_5d", date: "2026-05-14", weightKg: 72.1, bodyFatPct: 12.4 },
    ],
    attendance: [
      { id: "at_5a", checkInAt: "2026-05-23T06:30:00", classType: "Running", coach: "Diego R." },
      { id: "at_5b", checkInAt: "2026-05-22T06:30:00", classType: "Running", coach: "Diego R." },
      { id: "at_5c", checkInAt: "2026-05-20T06:30:00", classType: "Core" },
      { id: "at_5d", checkInAt: "2026-05-18T06:30:00", classType: "Running", coach: "Diego R." },
    ],
  },
  {
    id: "mbr_6",
    name: "Ana López",
    email: "ana.lopez@example.com",
    phone: "+34 677 889 900",
    gender: "female",
    birthDate: "1997-11-04",
    tags: ["Estudiante"],
    createdAt: "2024-09-30",
    subscription: {
      plan: "lite",
      status: "frozen",
      startDate: "2026-03-01",
      endDate: "2026-09-01",
      price: 29.9,
      autoRenew: false,
      frozenUntil: "2026-06-15",
    },
    anthropometrics: [
      { id: "an_6a", date: "2026-02-28", weightKg: 55.2, bodyFatPct: 23.0 },
      { id: "an_6b", date: "2026-04-01", weightKg: 55.0, bodyFatPct: 22.6 },
    ],
    attendance: [
      { id: "at_6a", checkInAt: "2026-04-30T16:00:00", classType: "Pilates", coach: "Ana L." },
    ],
  },
];
