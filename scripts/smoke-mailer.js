#!/usr/bin/env node
/**
 * Smoke test del outbox de correo (Tanda 4): enqueue -> flush -> retry con
 * backoff -> agotamiento -> concurrencia -> auth del webhook.
 *
 * Necesita acceso directo a Postgres (DATABASE_URL en .env.local) porque
 * verifica columnas internas (attempts, next_attempt_at, last_error) que
 * ninguna API expone, y porque enqueueMail() no tiene endpoint HTTP propio
 * (solo se usa desde POST /api/pos/checkout). Las filas de prueba se
 * insertan con los mismos defaults de columna que usa enqueueMail
 * (status/attempts/next_attempt_at), no llamando a la función TS.
 *
 * IMPORTANTE — MAILER_FORCE_FAIL es un flag de proceso completo (afecta
 * TODOS los envíos del servidor, no uno por fila), y un proceso de Node ya
 * corriendo no puede cambiar sus propias env vars en caliente. Por eso este
 * script tiene DOS FASES que requieren reiniciar el servidor entre una y
 * otra — no se puede cubrir "envío real exitoso" y "fallo forzado" en la
 * misma corrida de `npm run dev`:
 *
 *   Fase normal (servidor SIN MAILER_FORCE_FAIL):
 *     npm run dev
 *     SMOKE_TENANT_ID=... CRON_WEBHOOK_TOKEN=... node scripts/smoke-mailer.js
 *   -> corre: defaults de enqueue, auth 401 del webhook, envío real exitoso.
 *
 *   Fase de fallo forzado (servidor CON MAILER_FORCE_FAIL=true):
 *     MAILER_FORCE_FAIL=true npm run dev
 *     SMOKE_TENANT_ID=... CRON_WEBHOOK_TOKEN=... MAILER_FORCE_FAIL=true node scripts/smoke-mailer.js
 *   -> corre: retry con backoff, agotamiento, concurrencia (todas deterministas
 *      porque no dependen de que el SMTP real falle).
 *
 * Uso (variables comunes a ambas fases):
 *   SMOKE_TENANT_ID=<uuid de un tenant real> \
 *   CRON_WEBHOOK_TOKEN=<token, o se lee de .env.local> \
 *   [SMOKE_BASE_URL=http://localhost:3000] \
 *   [SMOKE_TEST_EMAIL=<inbox real para el caso de envío exitoso>] \
 *   [MAILER_FORCE_FAIL=true] \
 *   node scripts/smoke-mailer.js
 */

require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const FORCE_FAIL_PHASE = process.env.MAILER_FORCE_FAIL === "true";

function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Falta la variable de entorno ${name}. Ver el comentario de uso al inicio de este script.`);
    process.exit(1);
  }
  return v;
}

const pool = new Pool({ connectionString: need("DATABASE_URL"), ssl: { rejectUnauthorized: false } });

async function withPlatformClient(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.is_platform', 'true', true)");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Inserta una fila usando los defaults de columna (igual que enqueueMail),
 * con overrides opcionales para simular estados intermedios (fallo previo,
 * agotamiento). */
async function insertRow(tenantId, toEmail, overrides = {}) {
  return withPlatformClient(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO emails_outbox (tenant_id, to_email, subject, html, status, attempts, next_attempt_at)
       VALUES ($1, $2, 'Smoke test outbox', '<p>smoke test</p>', 'pending', $3, $4)
       RETURNING id, status, attempts, next_attempt_at`,
      [tenantId, toEmail, overrides.attempts ?? 0, overrides.nextAttemptAt ?? new Date()],
    );
    return rows[0];
  });
}

async function getRow(id) {
  return withPlatformClient(async (client) => {
    const { rows } = await client.query(`SELECT * FROM emails_outbox WHERE id = $1`, [id]);
    return rows[0];
  });
}

async function flush(token) {
  const res = await fetch(`${BASE_URL}/api/mailer/flush`, {
    method: "POST",
    headers: token !== undefined ? { "X-Webhook-Token": token } : {},
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

const results = [];
function record(step, ok, extra) {
  results.push({ step, ok });
  console.log(`[${ok ? "OK  " : "FAIL"}] ${step}${extra ? ` — ${extra}` : ""}`);
}

async function runNormalPhase(tenantId, cronToken) {
  console.log("== FASE NORMAL (servidor sin MAILER_FORCE_FAIL) ==\n");

  console.log("-- 1) enqueue: fila nueva nace pending con los defaults de columna --");
  const okEmail = process.env.SMOKE_TEST_EMAIL || "guzmanmurillom@gmail.com";
  const row1 = await insertRow(tenantId, okEmail);
  record(
    "fila nueva: status=pending, attempts=0, next_attempt_at<=now()",
    row1.status === "pending" && row1.attempts === 0 && new Date(row1.next_attempt_at) <= new Date(),
  );

  console.log("\n-- 2) flush sin token / con token incorrecto -> 401 --");
  const noToken = await flush(undefined);
  record("POST /api/mailer/flush sin token -> 401", noToken.status === 401);
  const badToken = await flush("token-incorrecto-xyz");
  record("POST /api/mailer/flush con token incorrecto -> 401", badToken.status === 401);

  console.log("\n-- 3) flush con token válido: envío real exitoso --");
  const flushRes = await flush(cronToken);
  record("POST /api/mailer/flush con token válido -> 200", flushRes.status === 200, JSON.stringify(flushRes.body));
  const row1After = await getRow(row1.id);
  record(
    "fila pasó a status=sent con sent_at",
    row1After.status === "sent" && row1After.sent_at !== null,
    `status=${row1After.status}`,
  );
}

async function runForceFailPhase(tenantId, cronToken) {
  console.log("== FASE DE FALLO FORZADO (servidor con MAILER_FORCE_FAIL=true) ==\n");

  console.log("-- 4) simulación de fallo: 1er intento fallido --");
  const row2 = await insertRow(tenantId, "falla-1@no-existe.invalid");
  const flush2 = await flush(cronToken);
  record("POST /api/mailer/flush (fallo) -> 200", flush2.status === 200, JSON.stringify(flush2.body));
  const row2After = await getRow(row2.id);
  const backoffMs = 60_000; // 1 min, primer valor de BACKOFF_MINUTES
  const deltaMs = new Date(row2After.next_attempt_at).getTime() - Date.now();
  record(
    "fila: attempts=1, status=pending, next_attempt_at~=+1min, last_error IS NOT NULL",
    row2After.attempts === 1 &&
      row2After.status === "pending" &&
      row2After.last_error !== null &&
      deltaMs > 0 &&
      deltaMs <= backoffMs + 5_000,
    `attempts=${row2After.attempts} next_attempt_at=${row2After.next_attempt_at} last_error=${row2After.last_error}`,
  );

  console.log("\n-- 5) simulación de agotamiento: attempts=5 -> 6º fallo pasa a failed --");
  const row3 = await insertRow(tenantId, "agotado@no-existe.invalid", { attempts: 5, nextAttemptAt: new Date() });
  const flush3 = await flush(cronToken);
  record("POST /api/mailer/flush (agotamiento) -> 200", flush3.status === 200, JSON.stringify(flush3.body));
  const row3After = await getRow(row3.id);
  record(
    "fila: attempts=6, status=failed",
    row3After.attempts === 6 && row3After.status === "failed",
    `attempts=${row3After.attempts} status=${row3After.status}`,
  );

  console.log("\n-- 6) concurrencia: dos flushes simultáneos no procesan la misma fila --");
  const concurrencyRows = await Promise.all(
    Array.from({ length: 6 }, (_, i) => insertRow(tenantId, `concurrencia-${i}@no-existe.invalid`)),
  );
  const [flushA, flushB] = await Promise.all([flush(cronToken), flush(cronToken)]);
  const claimedTotal = (flushA.body?.claimed ?? 0) + (flushB.body?.claimed ?? 0);
  const processedTotal =
    (flushA.body?.sent ?? 0) + (flushA.body?.failed ?? 0) + (flushA.body?.requeued ?? 0) +
    (flushB.body?.sent ?? 0) + (flushB.body?.failed ?? 0) + (flushB.body?.requeued ?? 0);
  record(
    "claimed combinado <= filas insertadas, y sent+failed+requeued == claimed",
    claimedTotal <= concurrencyRows.length && processedTotal === claimedTotal,
    `claimedA=${flushA.body?.claimed} claimedB=${flushB.body?.claimed} processedTotal=${processedTotal}`,
  );
}

async function main() {
  const tenantId = need("SMOKE_TENANT_ID");
  const cronToken = need("CRON_WEBHOOK_TOKEN");

  if (FORCE_FAIL_PHASE) {
    await runForceFailPhase(tenantId, cronToken);
  } else {
    await runNormalPhase(tenantId, cronToken);
    console.log(
      "\n(Fase de fallo forzado NO ejecutada — reinicia el servidor con MAILER_FORCE_FAIL=true y vuelve a " +
        "correr este script con esa misma variable para cubrir retry/agotamiento/concurrencia.)",
    );
  }

  console.log("\n== Resumen ==");
  for (const r of results) console.log(`${r.ok ? "OK  " : "FAIL"}  ${r.step}`);

  const failed = results.filter((r) => !r.ok);
  await pool.end();
  if (failed.length > 0) {
    console.error(`\n${failed.length} paso(s) fallaron.`);
    process.exit(1);
  }
  console.log(`\nOutbox de correo OK (${results.length} verificaciones, fase ${FORCE_FAIL_PHASE ? "fallo forzado" : "normal"}).`);
}

main().catch(async (err) => {
  console.error("Error ejecutando el smoke test:", err);
  await pool.end();
  process.exit(1);
});
