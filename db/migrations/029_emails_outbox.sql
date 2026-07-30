-- Bloque Tanda 4: outbox de correo con retry exponencial. Reemplaza el
-- envío fire-and-forget del recibo POS por un INSERT durable que un cron
-- externo (Tanda 5) drena vía POST /api/mailer/flush.

CREATE TABLE emails_outbox (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  to_email        text NOT NULL,
  subject         text NOT NULL,
  html            text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,
  locked_by       uuid,
  locked_at       timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice para el claim del flush: filas pendientes, listas para reintentar,
-- ordenadas por antigüedad de turno.
CREATE INDEX idx_emails_outbox_claim ON emails_outbox (next_attempt_at)
  WHERE status = 'pending';

-- Misma policy de 3 bypass que el resto de tablas tenant-scoped desde
-- Tanda 2 (app.tenant_id / app.is_platform / app.is_auth). enqueueMail()
-- inserta vía tenantTransaction (bypass app.tenant_id); el flush cruza
-- tenants vía platformTransaction (bypass app.is_platform).
ALTER TABLE emails_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON emails_outbox FOR ALL USING (
  tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  OR current_setting('app.is_platform', true) = 'true'
  OR current_setting('app.is_auth', true) = 'true'
) WITH CHECK (
  tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  OR current_setting('app.is_platform', true) = 'true'
  OR current_setting('app.is_auth', true) = 'true'
);
