-- Datos fiscales de facturación por socio (usados desde el POS).

CREATE TABLE member_billing_profiles (
  member_id      uuid PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  legal_name     text NOT NULL DEFAULT '',
  tax_id         text NOT NULL DEFAULT '',
  billing_email  citext,
  address        text NOT NULL DEFAULT '',
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_member_billing_profiles_updated_at
BEFORE UPDATE ON member_billing_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
