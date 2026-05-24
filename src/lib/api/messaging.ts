import type {
  EvolutionConfig,
  MessageTemplate,
  SendLog,
  TemplateVariable,
} from "@/types/messaging";

/**
 * Capa de datos del módulo Mensajería Masiva (WhatsApp / Evolution API).
 * MOCK para demo de UI. Para conectar el backend, reemplazar por:
 *   TODO(backend): POST /api/messaging/evolution/test  -> probar conexión de la instancia
 *   TODO(backend): POST /api/messaging/send            -> encolar envío masivo
 *   TODO(backend): GET  /api/messaging/logs            -> historial de estados de envío
 */

/** Configuración de ejemplo de la instancia Evolution API. */
export const evolutionConfigMock: EvolutionConfig = {
  instanceName: "biostim-principal",
  baseUrl: "https://evolution.miservidor.com",
  apiKey: "evo_sk_3f9a2b1c4d5e6f7081920304a5b6c7d8",
  connected: true,
  phoneNumber: "+34 612 345 678",
};

/** Variables dinámicas disponibles para las plantillas. */
export const templateVariablesMock: TemplateVariable[] = [
  { key: "nombre", label: "Nombre del cliente", sample: "Laura" },
  { key: "plan", label: "Plan contratado", sample: "Pro Mensual" },
  { key: "vencimiento", label: "Fecha de vencimiento", sample: "31/05/2026" },
  { key: "gimnasio", label: "Nombre del gimnasio", sample: "Iron Box CrossFit" },
];

/** Plantillas de texto preconfiguradas. */
export const templatesMock: MessageTemplate[] = [
  {
    id: "tpl_1",
    name: "Recordatorio de vencimiento",
    body: "Hola {{nombre}} 👋, tu plan {{plan}} en {{gimnasio}} vence el {{vencimiento}}. ¡Renueva para no perder tu rutina!",
    updatedAt: "2026-05-20T10:15:00.000Z",
  },
  {
    id: "tpl_2",
    name: "Bienvenida",
    body: "¡Bienvenido/a a {{gimnasio}}, {{nombre}}! Tu plan {{plan}} ya está activo. Cualquier duda, estamos aquí. 💪",
    updatedAt: "2026-05-18T16:42:00.000Z",
  },
  {
    id: "tpl_3",
    name: "Promoción reactivación",
    body: "{{nombre}}, te echamos de menos en {{gimnasio}}. Vuelve con un 20% en tu próximo {{plan}}. ¡Te esperamos!",
    updatedAt: "2026-05-12T09:05:00.000Z",
  },
];

/** Historial de envíos con distintos estados. */
export const sendLogsMock: SendLog[] = [
  { id: "log_1", recipient: "Laura Méndez", phone: "+34 612 345 678", templateName: "Recordatorio de vencimiento", status: "read", sentAt: "2026-05-24T08:12:30.000Z" },
  { id: "log_2", recipient: "Carlos Ruiz", phone: "+34 655 112 233", templateName: "Bienvenida", status: "delivered", sentAt: "2026-05-24T08:11:05.000Z" },
  { id: "log_3", recipient: "Marta Soler", phone: "+34 699 887 766", templateName: "Recordatorio de vencimiento", status: "sent", sentAt: "2026-05-24T08:09:48.000Z" },
  { id: "log_4", recipient: "Javier Ortega", phone: "+34 622 334 455", templateName: "Promoción reactivación", status: "failed", sentAt: "2026-05-24T08:07:21.000Z", error: "Número no registrado en WhatsApp" },
  { id: "log_5", recipient: "Ana López", phone: "+34 633 221 100", templateName: "Bienvenida", status: "queued", sentAt: "2026-05-24T08:06:00.000Z" },
  { id: "log_6", recipient: "Diego Ramírez", phone: "+34 644 556 677", templateName: "Recordatorio de vencimiento", status: "read", sentAt: "2026-05-24T07:58:14.000Z" },
  { id: "log_7", recipient: "Lucía Fernández", phone: "+34 677 889 900", templateName: "Promoción reactivación", status: "delivered", sentAt: "2026-05-24T07:55:42.000Z" },
  { id: "log_8", recipient: "Pablo Navarro", phone: "+34 611 223 344", templateName: "Bienvenida", status: "failed", sentAt: "2026-05-23T19:40:10.000Z", error: "Tiempo de espera agotado" },
];
