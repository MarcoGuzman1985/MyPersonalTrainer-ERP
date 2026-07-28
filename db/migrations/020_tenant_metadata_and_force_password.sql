-- Notas libres de IA/soporte por tenant, y bandera de cambio de contraseña forzado.
ALTER TABLE tenants ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE staff_users ADD COLUMN force_password_change boolean NOT NULL DEFAULT false;
