import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { platformTransaction } from "@/lib/db/tenantQuery";
import { getTransporter, attemptSend } from "@/lib/mail/sendMail";

// Cuántas filas reclama como máximo cada invocación del cron (Tanda 5).
const BATCH_SIZE = 20;
// Backoff en minutos indexado por (attempts - 1) tras un fallo: 1er fallo
// espera 1min, ..., 5º fallo espera 6h. El 6º fallo pasa a status='failed'.
const BACKOFF_MINUTES = [1, 5, 30, 120, 360];
const MAX_ATTEMPTS = 6;

// Endpoint de servidor-a-servidor (cron externo, Tanda 5), no usa JWT de
// usuario: se protege con un token estático compartido vía header, igual
// que /api/webhooks/expiring-trials.
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-webhook-token");
  if (!token || token !== process.env.CRON_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const lockId = randomUUID();

  // Claim: reclama un lote de filas pendientes y listas para reintentar,
  // con FOR UPDATE SKIP LOCKED para que dos flushes concurrentes nunca
  // reclamen la misma fila. Transacción corta, cruza tenants (is_platform).
  const claimed = await platformTransaction((client) =>
    client.query<{ id: string; to_email: string; subject: string; html: string; attempts: number }>(
      `UPDATE emails_outbox
         SET locked_by = $1, locked_at = now()
       WHERE id IN (
         SELECT id FROM emails_outbox
          WHERE status = 'pending' AND next_attempt_at <= now() AND locked_by IS NULL
          ORDER BY next_attempt_at ASC
          LIMIT $2
          FOR UPDATE SKIP LOCKED
       )
       RETURNING id, to_email, subject, html, attempts`,
      [lockId, BATCH_SIZE],
    ),
  );

  // Los envíos SMTP son I/O bloqueante: se hacen fuera de la transacción de
  // claim para no mantener locks de fila abiertos mientras se espera al SMTP.
  const mailer = getTransporter();
  let sent = 0;
  let failed = 0;
  let requeued = 0;

  for (const row of claimed.rows) {
    const result = await attemptSend(mailer, row);

    if (result.ok) {
      await platformTransaction((client) =>
        client.query(
          `UPDATE emails_outbox
             SET status = 'sent', sent_at = now(), locked_by = NULL, locked_at = NULL
           WHERE id = $1`,
          [row.id],
        ),
      );
      sent++;
      continue;
    }

    const attempts = row.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await platformTransaction((client) =>
        client.query(
          `UPDATE emails_outbox
             SET status = 'failed', attempts = $2, last_error = $3, locked_by = NULL, locked_at = NULL
           WHERE id = $1`,
          [row.id, attempts, result.error],
        ),
      );
      failed++;
    } else {
      const backoffMinutes = BACKOFF_MINUTES[attempts - 1];
      await platformTransaction((client) =>
        client.query(
          `UPDATE emails_outbox
             SET attempts = $2, last_error = $3, locked_by = NULL, locked_at = NULL,
                 next_attempt_at = now() + make_interval(mins => $4)
           WHERE id = $1`,
          [row.id, attempts, result.error, backoffMinutes],
        ),
      );
      requeued++;
    }
  }

  return NextResponse.json({ claimed: claimed.rows.length, sent, failed, requeued });
}
