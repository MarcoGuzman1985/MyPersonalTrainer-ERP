-- Bloque 03: Clientes y Membresías (perfil 360°).

CREATE TABLE members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       citext NOT NULL,
  phone       text NOT NULL,
  gender      gender NOT NULL,
  birth_date  date NOT NULL,
  avatar_url  text,
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TRIGGER trg_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_members_tenant ON members(tenant_id);
CREATE INDEX idx_members_tags ON members USING gin(tags);

-- Historial de suscripciones; la vigente es la de is_current = true (única por socio).
CREATE TABLE member_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan          saas_plan NOT NULL,
  status        membership_status NOT NULL,
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  price         numeric(10,2) NOT NULL,
  auto_renew    boolean NOT NULL DEFAULT true,
  frozen_until  date,
  is_current    boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_member_subscriptions_current
  ON member_subscriptions(member_id) WHERE is_current;
CREATE INDEX idx_member_subscriptions_member ON member_subscriptions(member_id);

CREATE TABLE anthropometric_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date            date NOT NULL,
  weight_kg       numeric(5,2) NOT NULL,
  body_fat_pct    numeric(4,2),
  muscle_mass_kg  numeric(5,2)
);

CREATE INDEX idx_anthropometric_member_date ON anthropometric_entries(member_id, date);
