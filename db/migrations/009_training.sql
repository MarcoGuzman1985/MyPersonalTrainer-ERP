-- Bloque 05: Entrenamiento (diseñador de rutinas).

CREATE TABLE exercises (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null = catálogo maestro global
  name          text NOT NULL,
  muscle_group  muscle_group NOT NULL,
  equipment     text NOT NULL,
  video_url     text NOT NULL
);

CREATE INDEX idx_exercises_tenant ON exercises(tenant_id);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);

CREATE TABLE routines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id   uuid REFERENCES members(id), -- null = plantilla reutilizable
  title       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_routines_updated_at
BEFORE UPDATE ON routines
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_routines_tenant_member ON routines(tenant_id, member_id);

CREATE TABLE routine_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id  uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  title       text NOT NULL,
  position    integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_routine_blocks_routine ON routine_blocks(routine_id, position);

CREATE TABLE routine_exercises (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_block_id  uuid NOT NULL REFERENCES routine_blocks(id) ON DELETE CASCADE,
  exercise_id       uuid NOT NULL REFERENCES exercises(id),
  name              text NOT NULL, -- snapshot
  sets              integer NOT NULL,
  reps              integer NOT NULL,
  rpe               numeric(3,1),
  rest_sec          integer NOT NULL DEFAULT 0,
  video_url         text,
  position           integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_routine_exercises_block ON routine_exercises(routine_block_id, position);
