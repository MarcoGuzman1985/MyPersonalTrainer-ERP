-- Distingue al staff de un tenant (acceso solo a su gimnasio) de un operador
-- de plataforma (acceso a /api/saas/*, ve y crea tenants).
ALTER TABLE staff_users ADD COLUMN is_platform_admin boolean NOT NULL DEFAULT false;
