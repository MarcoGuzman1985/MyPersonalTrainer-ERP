-- Los planes de venta SaaS pasan de ENUM cerrado a catálogo dinámico
-- (alta/baja de planes estacionales vía API). member_subscriptions.plan
-- NO se toca: sigue usando el enum saas_plan para el nivel de membresía
-- del socio, un concepto distinto sin necesidad de ser dinámico.
ALTER TABLE tenants DROP CONSTRAINT tenants_plan_fkey;
ALTER TABLE tenants ALTER COLUMN plan TYPE text USING plan::text;
ALTER TABLE plan_definitions ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_fkey FOREIGN KEY (plan) REFERENCES plan_definitions(id);

ALTER TABLE plan_definitions ADD CONSTRAINT plan_definitions_id_format
  CHECK (id ~ '^[a-z0-9][a-z0-9-]{1,49}$');
