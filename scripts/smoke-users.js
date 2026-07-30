#!/usr/bin/env node
/**
 * Smoke test del ciclo de vida completo de un usuario en Usuarios y Permisos.
 * Golpea un servidor real ya corriendo (npm run dev / npm start) y falla si
 * cualquier paso devuelve un status HTTP distinto del esperado.
 *
 * Origen: investigación de un fallo reportado al hacer "Eliminar" sobre un
 * usuario en /usuarios (ver docs/known-issues.md — resultó ser JWT/sesión
 * obsoleta, no un bug de RLS/backend). Este script deja un ciclo repetible
 * para no depender de reproducir el flujo a mano en el navegador.
 *
 * Uso:
 *   SMOKE_TENANT_ID=<uuid del tenant> \
 *   SMOKE_EMAIL=<email del admin> \
 *   SMOKE_PASSWORD=<password> \
 *   [SMOKE_BASE_URL=http://localhost:3000] \
 *   [SMOKE_ROLE_ID=<uuid de un rol a asignar al invitado>] \
 *   node scripts/smoke-users.js
 *
 * Correr al final de cada tanda/PR que toque src/app/api/users/**,
 * src/app/api/roles/**, o el flujo de invitación/alta de personal, antes
 * de darla por cerrada (Tanda 3 incluida).
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

async function login(tenantId, email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId, email, password }),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function main() {
  const tenantId = need("SMOKE_TENANT_ID");
  const adminEmail = need("SMOKE_EMAIL");
  const adminPassword = need("SMOKE_PASSWORD");

  const results = [];
  function record(step, status, expected, extra) {
    const ok = status === expected;
    results.push({ step, status, expected, ok });
    console.log(`[${ok ? "OK  " : "FAIL"}] ${step} -> ${status} (esperado ${expected})${extra ? ` ${extra}` : ""}`);
    return ok;
  }
  function fail(step, status, expected, body) {
    record(step, status, expected);
    console.error(`        body: ${JSON.stringify(body).slice(0, 300)}`);
    printSummaryAndExit();
  }
  function printSummaryAndExit() {
    console.log("\n== Resumen ==");
    for (const r of results) {
      console.log(`${r.ok ? "OK  " : "FAIL"}  ${r.step} -> ${r.status} (esperado ${r.expected})`);
    }
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      console.error(`\n${failed.length} paso(s) fallaron.`);
      process.exit(1);
    }
    console.log(`\nCiclo de vida completo de usuario OK (${results.length} pasos verificados).`);
    process.exit(0);
  }

  console.log(`== 1) Login como admin (${adminEmail}) ==`);
  const adminLogin = await login(tenantId, adminEmail, adminPassword);
  if (adminLogin.status !== 200) fail("login admin", adminLogin.status, 200, adminLogin.body);
  record("login admin", adminLogin.status, 200);
  const adminToken = adminLogin.body.accessToken;

  let roleId = process.env.SMOKE_ROLE_ID;
  if (!roleId) {
    const rolesRes = await fetch(`${BASE_URL}/api/roles`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const roles = await rolesRes.json();
    if (!rolesRes.ok || !Array.isArray(roles) || roles.length === 0) {
      fail("GET /api/roles (auto-selección de rol)", rolesRes.status, 200, roles);
    }
    roleId = roles[0].id;
    console.log(`(usando rol "${roles[0].name}" = ${roleId} para el invitado)`);
  }

  const inviteEmail = `smoke-user-${Date.now()}@ironbox-smoke.test`;

  console.log("\n== 2) Crear usuario invitado ==");
  const inviteRes = await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Smoke Test User", email: inviteEmail, roleId }),
  });
  const invite = await inviteRes.json();
  if (inviteRes.status !== 201) fail("POST /api/users (invitar)", inviteRes.status, 201, invite);
  record("POST /api/users (invitar)", inviteRes.status, 201);
  const userId = invite.id;
  const tempPassword = invite.tempPassword;

  console.log("\n== 3) Login del invitado (debe pedir cambio de password) ==");
  const inviteLogin = await login(tenantId, inviteEmail, tempPassword);
  if (inviteLogin.status !== 200) fail("login invitado", inviteLogin.status, 200, inviteLogin.body);
  record("login invitado", inviteLogin.status, 200, `mustChangePassword=${inviteLogin.body.user?.mustChangePassword}`);
  const inviteToken = inviteLogin.body.accessToken;

  console.log("\n== 4) Cambio de password forzado ==");
  const updPwRes = await fetch(`${BASE_URL}/api/auth/update-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${inviteToken}` },
    body: JSON.stringify({ newPassword: "SmokeTest12345" }),
  });
  const updPw = await updPwRes.json();
  if (updPwRes.status !== 200) fail("POST /api/auth/update-password", updPwRes.status, 200, updPw);
  record("POST /api/auth/update-password", updPwRes.status, 200);

  console.log("\n== 5) Suspender usuario (admin) ==");
  const suspendRes = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: "disabled" }),
  });
  const suspend = await suspendRes.json();
  if (suspendRes.status !== 200) fail("PUT /api/users/:id (suspender)", suspendRes.status, 200, suspend);
  record("PUT /api/users/:id (suspender)", suspendRes.status, 200, `status=${suspend.status}`);

  console.log("\n== 6) Reactivar usuario (admin) ==");
  const reactivateRes = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: "active" }),
  });
  const reactivate = await reactivateRes.json();
  if (reactivateRes.status !== 200) fail("PUT /api/users/:id (reactivar)", reactivateRes.status, 200, reactivate);
  record("PUT /api/users/:id (reactivar)", reactivateRes.status, 200, `status=${reactivate.status}`);

  console.log("\n== 7) Eliminar usuario (admin) ==");
  const deleteRes = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const del = await deleteRes.json();
  if (deleteRes.status !== 200) fail("DELETE /api/users/:id (eliminar)", deleteRes.status, 200, del);
  record("DELETE /api/users/:id (eliminar)", deleteRes.status, 200);

  printSummaryAndExit();
}

main().catch((err) => {
  console.error("Error ejecutando el smoke test:", err);
  process.exit(1);
});
