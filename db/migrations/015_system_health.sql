-- Bloque 13: Salud del Sistema (errores + alertas + métricas).

CREATE TABLE system_errors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null = incidente de plataforma
  level       log_level NOT NULL,
  message     text NOT NULL,
  source      text NOT NULL,
  count       integer NOT NULL DEFAULT 1,
  first_seen  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now(),
  stack       text,
  resolved    boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_system_errors_tenant ON system_errors(tenant_id, last_seen DESC);

CREATE TABLE alert_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null = regla global
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  channel      alert_channel NOT NULL,
  enabled      boolean NOT NULL DEFAULT true,
  threshold    integer NOT NULL
);

CREATE TABLE health_stats (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null = métrica de plataforma
  label     text NOT NULL,
  value     numeric(5,2) NOT NULL,
  warn_at   numeric(5,2) NOT NULL,
  danger_at numeric(5,2) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_stats_tenant_label ON health_stats(tenant_id, label, recorded_at DESC);
