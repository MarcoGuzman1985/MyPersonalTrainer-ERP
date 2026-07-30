/**
 * Clave simétrica de pgcrypto (pgp_sym_encrypt/pgp_sym_decrypt) usada para
 * cifrar credenciales sensibles en Postgres (tenant_integrations.credentials,
 * evolution_configs.api_key, payment_gateways.secret_key — ver
 * db/migrations/027_encrypt_credentials.sql).
 *
 * Se pasa siempre como bind parameter en runtime (nunca vía set_config por
 * transacción como en la migración de backfill) y nunca se expone en
 * respuestas HTTP ni se le hace log.
 */
export const PGCRYPTO_KEY = process.env.PGCRYPTO_KEY!;

if (!PGCRYPTO_KEY) {
  throw new Error("PGCRYPTO_KEY no está definida (ver .env.example).");
}
