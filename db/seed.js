#!/usr/bin/env node
/**
 * Seed inicial: catálogo de planes, catálogo de permisos, tenant demo
 * ("Iron Box CrossFit", igual al mock de src/lib/api/saas.ts), rol
 * Superadministrador con todos los permisos, y el staff_user superadmin.
 * Idempotente: se puede correr varias veces sin duplicar filas.
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const ADMIN_EMAIL = "guzmanmurillom@gmail.com";
const ADMIN_PASSWORD = "pruebas_gym26";
const ADMIN_NAME = "Marco Guzmán";
const TENANT_NAME = "Iron Box CrossFit";

// Igual que posProductsMock en src/lib/api/pos.ts (sku = id del mock, estable para re-seeds).
const PRODUCTS = [
  { sku: "mem_mensual", name: "Membresía Mensual", price: 45, category: "Membresías", kind: "membership", stock: null },
  { sku: "mem_trimestral", name: "Membresía Trimestral", price: 120, category: "Membresías", kind: "membership", stock: null },
  { sku: "mem_semestral", name: "Membresía Semestral", price: 220, category: "Membresías", kind: "membership", stock: null },
  { sku: "mem_anual", name: "Membresía Anual", price: 399, category: "Membresías", kind: "membership", stock: null },
  { sku: "mem_dropin", name: "Pase Diario (Drop-in)", price: 8, category: "Membresías", kind: "membership", stock: null },
  { sku: "mem_pareja", name: "Membresía Pareja", price: 79, category: "Membresías", kind: "membership", stock: null },

  { sku: "sup_proteina", name: "Proteína Whey 1kg", price: 32, category: "Suplementos", kind: "product", stock: 24 },
  { sku: "sup_creatina", name: "Creatina 300g", price: 19, category: "Suplementos", kind: "product", stock: 40 },
  { sku: "sup_preworkout", name: "Pre-entreno 250g", price: 27, category: "Suplementos", kind: "product", stock: 12 },
  { sku: "sup_bcaa", name: "BCAA 400g", price: 22, category: "Suplementos", kind: "product", stock: 0 },
  { sku: "sup_omega3", name: "Omega-3 90 cáps", price: 15, category: "Suplementos", kind: "product", stock: 33 },
  { sku: "sup_barrita", name: "Barrita Proteica", price: 3, category: "Suplementos", kind: "product", stock: 120 },

  { sku: "beb_agua", name: "Agua Mineral 500ml", price: 1.5, category: "Bebidas", kind: "product", stock: 200 },
  { sku: "beb_isotonica", name: "Bebida Isotónica", price: 2.5, category: "Bebidas", kind: "product", stock: 85 },
  { sku: "beb_batido", name: "Batido Recovery", price: 4, category: "Bebidas", kind: "product", stock: 30 },
  { sku: "beb_cafe", name: "Café Americano", price: 1.8, category: "Bebidas", kind: "product", stock: 999 },

  { sku: "mer_camiseta", name: "Camiseta Técnica", price: 24, category: "Merchandising", kind: "product", stock: 50 },
  { sku: "mer_botella", name: "Botella Shaker", price: 9, category: "Merchandising", kind: "product", stock: 60 },
  { sku: "mer_toalla", name: "Toalla Microfibra", price: 12, category: "Merchandising", kind: "product", stock: 18 },
  { sku: "mer_gorra", name: "Gorra Logo", price: 14, category: "Merchandising", kind: "product", stock: 22 },
  { sku: "mer_banda", name: "Banda Elástica", price: 7, category: "Merchandising", kind: "product", stock: 45 },

  { sku: "srv_pt", name: "Sesión Personal Training", price: 30, category: "Servicios", kind: "product", stock: null },
  { sku: "srv_nutricion", name: "Consulta Nutricional", price: 40, category: "Servicios", kind: "product", stock: null },
  { sku: "srv_inbody", name: "Análisis InBody", price: 18, category: "Servicios", kind: "product", stock: null },
  { sku: "srv_masaje", name: "Masaje Deportivo", price: 35, category: "Servicios", kind: "product", stock: null },
];

// Igual que plansMock en src/lib/api/saas.ts
const PLANS = [
  { id: "lite", name: "Lite", monthly_price: 29, max_members: 150, max_seats: 2, features: ["Clientes y membresías", "POS básico", "Agenda de clases"], highlighted: false },
  { id: "pro", name: "Pro", monthly_price: 79, max_members: 600, max_seats: 8, features: ["Todo en Lite", "Entrenamiento y nutrición", "CRM y leads", "Control de accesos"], highlighted: true },
  { id: "enterprise", name: "Enterprise", monthly_price: 199, max_members: 99999, max_seats: 50, features: ["Todo en Pro", "Mensajería masiva", "Marca blanca total", "API e integraciones", "Soporte dedicado"], highlighted: false },
];

// Igual que permissionCatalogMock en src/lib/api/users.ts
const PERMISSION_MODULES = [
  { key: "clientes", label: "Clientes y Membresías", actions: [
    { key: "clientes.ver", label: "Ver" },
    { key: "clientes.crear", label: "Crear" },
    { key: "clientes.editar", label: "Editar" },
    { key: "clientes.eliminar", label: "Eliminar" },
  ]},
  { key: "pos", label: "Ventas / POS", actions: [
    { key: "pos.ver", label: "Ver" },
    { key: "pos.cobrar", label: "Cobrar" },
    { key: "pos.reembolsar", label: "Reembolsar" },
    { key: "pos.cierre", label: "Cierre de caja" },
  ]},
  { key: "agenda", label: "Agenda y Clases", actions: [
    { key: "agenda.ver", label: "Ver" },
    { key: "agenda.reservar", label: "Reservar" },
    { key: "agenda.gestionar", label: "Gestionar clases" },
  ]},
  { key: "entrenamiento", label: "Entrenamiento", actions: [
    { key: "entrenamiento.ver", label: "Ver" },
    { key: "entrenamiento.asignar", label: "Asignar rutinas" },
    { key: "entrenamiento.editar", label: "Editar planes" },
  ]},
  { key: "inventario", label: "Inventario", actions: [
    { key: "inventario.ver", label: "Ver" },
    { key: "inventario.ajustar", label: "Ajustar stock" },
    { key: "inventario.comprar", label: "Registrar compras" },
  ]},
  { key: "accesos", label: "Control de Accesos", actions: [
    { key: "accesos.ver", label: "Ver" },
    { key: "accesos.gestionar", label: "Gestionar dispositivos" },
  ]},
  { key: "reportes", label: "Reportes", actions: [
    { key: "reportes.ver", label: "Ver" },
    { key: "reportes.exportar", label: "Exportar" },
  ]},
  { key: "config", label: "Configuración", actions: [
    { key: "config.ver", label: "Ver" },
    { key: "config.editar", label: "Editar ajustes" },
    { key: "config.usuarios", label: "Gestionar usuarios" },
  ]},
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Falta DATABASE_URL en el entorno (.env.local).");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query("BEGIN");

    for (const p of PLANS) {
      await client.query(
        `INSERT INTO plan_definitions (id, name, monthly_price, max_members, max_seats, features, highlighted)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name, monthly_price = EXCLUDED.monthly_price,
           max_members = EXCLUDED.max_members, max_seats = EXCLUDED.max_seats,
           features = EXCLUDED.features, highlighted = EXCLUDED.highlighted`,
        [p.id, p.name, p.monthly_price, p.max_members, p.max_seats, JSON.stringify(p.features), p.highlighted],
      );
    }
    console.log(`-> ${PLANS.length} planes sembrados.`);

    const allPermissionKeys = [];
    for (const mod of PERMISSION_MODULES) {
      await client.query(
        `INSERT INTO permission_modules (key, label) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label`,
        [mod.key, mod.label],
      );
      for (const action of mod.actions) {
        await client.query(
          `INSERT INTO permission_actions (key, module_key, label) VALUES ($1, $2, $3)
           ON CONFLICT (key) DO UPDATE SET module_key = EXCLUDED.module_key, label = EXCLUDED.label`,
          [action.key, mod.key, action.label],
        );
        allPermissionKeys.push(action.key);
      }
    }
    console.log(`-> ${PERMISSION_MODULES.length} módulos de permisos / ${allPermissionKeys.length} acciones sembradas.`);

    let { rows: tenantRows } = await client.query(
      `SELECT id FROM tenants WHERE name = $1`,
      [TENANT_NAME],
    );
    let tenantId = tenantRows[0]?.id;
    if (!tenantId) {
      const inserted = await client.query(
        `INSERT INTO tenants (name, owner, plan, status, monthly_price, seats, created_at, renews_at)
         VALUES ($1, $2, 'pro', 'active', 79, 8, '2024-03-12', '2026-06-12')
         RETURNING id`,
        [TENANT_NAME, ADMIN_NAME],
      );
      tenantId = inserted.rows[0].id;
      console.log(`-> Tenant "${TENANT_NAME}" creado (${tenantId}).`);
    } else {
      console.log(`-> Tenant "${TENANT_NAME}" ya existía (${tenantId}).`);
    }

    await client.query(
      `INSERT INTO tenant_settings (tenant_id, primary_color, secondary_color, currency, locale)
       VALUES ($1, '#1e3a8a', '#0f766e', 'USD', 'es-ES')
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenantId],
    );

    for (const p of PRODUCTS) {
      await client.query(
        `INSERT INTO products (tenant_id, sku, name, category, kind, price, stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, sku) DO UPDATE SET
           name = EXCLUDED.name, category = EXCLUDED.category, kind = EXCLUDED.kind,
           price = EXCLUDED.price, stock = EXCLUDED.stock`,
        [tenantId, p.sku, p.name, p.category, p.kind, p.price, p.stock],
      );
    }
    console.log(`-> ${PRODUCTS.length} productos del catálogo POS sembrados.`);

    const roleUpsert = await client.query(
      `INSERT INTO roles (tenant_id, name, description, is_system)
       VALUES ($1, 'Superadministrador', 'Acceso total a todos los módulos del gimnasio.', true)
       ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      [tenantId],
    );
    const roleId = roleUpsert.rows[0].id;
    console.log(`-> Rol Superadministrador listo (${roleId}).`);

    for (const key of allPermissionKeys) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [roleId, key],
      );
    }
    console.log(`-> ${allPermissionKeys.length} permisos asignados al rol.`);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const staffUpsert = await client.query(
      `INSERT INTO staff_users (tenant_id, name, email, role_id, status, password_hash, is_platform_admin)
       VALUES ($1, $2, $3, $4, 'active', $5, true)
       ON CONFLICT (tenant_id, email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id,
         status = 'active', is_platform_admin = true
       RETURNING id`,
      [tenantId, ADMIN_NAME, ADMIN_EMAIL, roleId, passwordHash],
    );

    await client.query("COMMIT");

    console.log(`-> Staff user superadmin listo (${staffUpsert.rows[0].id}).`);
    console.log("\nListo. Datos para /api/auth/login:");
    console.log(`  tenantId: ${tenantId}`);
    console.log(`  email:    ${ADMIN_EMAIL}`);
    console.log(`  password: ${ADMIN_PASSWORD}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en el seed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
