-- Bloque 14: Configuración del Tenant (marca blanca).

CREATE TABLE tenant_settings (
  tenant_id         uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url          text,
  primary_color     text NOT NULL DEFAULT '#1e3a8a',
  secondary_color   text NOT NULL DEFAULT '#0f766e',
  portal_subdomain  text UNIQUE,
  tax_name          text NOT NULL DEFAULT 'IVA',
  tax_rate          numeric(5,2) NOT NULL DEFAULT 0,
  tax_id            text NOT NULL DEFAULT '',
  currency          text NOT NULL DEFAULT 'USD',
  locale            text NOT NULL DEFAULT 'es-ES',
  max_occupancy     integer NOT NULL DEFAULT 100,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tenant_settings_updated_at
BEFORE UPDATE ON tenant_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payment_gateways (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider      gateway_provider NOT NULL,
  enabled       boolean NOT NULL DEFAULT false,
  public_key    text,
  secret_key    text, -- cifrar a nivel de aplicación antes de insertar
  UNIQUE (tenant_id, provider)
);
