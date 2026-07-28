-- Comprobantes de renovación de suscripción (tenant paga y sube foto del pago
-- para que el equipo de plataforma lo apruebe/rechace).

CREATE TYPE renewal_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE subscription_renewals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount       numeric(10,2) NOT NULL,
  receipt_url  text NOT NULL,
  status       renewal_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_renewals_tenant ON subscription_renewals(tenant_id, created_at DESC);
