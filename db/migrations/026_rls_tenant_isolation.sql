-- Aísla por Row Level Security cada tabla tenant-scoped. 3 bypasses de sesión:
--   app.tenant_id   -> sesión de un tenant normal (tenantQuery/tenantTransaction)
--   app.is_platform -> operador de plataforma, cruza tenants a propósito (platformTransaction)
--   app.is_auth     -> login/refresh/update-password, aún no hay tenant resuelto (authTransaction)
--
-- IMPORTANTE: la conexión de la app (marcoguzman) es OWNER de todas las tablas, y
-- Postgres exime a los owners de RLS por defecto salvo FORCE ROW LEVEL SECURITY.
-- Sin esto, todo este archivo sería un no-op silencioso para nuestra propia app.
--
-- NO llevan RLS (no tienen tenant_id / no son datos de un tenant):
--   plan_definitions, permission_modules, permission_actions
--   refresh_tokens (sin tenant_id; protegida por hash SHA-256 del token, no por fila)

-- ============================================================
-- 1) tenants (self-referencial vía id, no tiene columna tenant_id)
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenants FOR ALL USING (
  id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  OR current_setting('app.is_platform', true) = 'true'
  OR current_setting('app.is_auth', true) = 'true'
) WITH CHECK (
  id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  OR current_setting('app.is_platform', true) = 'true'
  OR current_setting('app.is_auth', true) = 'true'
);

-- ============================================================
-- 2) Tablas con tenant_id directo (NOT NULL o NULL=platform-only,
--    ambos casos correctos con la misma policy: NULL nunca iguala
--    a un uuid de sesión, así que solo el bypass de plataforma las ve)
-- ============================================================
DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'roles', 'staff_users', 'members', 'gym_classes', 'suppliers', 'products',
    'stock_movements', 'sales', 'routines', 'nutrition_plans', 'access_events',
    'leads', 'message_templates', 'send_logs', 'audit_logs', 'subscription_renewals',
    'tenant_integrations', 'rooms', 'coaches', 'evolution_configs', 'tenant_settings',
    'payment_gateways', 'system_errors', 'alert_rules', 'health_stats'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I FOR ALL USING (
         tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid
         OR current_setting(''app.is_platform'', true) = ''true''
         OR current_setting(''app.is_auth'', true) = ''true''
       ) WITH CHECK (
         tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid
         OR current_setting(''app.is_platform'', true) = ''true''
         OR current_setting(''app.is_auth'', true) = ''true''
       )', t
    );
  END LOOP;
END $$;

-- ============================================================
-- 3) exercises: caso especial. tenant_id NULL = catálogo maestro
--    GLOBAL (visible para todos los tenants, no solo plataforma).
-- ============================================================
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON exercises FOR ALL USING (
  tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  OR tenant_id IS NULL
  OR current_setting('app.is_platform', true) = 'true'
  OR current_setting('app.is_auth', true) = 'true'
) WITH CHECK (
  tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  OR tenant_id IS NULL
  OR current_setting('app.is_platform', true) = 'true'
  OR current_setting('app.is_auth', true) = 'true'
);

-- ============================================================
-- 4) Tablas hijas sin tenant_id propio: se aíslan vía EXISTS contra
--    el padre, que YA tiene su propia policy de RLS aplicada (Postgres
--    evalúa la subquery bajo el mismo rol/sesión, así que la
--    visibilidad del padre se hereda automáticamente sin repetir
--    los 3 bypasses en cada tabla hija).
-- ============================================================

ALTER TABLE member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_subscriptions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON member_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM members m WHERE m.id = member_subscriptions.member_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM members m WHERE m.id = member_subscriptions.member_id)
);

ALTER TABLE anthropometric_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE anthropometric_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON anthropometric_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM members m WHERE m.id = anthropometric_entries.member_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM members m WHERE m.id = anthropometric_entries.member_id)
);

ALTER TABLE member_billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_billing_profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON member_billing_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM members m WHERE m.id = member_billing_profiles.member_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM members m WHERE m.id = member_billing_profiles.member_id)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON attendance_records FOR ALL USING (
  EXISTS (SELECT 1 FROM members m WHERE m.id = attendance_records.member_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM members m WHERE m.id = attendance_records.member_id)
);

ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON class_bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM gym_classes gc WHERE gc.id = class_bookings.gym_class_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM gym_classes gc WHERE gc.id = class_bookings.gym_class_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON role_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM roles r WHERE r.id = role_permissions.role_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM roles r WHERE r.id = role_permissions.role_id)
);

ALTER TABLE sale_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_lines FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sale_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_lines.sale_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_lines.sale_id)
);

ALTER TABLE routine_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_blocks FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON routine_blocks FOR ALL USING (
  EXISTS (SELECT 1 FROM routines ro WHERE ro.id = routine_blocks.routine_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM routines ro WHERE ro.id = routine_blocks.routine_id)
);

-- routine_exercises encadena a través de routine_blocks (2 niveles): la
-- visibilidad de routine_blocks ya depende de routines, así que aquí basta
-- con comprobar routine_blocks.
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON routine_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM routine_blocks rb WHERE rb.id = routine_exercises.routine_block_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM routine_blocks rb WHERE rb.id = routine_exercises.routine_block_id)
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON meals FOR ALL USING (
  EXISTS (SELECT 1 FROM nutrition_plans np WHERE np.id = meals.nutrition_plan_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM nutrition_plans np WHERE np.id = meals.nutrition_plan_id)
);

-- meal_items encadena a través de meals (2 niveles), mismo razonamiento que routine_exercises.
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON meal_items FOR ALL USING (
  EXISTS (SELECT 1 FROM meals me WHERE me.id = meal_items.meal_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM meals me WHERE me.id = meal_items.meal_id)
);
