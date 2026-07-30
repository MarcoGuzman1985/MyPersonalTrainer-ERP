#!/usr/bin/env node
/**
 * Smoke test de regresión RLS para los endpoints [platform] (/api/saas/*,
 * webhook de expiring-trials). Golpea un servidor real ya corriendo
 * (npm run dev / npm start) y falla si CUALQUIER endpoint devuelve 500 —
 * la señal de que un pool.query/withTransaction quedó fuera de
 * platformTransaction/tenantQuery/tenantTransaction/authTransaction y por
 * tanto sin bypass de sesión para RLS (ver db/migrations/026_rls_tenant_isolation.sql).
 *
 * Origen: hotfix/rls-saas-platform-tx (regresión reportada en
 * PATCH /api/saas/tenants/[id] tras la Tanda 2 de RLS multitenant).
 *
 * Uso:
 *   SMOKE_TENANT_ID=<uuid del tenant del platform admin> \
 *   SMOKE_EMAIL=<email del platform admin> \
 *   SMOKE_PASSWORD=<password> \
 *   [SMOKE_BASE_URL=http://localhost:3000] \
 *   [SMOKE_TARGET_TENANT_ID=<uuid de un tenant de prueba para el PATCH idempotente>] \
 *   [CRON_WEBHOOK_TOKEN=<token del webhook, si se quiere incluir en la corrida>] \
 *   node scripts/smoke-rls.js
 *
 * Correr al final de cada tanda/PR que toque src/app/api/saas/**, el
 * webhook de expiring-trials, o src/lib/db/tenantQuery.ts, antes de darla
 * por cerrada.
 */

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";

function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Falta la variable de entorno ${name}. Ver el comentario de uso al inicio de este script.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const tenantId = need("SMOKE_TENANT_ID");
  const email = need("SMOKE_EMAIL");
  const password = need("SMOKE_PASSWORD");
  const targetTenantId = process.env.SMOKE_TARGET_TENANT_ID || tenantId;

  const results = [];
  let accessToken = "";

  async function check(name, method, path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const ok = res.status !== 500;
    results.push({ name, method, path, status: res.status, ok });
    console.log(`[${ok ? "OK  " : "FAIL"}] ${method} ${path} -> ${res.status}`);
    if (!ok) {
      const text = await res.text().catch(() => "");
      console.log(`        body: ${text.slice(0, 300)}`);
    }
  }

  console.log(`== Login como platform admin (${email}) ==`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId, email, password }),
  });
  if (!loginRes.ok) {
    console.error(`Login falló: ${loginRes.status} ${await loginRes.text()}`);
    process.exit(1);
  }
  ({ accessToken } = await loginRes.json());

  console.log("\n== Smoke test de endpoints [platform] ==");
  await check("saas metrics", "GET", "/api/saas/metrics");
  await check("saas plans list", "GET", "/api/saas/plans");
  await check("saas tenants list", "GET", "/api/saas/tenants");
  await check("saas tenant integrations", "GET", `/api/saas/tenants/${targetTenantId}/integrations`);

  // PATCH idempotente: relee el tenant y reescribe los mismos valores, para
  // ejercitar la ruta exacta que causó la regresión original sin mutar datos.
  const tenantsRes = await fetch(`${BASE_URL}/api/saas/tenants`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const tenants = await tenantsRes.json();
  const target = Array.isArray(tenants) ? tenants.find((t) => t.id === targetTenantId) : null;
  if (target) {
    await check("saas tenant PATCH (idempotente)", "PATCH", `/api/saas/tenants/${targetTenantId}`, {
      status: target.status,
      owner: target.owner,
      ownerEmail: target.ownerEmail,
      plan: target.plan,
      monthlyPrice: target.mrr,
      metadata: target.metadata ?? {},
    });
  } else {
    console.warn(`No se encontró el tenant ${targetTenantId} en /api/saas/tenants; se omite el PATCH.`);
  }

  if (process.env.CRON_WEBHOOK_TOKEN) {
    const res = await fetch(`${BASE_URL}/api/webhooks/expiring-trials`, {
      headers: { "x-webhook-token": process.env.CRON_WEBHOOK_TOKEN },
    });
    const ok = res.status !== 500;
    results.push({ name: "webhook expiring-trials", method: "GET", path: "/api/webhooks/expiring-trials", status: res.status, ok });
    console.log(`[${ok ? "OK  " : "FAIL"}] GET /api/webhooks/expiring-trials -> ${res.status}`);
  } else {
    console.log("(CRON_WEBHOOK_TOKEN no definido, se omite el smoke test del webhook)");
  }

  console.log("\n== Resumen ==");
  for (const r of results) {
    console.log(`${r.ok ? "OK  " : "FAIL"}  ${r.method.padEnd(6)} ${r.path} -> ${r.status}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length} endpoint(s) devolvieron 500. Revisa el log del servidor.`);
    process.exit(1);
  }
  console.log(`\nTodos los endpoints [platform] respondieron sin 500 (${results.length} verificados).`);
}

main().catch((err) => {
  console.error("Error ejecutando el smoke test:", err);
  process.exit(1);
});
