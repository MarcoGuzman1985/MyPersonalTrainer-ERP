import type { ID } from "@/types/shared";

/**
 * Tipos del módulo Mensajería Masiva (WhatsApp vía Evolution API).
 * Cada contrato refleja lo que el backend expondrá en sus endpoints.
 */

/** Configuración de conexión con una instancia de Evolution API. */
export interface EvolutionConfig {
  instanceName: string;
  baseUrl: string;
  apiKey: string;
  connected: boolean;
  phoneNumber?: string;
}

/** Variable dinámica insertable en el cuerpo de una plantilla. */
export interface TemplateVariable {
  /** Token sin llaves, p. ej. "nombre" (se inserta como {{nombre}}). */
  key: string;
  label: string;
  /** Valor de ejemplo usado en la previsualización. */
  sample: string;
}

/** Plantilla de texto reutilizable para envíos masivos. */
export interface MessageTemplate {
  id: ID;
  name: string;
  body: string;
  updatedAt: string;
}

/** Estado del ciclo de vida de un mensaje enviado. */
export type SendStatus = "queued" | "sent" | "delivered" | "read" | "failed";

/** Registro individual del estado de un envío. */
export interface SendLog {
  id: ID;
  recipient: string;
  phone: string;
  templateName: string;
  status: SendStatus;
  sentAt: string;
  error?: string;
}
