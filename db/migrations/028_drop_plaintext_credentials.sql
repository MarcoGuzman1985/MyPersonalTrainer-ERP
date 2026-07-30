-- APLICAR MANUALMENTE: NO ejecutar junto con el deploy del refactor de
-- código (027 + handlers). Aplicar solo después de validar en producción
-- durante al menos 24h que las lecturas/escrituras vía pgp_sym_decrypt/
-- pgp_sym_encrypt (credentials_enc / api_key_enc / secret_key_enc)
-- funcionan correctamente para TODOS los tenants activos.
--
-- db/migrate.js se salta cualquier migración que contenga el marcador
-- "-- APLICAR MANUALMENTE" a menos que se invoque explícitamente con:
--   CONFIRM_DESTRUCTIVE_MIGRATION=028_drop_plaintext_credentials.sql npm run db:migrate
--
-- Rollback si algo sale mal ANTES de correr esto: ninguno necesario, las
-- columnas plaintext siguen intactas. Rollback DESPUÉS de correr esto:
-- restaurar desde backup, o si todavía se tiene PGCRYPTO_KEY vigente,
-- restaurar la plaintext con
--   UPDATE tenant_integrations SET credentials = pgp_sym_decrypt(credentials_enc, '<key>')::jsonb;
-- (y análogo para evolution_configs.api_key / payment_gateways.secret_key)
-- antes de volver a desplegar el código anterior al refactor.

ALTER TABLE tenant_integrations DROP COLUMN credentials;
ALTER TABLE evolution_configs DROP COLUMN api_key;
ALTER TABLE payment_gateways DROP COLUMN secret_key;
