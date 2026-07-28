-- Bloque 07: Nutrición (macros + planes por socio).

CREATE TABLE nutrition_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  goal         text NOT NULL,
  kcal         integer NOT NULL,
  protein_g    integer NOT NULL,
  carbs_g      integer NOT NULL,
  fat_g        integer NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_nutrition_plans_updated_at
BEFORE UPDATE ON nutrition_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_nutrition_plans_member ON nutrition_plans(member_id);

CREATE TABLE meals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id   uuid NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  block               meal_block NOT NULL,
  position            integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_meals_plan ON meals(nutrition_plan_id, position);

CREATE TABLE meal_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name       text NOT NULL,
  qty_g      numeric(6,1) NOT NULL,
  kcal       integer NOT NULL,
  protein_g  numeric(5,1) NOT NULL,
  carbs_g    numeric(5,1) NOT NULL,
  fat_g      numeric(5,1) NOT NULL
);

CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);
