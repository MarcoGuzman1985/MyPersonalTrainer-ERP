-- Bloque 12: Logs de Auditoría (append-only).

CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  staff_user_id uuid REFERENCES staff_users(id),
  user_name   text NOT NULL,  -- snapshot
  user_role   text NOT NULL,  -- snapshot
  action      audit_action NOT NULL,
  module      text NOT NULL,
  ip          text NOT NULL,
  user_agent  text,
  before      jsonb,
  after       jsonb
);

CREATE INDEX idx_audit_logs_tenant_time ON audit_logs(tenant_id, occurred_at DESC);

-- Append-only a nivel de aplicación: el rol de la API no debe tener
-- privilegios UPDATE/DELETE sobre esta tabla (ver README de /db).
