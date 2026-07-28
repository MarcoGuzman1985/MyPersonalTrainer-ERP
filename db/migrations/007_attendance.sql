-- Asistencia/check-ins del socio (depende de members + gym_classes + staff_users).

CREATE TABLE attendance_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  gym_class_id  uuid REFERENCES gym_classes(id),
  check_in_at   timestamptz NOT NULL DEFAULT now(),
  class_type    text NOT NULL,
  coach_id      uuid REFERENCES staff_users(id)
);

CREATE INDEX idx_attendance_member ON attendance_records(member_id, check_in_at DESC);
