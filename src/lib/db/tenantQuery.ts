import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "@/lib/db";

// Formato UUID estricto (v1-v5, cualquier variante). Defensa en profundidad:
// aunque auth.tenantId venga de un JWT firmado, nunca se interpola directo
// en SQL sin validar primero.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function assertValidTenantId(tenantId: string): void {
  if (!UUID_RE.test(tenantId)) {
    throw new Error(`tenantId con formato inválido: "${tenantId}"`);
  }
}

interface TenantAuth {
  tenantId: string;
}

// SET LOCAL no admite bind parameters ($1) — falla con "syntax error at or
// near $1" (verificado contra Postgres real). set_config() SÍ es una
// función normal y acepta parámetros con el mismo binding seguro que
// cualquier otra query, sin interpolar el valor en el texto del SQL.
async function setTenantContext(client: PoolClient, tenantId: string): Promise<void> {
  assertValidTenantId(tenantId);
  await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
}

async function setPlatformContext(client: PoolClient): Promise<void> {
  await client.query(`SELECT set_config('app.is_platform', 'true', true)`);
}

async function setAuthContext(client: PoolClient): Promise<void> {
  await client.query(`SELECT set_config('app.is_auth', 'true', true)`);
}

/**
 * Query de una sola sentencia ya aislada por RLS al tenant de `auth`.
 * Envuelve en una mini-transacción porque `set_config(..., true)` (is_local)
 * solo persiste durante la transacción en curso.
 */
export async function tenantQuery<T extends QueryResultRow = QueryResultRow>(
  auth: TenantAuth,
  text: string,
  params?: unknown[],
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await setTenantContext(client, auth.tenantId);
    const result = await client.query<T>(text, params);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Flujos multi-statement (checkout, reservas, etc.) bajo un mismo tenant. */
export async function tenantTransaction<T>(
  auth: TenantAuth,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await setTenantContext(client, auth.tenantId);
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

/**
 * Rutas de plataforma (requirePlatformAdmin) y el webhook de n8n: cruzan
 * tenants a propósito. Sirve tanto para una sola query como para varias.
 */
export async function platformTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await setPlatformContext(client);
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

/**
 * Login/refresh/update-password: aún no hay tenant resuelto (o, en
 * update-password, no hace falta volver a resolverlo). Simetría a
 * propósito con platformTransaction para que "is_auth" sea reconocible
 * en logs/auditoría como flujo de autenticación.
 */
export async function authTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await setAuthContext(client);
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
