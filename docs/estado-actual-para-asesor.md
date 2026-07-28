# Estado actual del proyecto — MyPersonalTrainer ERP

Documento generado para pasar contexto a un asesor externo (integración SMTP real y conexión de módulos pendientes). Basado en lectura directa del código, no en memoria ni suposiciones.

Stack: Next.js 14.2.18 (App Router) · TypeScript · PostgreSQL (Render, `pg` puro sin ORM) · Zustand · Tailwind. Auth propia (JWT + bcrypt), sin librería de auth de terceros.

---

## 1. Configuración de correo actual

**Archivo del transporter:** `src/lib/mail/sendMail.ts`

```ts
transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
```

Singleton perezoso a nivel de módulo (se crea una sola vez, se reutiliza). Sin configuración de pool/rate-limit más allá de los defaults de Nodemailer.

**Variables de entorno leídas exactamente:**
- `SMTP_HOST`
- `SMTP_PORT` (default `587` si no está seteada)
- `SMTP_SECURE` (comparación literal `=== "true"`; cualquier otro valor → `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (fallback: `"MyPersonalTrainer ERP <no-reply@mypersonaltrainer.app>"`)

Hoy en `.env.local` estos valores son **ficticios** (`smtp.mailtrap.io` con usuario/password inventados) — todo intento de envío falla con `535 Invalid credentials`, capturado y logueado, nunca tumba el request.

**Flujos que envían correo (los únicos 3 en todo el código):**

| # | Disparador | Ruta | Función/plantilla | Await / fire-and-forget |
|---|---|---|---|---|
| 1 | Alta de usuario staff (invitar) | `POST /api/users` (`src/app/api/users/route.ts`) | Genera password temporal + hash, inserta con `force_password_change=true`, envía `"Tu acceso a MyPersonalTrainer ERP"` con la clave en texto plano dentro del HTML | **Awaited**, con `try/catch` propio → devuelve `emailSent: boolean` en la respuesta JSON (el modal del frontend muestra la clave igual, con o sin éxito de envío) |
| 2 | Reset de contraseña por soporte (Admin SaaS → Drawer de tenant → tab "Soporte") | `POST /api/saas/tenants/[id]/reset-password` | `"Tu contraseña temporal de MyPersonalTrainer ERP"`, misma mecánica de clave temporal + `force_password_change=true` | **Awaited**, `try/catch` → devuelve `emailSent` |
| 3 | Cobro exitoso en POS con socio identificado (`customerId` presente y con email) | `POST /api/pos/checkout` | `"Tu recibo de compra — Folio XXXXXXXX"` con el detalle de líneas + total | **Fire-and-forget** (`sendMail(...).catch(err => console.error(...))`, sin `await`) — el error solo queda en logs del servidor, no llega al cliente ni a ninguna UI |

**Cola/retry:** no existe. Es una llamada directa `nodemailer.sendMail()` por evento, un solo intento, sin reintentos, sin backoff, sin persistencia del envío (no hay tabla de log de emails — la tabla `send_logs` que sí existe en el esquema es para el módulo de Mensajería/WhatsApp, no se usa para estos 3 correos).

---

## 2. Esquema PostgreSQL (tablas relevantes)

Todas las tablas usan `uuid PRIMARY KEY DEFAULT gen_random_uuid()` salvo que se indique lo contrario. Extensiones activas: `pgcrypto`, `citext`.

### tenants / planes / suscripción de plataforma / renovaciones

No existe una tabla `subscriptions` separada a nivel plataforma: el propio `tenants` guarda plan/estado/vigencia. `plan_definitions` es el catálogo de planes (antes ENUM cerrado, migrado a texto libre en migración 021 para permitir altas/bajas de planes estacionales).

```sql
CREATE TABLE plan_definitions (
  id             text PRIMARY KEY,  -- migrado de saas_plan (enum) a texto libre
  name           text NOT NULL,
  monthly_price  numeric(10,2) NOT NULL,
  max_members    integer NOT NULL,
  max_seats      integer NOT NULL,
  features       jsonb NOT NULL DEFAULT '[]',
  highlighted    boolean NOT NULL DEFAULT false
);
-- CHECK (id ~ '^[a-z0-9][a-z0-9-]{1,49}$')

CREATE TABLE tenants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  owner          text NOT NULL,
  plan           text NOT NULL REFERENCES plan_definitions(id),
  status         tenant_status NOT NULL DEFAULT 'trial',  -- enum: active|trial|past_due|suspended
  monthly_price  numeric(10,2) NOT NULL,
  seats          integer NOT NULL DEFAULT 1,
  metadata       jsonb NOT NULL DEFAULT '{}',  -- notas libres de soporte/IA
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  renews_at      timestamptz
);
CREATE INDEX idx_tenants_status ON tenants(status);

CREATE TABLE subscription_renewals (  -- comprobantes de pago del tenant a la plataforma
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount       numeric(10,2) NOT NULL,
  receipt_url  text NOT NULL,  -- hoy URL ficticia; falta integrar Drive real
  status       renewal_status NOT NULL DEFAULT 'pending',  -- enum: pending|approved|rejected
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscription_renewals_tenant ON subscription_renewals(tenant_id, created_at DESC);
```

### users (staff), roles, permissions, role_permissions

```sql
CREATE TABLE roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE permission_modules (  -- catálogo fijo, global (no por tenant)
  key   text PRIMARY KEY,
  label text NOT NULL
);

CREATE TABLE permission_actions (  -- 24 acciones en 8 módulos, seed único
  key         text PRIMARY KEY,
  module_key  text NOT NULL REFERENCES permission_modules(key) ON DELETE CASCADE,
  label       text NOT NULL
);

CREATE TABLE role_permissions (
  role_id        uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permission_actions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

CREATE TABLE staff_users (  -- "users"
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                   text NOT NULL,
  email                  citext NOT NULL,
  avatar_url             text,
  role_id                uuid NOT NULL REFERENCES roles(id),
  status                 staff_status NOT NULL DEFAULT 'invited',  -- enum: active|invited|disabled
  password_hash          text,
  is_platform_admin      boolean NOT NULL DEFAULT false,  -- acceso a /api/saas/*
  force_password_change  boolean NOT NULL DEFAULT false,
  last_active_at         timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
CREATE INDEX idx_staff_users_tenant ON staff_users(tenant_id);
```

**No existen tablas `password_resets` ni `invitations` como entidades propias.** Ambos flujos (reset de soporte e invitación de staff) escriben directamente sobre `staff_users.password_hash` + `force_password_change`, sin token de un solo uso ni expiración — es un valor sincrónico generado y devuelto/enviado en el momento.

```sql
CREATE TABLE refresh_tokens (  -- equivalente a "sessions"
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id  uuid NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  token_hash     text NOT NULL UNIQUE,  -- SHA-256 del token; el crudo nunca se persiste
  user_agent     text,
  ip             text,
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz,
  replaced_by    uuid REFERENCES refresh_tokens(id),  -- rotación
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

### members (clientes) y sus membresías

```sql
CREATE TABLE members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       citext NOT NULL,
  phone       text NOT NULL,
  gender      gender NOT NULL,  -- enum: male|female|other
  birth_date  date NOT NULL,
  avatar_url  text,
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
CREATE INDEX idx_members_tags ON members USING gin(tags);

CREATE TABLE member_subscriptions (  -- historial; vigente = is_current=true (única por socio)
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan          saas_plan NOT NULL,  -- OJO: sigue en el ENUM viejo (lite|pro|enterprise), no migrado
  status        membership_status NOT NULL,  -- enum: active|expired|frozen
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  price         numeric(10,2) NOT NULL,
  auto_renew    boolean NOT NULL DEFAULT true,
  frozen_until  date,
  is_current    boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_member_subscriptions_current ON member_subscriptions(member_id) WHERE is_current;

-- Además: anthropometric_entries, member_billing_profiles (datos fiscales para el POS)
```

### pos_sales, pos_sale_items, products

```sql
CREATE TABLE products (  -- unifica catálogo POS + inventario
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku          text,
  name         text NOT NULL,
  category     text NOT NULL,
  kind         product_kind NOT NULL,  -- enum: product|membership|service
  price        numeric(10,2) NOT NULL,
  stock        integer,       -- NULL = sin límite (membresías/servicios)
  min_stock    integer,
  supplier_id  uuid REFERENCES suppliers(id),
  is_active    boolean NOT NULL DEFAULT true,  -- borrado lógico
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);

CREATE TABLE sales (  -- "pos_sales"
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id       uuid REFERENCES members(id),  -- null = público general
  staff_user_id   uuid NOT NULL REFERENCES staff_users(id),
  payment_method  payment_method NOT NULL,  -- enum: cash|card|transfer|wallet
  subtotal        numeric(10,2) NOT NULL,
  tax_rate        numeric(5,4) NOT NULL DEFAULT 0,
  total           numeric(10,2) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sale_lines (  -- "pos_sale_items"
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id),
  name        text NOT NULL,           -- snapshot al momento de la venta
  price       numeric(10,2) NOT NULL,  -- snapshot
  qty         integer NOT NULL
);

-- Además: suppliers, stock_movements (in/out, generados automáticamente por checkout)
```

### classes, class_bookings, coaches, rooms

```sql
CREATE TABLE rooms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  capacity   integer NOT NULL,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','maintenance')),
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coaches (  -- entidad propia, NO requiere login (no es staff_users)
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name           text NOT NULL,
  last_name            text NOT NULL,
  dob                  date,
  phone                text,
  address              text,
  email                text,
  anthropometric_data  jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gym_classes (  -- "classes"
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title      text NOT NULL,
  coach_id   uuid REFERENCES coaches(id),  -- migrado desde staff_users (ver §7)
  room       text NOT NULL,   -- snapshot legible del nombre de sala
  room_id    uuid REFERENCES rooms(id),  -- FK real usada para capacidad/filtros
  start_at   timestamptz NOT NULL,
  end_at     timestamptz NOT NULL,
  capacity   integer NOT NULL,
  type       class_type NOT NULL,  -- enum: crossfit|spinning|yoga|funcional|boxeo|hiit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gym_classes_tenant_start ON gym_classes(tenant_id, start_at);

CREATE TABLE class_bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_class_id  uuid NOT NULL REFERENCES gym_classes(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  waitlisted    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gym_class_id, member_id)
);
```

### audit_logs

```sql
CREATE TABLE audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  staff_user_id uuid REFERENCES staff_users(id),
  user_name     text NOT NULL,  -- snapshot
  user_role     text NOT NULL,  -- snapshot
  action        audit_action NOT NULL,  -- enum: create|update|delete|login|logout|export
  module        text NOT NULL,
  ip            text NOT NULL,
  user_agent    text,
  before        jsonb,
  after         jsonb
);
```
**La tabla existe (migración 014) pero nada en el código escribe en ella todavía** — el módulo Auditoría sigue 100% en mock en el frontend.

---

## 3. Multitenant

**Mecanismo:** columna `tenant_id` en (casi) todas las tablas de negocio. **No hay** schema-per-tenant, **no hay** Row Level Security de Postgres (ninguna migración usa `ENABLE ROW LEVEL SECURITY` ni `CREATE POLICY`), y **no hay** `middleware.ts` de Next.js (confirmado: no existe el archivo en el repo).

El aislamiento se resuelve **manualmente, por convención, en cada Route Handler**:

1. El JWT de acceso (`src/lib/auth/jwt.ts`) lleva `tenantId` embebido desde el login.
2. `requireAuth(req)` (`src/lib/auth/requireAuth.ts`) verifica el JWT y devuelve el payload (`{ sub, tenantId, role, permissions, mustChangePassword }`) o un `NextResponse` de error.
3. Cada query SQL de cada endpoint agrega manualmente `WHERE tenant_id = $1` usando `auth.tenantId`.

Ejemplo real (`src/app/api/members/route.ts`):
```ts
const auth = requireAuth(req);
if (auth instanceof NextResponse) return auth;
...
const { rows } = await pool.query(LIST_QUERY, [auth.tenantId, search, status, pageSize, offset]);
// LIST_QUERY contiene: WHERE m.tenant_id = $1 AND ...
```

**Importante para el asesor:** esto es una convención de código, no una garantía de la base de datos ni del framework. Si una ruta nueva olvida el `WHERE tenant_id = $1`, hay fuga cruzada entre tenants sin que nada lo impida a nivel de Postgres.

**Excepción — rutas de plataforma:** `/api/saas/*` (gestión de tenants, planes, integraciones) usa `requirePlatformAdmin(req)` (`src/lib/auth/requirePlatformAdmin.ts`) en vez de scoping por tenant — verifica `staff_users.is_platform_admin = true` y a propósito consulta **across** todos los tenants.

---

## 4. Estructura del backend (resumen, `src/`)

```
src/
├── app/
│   ├── api/
│   │   ├── auth/{login,logout,refresh,update-password}/route.ts
│   │   ├── members/route.ts, [id]/route.ts, [id]/billing/route.ts, metrics/route.ts
│   │   ├── users/route.ts, [id]/route.ts, metrics/route.ts
│   │   ├── roles/route.ts, [id]/permissions/route.ts
│   │   ├── permissions/catalog/route.ts
│   │   ├── pos/products/route.ts, [id]/route.ts, checkout/route.ts, sales/[id]/receipt/route.ts
│   │   ├── classes/route.ts, [id]/book/route.ts, [id]/attendees/route.ts
│   │   ├── rooms/route.ts, [id]/route.ts
│   │   ├── coaches/route.ts, [id]/route.ts
│   │   ├── tenant/usage/route.ts
│   │   ├── saas/
│   │   │   ├── metrics, plans (+[id]), tenants (+[id], reset-password, integrations)
│   │   │   └── renewals, renewals/upload
│   │   └── webhooks/expiring-trials/route.ts        <- token estático, no JWT
│   └── (dashboard)/<14 módulos>/page.tsx             <- UI, ver §6
├── lib/
│   ├── db.ts                                         <- pool `pg` singleton
│   ├── auth/
│   │   ├── jwt.ts, password.ts, refreshTokens.ts, tempPassword.ts
│   │   ├── requireAuth.ts                             <- GUARD principal (tenant-scoped)
│   │   └── requirePlatformAdmin.ts                    <- GUARD plataforma (cross-tenant)
│   ├── mail/sendMail.ts                               <- MAILER (único punto de envío)
│   ├── plan/limits.ts                                 <- límites de plan (members/seats)
│   ├── pos/receipt.ts                                 <- construye el recibo (usado por checkout y reprint)
│   └── api/*.ts                                       <- capa fetch del frontend (algunos aún mock)
└── components/, store/, types/                        <- UI
```
No hay carpeta de "jobs"/workers ni cron interno — el único job periódico (`expiring-trials`) es **pull**: lo llama n8n desde afuera, la app no dispara nada por sí sola.

---

## 5. Webhook n8n e integraciones por tenant

**Importante:** es un endpoint de **polling/pull**, no un webhook saliente. La app no empuja eventos a n8n; n8n debe programar un nodo Cron que llame periódicamente a:

```
GET /api/webhooks/expiring-trials
Header: X-Webhook-Token: <CRON_WEBHOOK_TOKEN>
```

No hay ningún otro evento que dispare este webhook — la condición es puramente temporal (`tenants.renews_at` cae exactamente 10 días desde `current_date`, calculado en cada llamada).

**Payload de respuesta:**
```json
{
  "checkedAt": "2026-...Z",
  "count": 1,
  "tenants": [
    { "tenantId": "...", "gymName": "...", "ownerName": "...", "plan": "pro", "renewsAt": "...", "ownerEmail": "..." }
  ]
}
```
`ownerEmail` se resuelve tomando el `staff_users` más antiguo del tenant (asume que es el dueño, por convención de cómo se crea el tenant en `POST /api/saas/tenants`).

**Credenciales de integraciones externas por tenant:** tabla `tenant_integrations` (§2 no listada arriba, agregada en migración 022):
```sql
CREATE TABLE tenant_integrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider     text NOT NULL CHECK (provider IN ('google_calendar','meta','whatsapp','gemini')),
  credentials  jsonb NOT NULL DEFAULT '{}',  -- SIN cifrar, comentario explícito "cifrar en producción"
  is_active    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);
```
Gestionadas por `GET/PUT /api/saas/tenants/[id]/integrations` (solo platform admin, desde el tab "Integraciones" del Drawer de tenant). **Las credenciales viajan y se guardan en texto plano** — no hay cifrado a nivel de aplicación implementado, es una nota pendiente en el propio comentario SQL.

**Nota de duplicidad:** existe también `evolution_configs` (migración 013, pensada para el módulo de Mensajería/WhatsApp) que es conceptualmente lo mismo — credenciales de integración por tenant — pero para un módulo que sigue en mock y sin ningún endpoint que la use. Hay dos mecanismos superpuestos que deberían unificarse antes de conectar Mensajería.

---

## 6. Estado real de cada módulo

| # | Módulo | ¿Conectado a Postgres? | Tablas que usa | Endpoints principales | Notas |
|---|---|---|---|---|---|
| 01 | Admin SaaS | **Sí** | `tenants`, `plan_definitions`, `subscription_renewals`, `tenant_integrations`, `staff_users` | `/api/saas/metrics`, `/api/saas/plans[/id]`, `/api/saas/tenants[/id]`, `/api/saas/tenants/[id]/reset-password`, `/api/saas/tenants/[id]/integrations`, `/api/saas/renewals[/upload]` | Planes dinámicos (ya no enum); reset con email |
| 02 | Usuarios y Permisos | **Sí** | `staff_users`, `roles`, `permission_modules`, `permission_actions`, `role_permissions` | `/api/users[/id]`, `/api/users/metrics`, `/api/roles[/[id]/permissions]`, `/api/permissions/catalog` | Invitar genera password temporal + email |
| 03 | Clientes y Membresías | **Sí** | `members`, `member_subscriptions`, `anthropometric_entries`, `member_billing_profiles` | `/api/members[/id]`, `/api/members/metrics`, `/api/members/[id]/billing` | |
| 04 | Ventas y Pagos (POS) | **Sí** | `products`, `suppliers`, `stock_movements`, `sales`, `sale_lines`, `member_billing_profiles` | `/api/pos/products[/id]`, `/api/pos/checkout`, `/api/pos/sales/[id]/receipt` | Envía recibo por correo (fire-and-forget) |
| 05 | Entrenamiento | **No** | `exercises`, `routines`, `routine_blocks`, `routine_exercises` (tablas creadas, sin API) | — | `src/lib/api/training.ts` sigue en mock |
| 06 | Agenda y Clases | **Sí** | `gym_classes`, `class_bookings`, `rooms`, `coaches`, `attendance_records` (parcial) | `/api/classes[/[id]/book, /attendees]`, `/api/rooms[/id]`, `/api/coaches[/id]` | Reservas con `SELECT ... FOR UPDATE`, lista de espera, export PDF |
| 07 | Nutrición | **No** | `nutrition_plans`, `meals`, `meal_items` (tablas creadas, sin API) | — | |
| 08 | Control de Accesos | **No** | `access_events` (tabla creada, sin API) | — | |
| 09 | Inventario y Proveedores | **Parcial** | Comparte `products`/`suppliers`/`stock_movements` con POS | Ninguno propio | `stock_movements` se generan automáticamente desde el checkout; no hay API/UI dedicada de inventario (altas manuales, ajustes, proveedores) |
| 10 | CRM y Leads | **No** | `leads` (tabla creada, sin API) | — | |
| 11 | Mensajería | **No** | `evolution_configs`, `message_templates`, `send_logs` (tablas creadas, sin API) | — | Ver duplicidad con `tenant_integrations` en §5 |
| 12 | Auditoría | **No** | `audit_logs` (tabla creada, sin API; nada escribe en ella) | — | |
| 13 | Salud del Sistema | **No** | `system_errors`, `alert_rules`, `health_stats` (tablas creadas, sin API) | — | |
| 14 | Configuración del Tenant | **Parcial** | `tenant_settings`, `payment_gateways` (creadas), `subscription_renewals` (conectada) | `/api/saas/renewals[/upload]` | Solo el tab "Suscripción" (subir comprobante) está conectado; marca/impuestos/pasarelas de pago siguen en mock |

---

## 7. Deuda técnica / decisiones pendientes que el asesor debe conocer

1. **SMTP ficticio**: `.env.local` apunta a Mailtrap con credenciales inventadas. Falta decidir con Google Workspace si se usa **App Password** (SMTP AUTH básico, más simple, requiere que la cuenta lo permita) o **OAuth2/XOAUTH2** (más robusto, más trabajo de implementación en `sendMail.ts`).
2. **Sin cola ni reintentos de correo**: cualquier falla transitoria de SMTP se pierde (solo queda en logs del servidor para el caso del recibo POS; para invitación/reset sí se refleja como `emailSent:false` en la UI).
3. **Aislamiento multitenant sin red de seguridad de BD**: depende 100% de que cada ruta nueva agregue `WHERE tenant_id = $1`. No hay RLS ni middleware que lo fuerce. Cualquier ruta nueva debe revisarse con lupa en este punto.
4. **Sin enforcement de permisos (RBAC) a nivel de API**: `requireAuth` solo valida "¿es un staff válido de este tenant?", no "¿su rol tiene el permiso `clientes.eliminar`?". La matriz de 24 permisos existe y se persiste, pero ningún endpoint la consulta antes de actuar — el control de permisos hoy es solo cosmético en el frontend (oculta/muestra botones), no una barrera real de backend.
5. **Duplicidad de credenciales de integración por tenant**: `tenant_integrations` (nueva, usada por Admin SaaS) vs. `evolution_configs` (vieja, pensada para Mensajería, sin uso). Conviene unificar antes de conectar el módulo 11.
6. **Credenciales sin cifrar en BD**: `tenant_integrations.credentials`, `evolution_configs.api_key` y `payment_gateways.secret_key` se guardan en texto plano en jsonb/text — hay comentarios `-- cifrar en producción` en el propio SQL, nunca implementado.
7. **`member_subscriptions.plan` sigue en el ENUM viejo** (`saas_plan`: lite/pro/enterprise) mientras que `tenants.plan`/`plan_definitions.id` ya son texto libre dinámico (migración 021). Son conceptos distintos (tier del socio vs. plan SaaS del tenant) pero si en el futuro se quiere que los socios tengan planes personalizados, esa tabla necesita la misma migración.
8. **No hay "olvidé mi contraseña" self-service para staff**: solo existe reset disparado por un platform admin (Admin SaaS) o la clave temporal inicial de la invitación. Un empleado que se bloquea a sí mismo depende de soporte.
9. **Password reset / invitación sin token expirable**: no hay tabla de tokens de un solo uso; la clave temporal se genera y persiste (hasheada) inmediatamente, sin ventana de expiración propia más allá de que el propio staff la cambie.
10. **`CRON_WEBHOOK_TOKEN` es un secreto estático único**, sin rotación ni scoping por integración — suficiente para el caso actual (un solo consumidor n8n) pero no escala a múltiples integraciones con distinto nivel de confianza.
11. **Sin Dockerfile ni configuración de despliegue** (`render.yaml`, etc.) en el repo — el despliegue actual es manual/local contra la Postgres de Render.
12. **`gym_classes` tiene `room` (texto, snapshot) y `room_id` (FK) simultáneos** — `room_id` es la fuente de verdad relacional (capacidad, filtros); `room` es solo para lectura rápida. Cualquier cambio en Agenda debe mantener ambos sincronizados o eliminar el snapshot.

---

*Documento generado a partir de lectura directa de migraciones (`db/migrations/001` a `025`), rutas API (`src/app/api/**/route.ts`), y helpers de auth/mail (`src/lib/auth/*`, `src/lib/mail/sendMail.ts`). Ningún dato fue inferido sin verificar el archivo correspondiente.*
