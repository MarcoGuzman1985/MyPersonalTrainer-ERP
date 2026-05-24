import type { AlertRule, HealthStat, SystemError } from "@/types/system";

/**
 * Capa de datos del módulo Salud del Sistema (logs, excepciones y alertas).
 * MOCK para demo de UI. Para conectar el backend, reemplazar los retornos por:
 *   getErrors   -> apiFetch<SystemError[]>("/system/errors")
 *   getAlerts   -> apiFetch<AlertRule[]>("/system/alerts")
 *   getHealth   -> apiFetch<HealthStat[]>("/system/health")
 */

// TODO(backend): GET /api/system/errors
export const systemErrorsMock: SystemError[] = [
  {
    id: "err_1",
    level: "error",
    message: "TypeError: Cannot read properties of undefined (reading 'id')",
    source: "checkout/PaymentService.ts",
    count: 47,
    firstSeen: "2026-05-22T08:14:00Z",
    lastSeen: "2026-05-24T09:41:00Z",
    resolved: false,
    stack: `TypeError: Cannot read properties of undefined (reading 'id')
    at PaymentService.charge (checkout/PaymentService.ts:128:24)
    at async POS.confirm (pos/Checkout.tsx:212:9)
    at async processQueue (lib/queue.ts:54:7)`,
  },
  {
    id: "err_2",
    level: "error",
    message: "PrismaClientKnownRequestError: Timed out fetching a connection from the pool",
    source: "db/prisma.ts",
    count: 12,
    firstSeen: "2026-05-23T19:02:00Z",
    lastSeen: "2026-05-24T08:55:00Z",
    resolved: false,
    stack: `PrismaClientKnownRequestError: Timed out fetching a connection from the pool
    at Object.request (db/prisma.ts:33:11)
    at MembersRepository.findMany (members/repository.ts:71:18)`,
  },
  {
    id: "err_3",
    level: "warning",
    message: "Deprecation: el endpoint /v1/members será retirado el 2026-09-01",
    source: "api/v1/members",
    count: 318,
    firstSeen: "2026-05-01T00:00:00Z",
    lastSeen: "2026-05-24T10:03:00Z",
    resolved: false,
  },
  {
    id: "err_4",
    level: "warning",
    message: "Slow query detectada (>800ms) en agregación de asistencias",
    source: "analytics/AttendanceAggregator.ts",
    count: 64,
    firstSeen: "2026-05-20T11:30:00Z",
    lastSeen: "2026-05-24T07:18:00Z",
    resolved: false,
    stack: `Warning: slow query 842ms
    at AttendanceAggregator.run (analytics/AttendanceAggregator.ts:96:5)`,
  },
  {
    id: "err_5",
    level: "info",
    message: "Reintento de webhook a Stripe completado con éxito",
    source: "billing/StripeWebhook.ts",
    count: 9,
    firstSeen: "2026-05-23T14:00:00Z",
    lastSeen: "2026-05-24T06:42:00Z",
    resolved: true,
  },
  {
    id: "err_6",
    level: "error",
    message: "FetchError: failed to send push notification (FCM 502)",
    source: "notifications/PushSender.ts",
    count: 5,
    firstSeen: "2026-05-24T05:10:00Z",
    lastSeen: "2026-05-24T05:48:00Z",
    resolved: true,
    stack: `FetchError: request to fcm.googleapis.com failed, reason: 502
    at ClientRequest.<anonymous> (notifications/PushSender.ts:44:13)`,
  },
  {
    id: "err_7",
    level: "info",
    message: "Caché de planes invalidada tras actualización comercial",
    source: "saas/PlanCache.ts",
    count: 3,
    firstSeen: "2026-05-24T03:00:00Z",
    lastSeen: "2026-05-24T03:01:00Z",
    resolved: false,
  },
];

// TODO(backend): PATCH /api/system/alerts/:id
export const alertRulesMock: AlertRule[] = [
  {
    id: "alr_1",
    name: "Pico de errores 5xx",
    description: "Notifica cuando los errores de servidor superan el umbral en 1 minuto.",
    channel: "push",
    enabled: true,
    threshold: 10,
  },
  {
    id: "alr_2",
    name: "Latencia elevada",
    description: "Avisa si la latencia media supera el umbral durante 5 minutos.",
    channel: "push",
    enabled: true,
    threshold: 500,
  },
  {
    id: "alr_3",
    name: "Cola de trabajos saturada",
    description: "Alerta interna cuando la cola de jobs supera el umbral de elementos pendientes.",
    channel: "push",
    enabled: false,
    threshold: 200,
  },
  {
    id: "alr_4",
    name: "Fallo de pagos recurrente",
    description: "Notifica al detectar fallos repetidos en el procesador de pagos.",
    channel: "email",
    enabled: true,
    threshold: 3,
  },
  {
    id: "alr_5",
    name: "Caída de webhooks",
    description: "Dispara un webhook de monitorización si la entrega externa falla.",
    channel: "webhook",
    enabled: false,
    threshold: 5,
  },
];

export const healthStatsMock: HealthStat[] = [
  { id: "cpu", label: "Uso de CPU", value: 38, warnAt: 70, dangerAt: 90 },
  { id: "mem", label: "Uso de memoria", value: 72, warnAt: 70, dangerAt: 90 },
  { id: "queue", label: "Cola de trabajos", value: 94, warnAt: 60, dangerAt: 85 },
];
