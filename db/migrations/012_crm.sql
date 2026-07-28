-- Bloque 10: CRM y Leads (kanban).

CREATE TABLE leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  phone         text NOT NULL,
  email         citext,
  source        lead_source NOT NULL,
  value         numeric(10,2) NOT NULL DEFAULT 0,
  assigned_to   uuid REFERENCES staff_users(id),
  stage         lead_stage NOT NULL DEFAULT 'new',
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_leads_tenant_stage ON leads(tenant_id, stage);
