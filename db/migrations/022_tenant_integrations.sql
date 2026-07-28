-- Credenciales de integraciones externas por tenant, gestionadas por el
-- operador de plataforma desde el TenantDrawer.
CREATE TABLE tenant_integrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider     text NOT NULL CHECK (provider IN ('google_calendar', 'meta', 'whatsapp', 'gemini')),
  credentials  jsonb NOT NULL DEFAULT '{}', -- cifrar a nivel de aplicación en producción
  is_active    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);
