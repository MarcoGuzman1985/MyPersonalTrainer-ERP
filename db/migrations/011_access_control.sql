-- Bloque 08: Control de Accesos (live feed + QR).

CREATE TABLE access_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id    uuid REFERENCES members(id), -- null = no identificado / QR inválido
  member_name  text NOT NULL, -- snapshot, incluso si no matchea member_id
  photo_url    text,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  status       access_status NOT NULL,
  reason       text,
  gate         text NOT NULL
);

CREATE INDEX idx_access_events_tenant_time ON access_events(tenant_id, occurred_at DESC);

-- currentOccupancy/approvedToday/deniedToday se calculan por query;
-- maxOccupancy vive en tenant_settings (config del tenant).
