-- Bloque 11: Mensajería masiva (WhatsApp vía Evolution API).

CREATE TABLE evolution_configs (
  tenant_id      uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  instance_name  text NOT NULL,
  base_url       text NOT NULL,
  api_key        text NOT NULL, -- cifrar a nivel de aplicación antes de insertar
  connected      boolean NOT NULL DEFAULT false,
  phone_number   text,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_evolution_configs_updated_at
BEFORE UPDATE ON evolution_configs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE message_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  body        text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_message_templates_updated_at
BEFORE UPDATE ON message_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_message_templates_tenant ON message_templates(tenant_id);

CREATE TABLE send_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id    uuid REFERENCES message_templates(id),
  recipient      text NOT NULL,
  phone          text NOT NULL,
  status         send_status NOT NULL DEFAULT 'queued',
  sent_at        timestamptz,
  error          text
);

CREATE INDEX idx_send_logs_tenant ON send_logs(tenant_id, sent_at DESC);
