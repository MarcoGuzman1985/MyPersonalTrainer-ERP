import nodemailer from "nodemailer";
import type { PoolClient } from "pg";
import { tenantTransaction } from "@/lib/db/tenantQuery";

interface TenantAuth {
  tenantId: string;
}

interface MailPayload {
  to: string;
  subject: string;
  html: string;
}

interface OutboxRow {
  id: string;
  to_email: string;
  subject: string;
  html: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/** Envío síncrono directo — usado por invitación de staff y reset de password,
 * donde el usuario está mirando la pantalla y espera un emailSent inmediato. */
export async function sendMail(to: string, subject: string, html: string) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM ?? "MyPersonalTrainer ERP <no-reply@mypersonaltrainer.app>",
    to,
    subject,
    html,
  });
}

/** Encola un correo en emails_outbox para envío asíncrono con retry (recibo
 * POS). Si se pasa `existingClient` (p. ej. el client de la tenantTransaction
 * del checkout), el INSERT se hace en esa misma conexión/transacción, así
 * que un fallo hace rollback de la operación completa (mejor una venta que
 * no cerró que una venta cerrada sin recibo persistido para reintento). Sin
 * `existingClient`, abre su propia tenantTransaction. */
export async function enqueueMail(auth: TenantAuth, payload: MailPayload, existingClient?: PoolClient) {
  const insert = (client: PoolClient) =>
    client.query(
      `INSERT INTO emails_outbox (tenant_id, to_email, subject, html)
       VALUES ($1, $2, $3, $4)`,
      [auth.tenantId, payload.to, payload.subject, payload.html],
    );

  if (existingClient) {
    await insert(existingClient);
    return;
  }
  await tenantTransaction(auth, (client) => insert(client));
}

/** Intenta enviar una fila del outbox con el transporter dado. Nunca lanza:
 * siempre devuelve un resultado tipado para que el caller decida qué UPDATE
 * hacer (sent vs. reprogramar/failed) sin envolver todo en try/catch propio.
 * Permite override MAILER_FORCE_FAIL=true (solo para smoke test) que fuerza
 * un fallo sintético sin depender de un SMTP real. */
export async function attemptSend(
  mailer: ReturnType<typeof nodemailer.createTransport>,
  row: OutboxRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (process.env.MAILER_FORCE_FAIL === "true") {
    return { ok: false, error: "MAILER_FORCE_FAIL activo (fallo sintético para smoke test)" };
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? "MyPersonalTrainer ERP <no-reply@mypersonaltrainer.app>",
      to: row.to_email,
      subject: row.subject,
      html: row.html,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido enviando el correo." };
  }
}
