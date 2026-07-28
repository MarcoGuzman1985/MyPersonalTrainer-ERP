CREATE TABLE rooms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  capacity   integer NOT NULL,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_tenant ON rooms(tenant_id);

-- gym_classes.room (text) se mantiene como snapshot legible; room_id habilita
-- el join relacional para capacidad real de la sala y filtros.
ALTER TABLE gym_classes ADD COLUMN room_id uuid REFERENCES rooms(id);
