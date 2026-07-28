-- Bloque 01: Admin SaaS. Catálogo de planes e inquilinos (gimnasios/boxes).

CREATE TABLE plan_definitions (
  id             saas_plan PRIMARY KEY,
  name           text NOT NULL,
  monthly_price  numeric(10,2) NOT NULL,
  max_members    integer NOT NULL,
  max_seats      integer NOT NULL,
  features       jsonb NOT NULL DEFAULT '[]',
  highlighted    boolean NOT NULL DEFAULT false
);

CREATE TABLE tenants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  owner          text NOT NULL,
  plan           saas_plan NOT NULL REFERENCES plan_definitions(id),
  status         tenant_status NOT NULL DEFAULT 'trial',
  -- Precio mensual vigente del tenant; normalmente = plan_definitions.monthly_price,
  -- pero se guarda aquí para permitir tarifas negociadas sin tocar el catálogo.
  monthly_price  numeric(10,2) NOT NULL,
  seats          integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  renews_at      timestamptz
);

CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_tenants_status ON tenants(status);

-- Nota: MRR total, tenants activos, trials y churn (SaaSMetrics) se calculan
-- con agregados sobre esta tabla; no se persisten como columnas.
