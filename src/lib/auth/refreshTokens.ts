import { randomBytes, createHash } from "crypto";
import { pool } from "@/lib/db";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueRefreshToken(
  staffUserId: string,
  meta: { userAgent?: string; ip?: string },
) {
  const raw = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await pool.query(
    `INSERT INTO refresh_tokens (staff_user_id, token_hash, user_agent, ip, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [staffUserId, hashToken(raw), meta.userAgent ?? null, meta.ip ?? null, expiresAt],
  );

  return raw;
}

/**
 * Verifica el refresh token, lo revoca y emite uno nuevo (rotación).
 * Devuelve null si el token es inválido, expiró o ya fue usado/revocado.
 */
export async function rotateRefreshToken(
  rawToken: string,
  meta: { userAgent?: string; ip?: string },
): Promise<{ staffUserId: string; newRawToken: string } | null> {
  const tokenHash = hashToken(rawToken);

  const { rows } = await pool.query(
    `SELECT id, staff_user_id, expires_at, revoked_at
     FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) {
    return null;
  }

  const newRawToken = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  const { rows: inserted } = await pool.query(
    `INSERT INTO refresh_tokens (staff_user_id, token_hash, user_agent, ip, expires_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [row.staff_user_id, hashToken(newRawToken), meta.userAgent ?? null, meta.ip ?? null, expiresAt],
  );

  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now(), replaced_by = $1 WHERE id = $2`,
    [inserted[0].id, row.id],
  );

  return { staffUserId: row.staff_user_id, newRawToken };
}

export async function revokeRefreshToken(rawToken: string) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashToken(rawToken)],
  );
}
