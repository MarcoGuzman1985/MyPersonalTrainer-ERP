-- Cifra las credenciales sensibles de 3 tablas (Tanda 3): añade una columna
-- bytea cifrada con pgcrypto junto a la columna en texto plano existente y
-- hace el backfill. La columna plaintext NO se elimina aquí — eso ocurre en
-- 028_drop_plaintext_credentials.sql, aplicada manualmente por separado tras
-- validar el refactor de código en producción (ver ese archivo).
--
-- Las 3 tablas tienen RLS desde Tanda 2 (FORCE ROW LEVEL SECURITY): el
-- backfill toca filas de TODOS los tenants, así que corre bajo el bypass de
-- plataforma (app.is_platform), igual que platformTransaction() en runtime.
--
-- La clave de cifrado (app.pgcrypto_key) la inyecta el runner de
-- migraciones (db/migrate.js) vía set_config parametrizado ANTES de
-- ejecutar este archivo — nunca queda hardcodeada aquí ni en ningún .sql.

SELECT set_config('app.is_platform', 'true', true);

ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS credentials_enc bytea;
ALTER TABLE evolution_configs ADD COLUMN IF NOT EXISTS api_key_enc bytea;
ALTER TABLE payment_gateways ADD COLUMN IF NOT EXISTS secret_key_enc bytea;

UPDATE tenant_integrations
   SET credentials_enc = pgp_sym_encrypt(credentials::text, current_setting('app.pgcrypto_key'))
 WHERE credentials_enc IS NULL;

UPDATE evolution_configs
   SET api_key_enc = pgp_sym_encrypt(api_key, current_setting('app.pgcrypto_key'))
 WHERE api_key_enc IS NULL AND api_key IS NOT NULL;

UPDATE payment_gateways
   SET secret_key_enc = pgp_sym_encrypt(secret_key, current_setting('app.pgcrypto_key'))
 WHERE secret_key_enc IS NULL AND secret_key IS NOT NULL;
