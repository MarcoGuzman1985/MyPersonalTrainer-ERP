CREATE TABLE coaches (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name            text NOT NULL,
  last_name             text NOT NULL,
  dob                   date,
  phone                 text,
  address               text,
  email                 text,
  anthropometric_data   jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coaches_tenant ON coaches(tenant_id);

-- gym_classes.coach_id pasaba a referenciar staff_users; ahora referencia
-- coaches. Migra las asignaciones reales existentes preservando la persona
-- (nombre/email) antes de reapuntar la FK, en vez de perder el dato.
CREATE TEMP TABLE coach_migration_map AS
SELECT su.id AS old_staff_id, gen_random_uuid() AS new_coach_id, su.tenant_id, su.name, su.email
FROM staff_users su
WHERE su.id IN (SELECT DISTINCT coach_id FROM gym_classes WHERE coach_id IS NOT NULL);

INSERT INTO coaches (id, tenant_id, first_name, last_name, email)
SELECT
  new_coach_id,
  tenant_id,
  split_part(name, ' ', 1),
  NULLIF(trim(substr(name, length(split_part(name, ' ', 1)) + 1)), ''),
  email
FROM coach_migration_map;

ALTER TABLE gym_classes DROP CONSTRAINT gym_classes_coach_id_fkey;

UPDATE gym_classes gc
SET coach_id = m.new_coach_id
FROM coach_migration_map m
WHERE gc.coach_id = m.old_staff_id;

ALTER TABLE gym_classes ADD CONSTRAINT gym_classes_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES coaches(id);
