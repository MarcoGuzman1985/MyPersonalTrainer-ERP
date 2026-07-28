-- Tipos ENUM compartidos, uno por dominio del ERP.
CREATE TYPE saas_plan AS ENUM ('lite', 'pro', 'enterprise');
CREATE TYPE tenant_status AS ENUM ('active', 'trial', 'past_due', 'suspended');
CREATE TYPE staff_status AS ENUM ('active', 'invited', 'disabled');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE membership_status AS ENUM ('active', 'expired', 'frozen');
CREATE TYPE class_type AS ENUM ('crossfit', 'spinning', 'yoga', 'funcional', 'boxeo', 'hiit');
CREATE TYPE product_kind AS ENUM ('product', 'membership', 'service');
CREATE TYPE stock_movement_type AS ENUM ('in', 'out');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'wallet');
CREATE TYPE muscle_group AS ENUM ('pecho', 'espalda', 'piernas', 'hombros', 'brazos', 'core', 'fullbody', 'cardio');
CREATE TYPE meal_block AS ENUM ('Desayuno', 'Media mañana', 'Almuerzo', 'Merienda', 'Cena');
CREATE TYPE access_status AS ENUM ('approved', 'denied');
CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'scheduled', 'won', 'lost');
CREATE TYPE lead_source AS ENUM ('Instagram', 'Web', 'Referido', 'Walk-in');
CREATE TYPE send_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export');
CREATE TYPE log_level AS ENUM ('error', 'warning', 'info');
CREATE TYPE alert_channel AS ENUM ('push', 'email', 'webhook');
CREATE TYPE gateway_provider AS ENUM ('stripe', 'mercadopago', 'paypal');

-- Trigger reutilizable para mantener updated_at en cada UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
