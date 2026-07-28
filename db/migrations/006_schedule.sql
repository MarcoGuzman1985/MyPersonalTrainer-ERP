-- Bloque 06: Agenda y Clases.

CREATE TABLE gym_classes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title      text NOT NULL,
  coach_id   uuid REFERENCES staff_users(id),
  room       text NOT NULL,
  start_at   timestamptz NOT NULL,
  end_at     timestamptz NOT NULL,
  capacity   integer NOT NULL,
  type       class_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_gym_classes_updated_at
BEFORE UPDATE ON gym_classes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_gym_classes_tenant_start ON gym_classes(tenant_id, start_at);

-- booked/waitlist de GymClass se calculan contando filas aquí.
CREATE TABLE class_bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_class_id  uuid NOT NULL REFERENCES gym_classes(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  waitlisted    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_class_id, member_id)
);

CREATE INDEX idx_class_bookings_class ON class_bookings(gym_class_id);
CREATE INDEX idx_class_bookings_member ON class_bookings(member_id);
