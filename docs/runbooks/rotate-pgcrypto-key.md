# Runbook: rotar `PGCRYPTO_KEY`

`PGCRYPTO_KEY` cifra `tenant_integrations.credentials_enc`,
`evolution_configs.api_key_enc` y `payment_gateways.secret_key_enc` (pgcrypto
simétrico, `pgp_sym_encrypt`/`pgp_sym_decrypt` — ver
`db/migrations/027_encrypt_credentials.sql` y `src/lib/crypto/pgcrypto.ts`).
Es un secreto rotativo: debe poder cambiarse sin perder los datos ya
cifrados con la clave anterior.

## Proceso

1. **Generar la nueva clave**
   ```bash
   openssl rand -base64 48
   ```
   Guárdala aparte (gestor de secretos), no la pegues en ningún commit ni PR.

2. **Re-encriptar todas las filas con la clave nueva**, en una migración
   temporal (no forma parte de la numeración permanente de `db/migrations/`,
   se escribe ad hoc para la rotación y se descarta después de aplicarla):
   ```sql
   SELECT set_config('app.is_platform', 'true', true);
   SELECT set_config('app.old_pgcrypto_key', '<OLD_KEY>', true);
   SELECT set_config('app.new_pgcrypto_key', '<NEW_KEY>', true);

   UPDATE tenant_integrations
      SET credentials_enc = pgp_sym_encrypt(
            pgp_sym_decrypt(credentials_enc, current_setting('app.old_pgcrypto_key')),
            current_setting('app.new_pgcrypto_key')
          )
    WHERE credentials_enc IS NOT NULL;

   UPDATE evolution_configs
      SET api_key_enc = pgp_sym_encrypt(
            pgp_sym_decrypt(api_key_enc, current_setting('app.old_pgcrypto_key')),
            current_setting('app.new_pgcrypto_key')
          )
    WHERE api_key_enc IS NOT NULL;

   UPDATE payment_gateways
      SET secret_key_enc = pgp_sym_encrypt(
            pgp_sym_decrypt(secret_key_enc, current_setting('app.old_pgcrypto_key')),
            current_setting('app.new_pgcrypto_key')
          )
    WHERE secret_key_enc IS NOT NULL;
   ```
   Igual que en el backfill original, `OLD_KEY`/`NEW_KEY` deben inyectarse
   como bind parameters (`set_config(..., $1, true)`) desde el script que
   ejecuta esto, nunca hardcodeados en el `.sql`.

3. **Actualizar `PGCRYPTO_KEY`** con el valor nuevo en `.env.local` y en los
   GitHub Secrets del repo (mismo nombre de variable).

4. **Deploy** de la app con el `PGCRYPTO_KEY` nuevo.

5. **Ventana de riesgo — coordinación de la rotación:** entre el paso 2
   (re-encriptado en BD) y el paso 4 (deploy con la clave nueva), cualquier
   instancia de la app todavía corriendo con la clave vieja fallará al
   descifrar (`pgp_sym_decrypt` con la clave equivocada da error, no NULL).
   Hoy esto **no está implementado** — la app solo soporta una clave activa
   a la vez (`PGCRYPTO_KEY` en `src/lib/crypto/pgcrypto.ts`). Minimizar la
   ventana significa: aplicar el paso 2 y desplegar el paso 4 lo más juntos
   posible, e idealmente en una ventana de mantenimiento.

   Implementación futura para eliminar esta ventana de riesgo: soportar
   `PGCRYPTO_KEY` + `PGCRYPTO_KEY_PREVIOUS`, e intentar descifrar primero con
   la actual y, si falla, con la anterior — permitiendo que instancias viejas
   y nuevas convivan brevemente durante un deploy rolling.
