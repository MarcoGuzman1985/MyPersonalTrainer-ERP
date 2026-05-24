# MyPersonalTrainer · ERP

Plataforma SaaS **multitenant** para Gimnasios, Boxes de CrossFit y Entrenadores Personales.
Frontend construido con **Next.js 14 (App Router) + TypeScript + Tailwind CSS + lucide-react + Zustand**.

> Las vistas funcionan hoy con **datos mock** (`src/lib/api/*`). Cada archivo marca con
> `// TODO(backend): …` el endpoint real donde se conectará la API de forma asíncrona.
> El cliente HTTP central (`src/lib/api/client.ts`) ya inyecta `Authorization` y `X-Tenant-Id`.

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:3000  (redirige a /saas)
npm run build      # build de producción
npm run typecheck  # tsc --noEmit
```

## Sistema de diseño

Paleta corporativa premium/deportiva con soporte de **tema claro/oscuro** (clase `.dark`):

- `brand-800` → azul pizarra `#1e3a8a` (énfasis primario)
- `teal-700` → verde/turquesa `#0f766e` (éxito / acento secundario)
- Tokens semánticos por CSS variables: `surface`, `surface-muted`, `surface-elevated`, `line`, `content*`.

Primitivas reutilizables en `src/components/ui` (importables desde `@/components/ui`):
`Button, Card, Badge, Skeleton, Input/Textarea/Select/Field, Tabs, Avatar, Progress,
StatCard, DataTable, Modal, PageHeader`. Las tablas incluyen **skeletons de carga, paginación
y filtros**; mobile-first en vistas operativas y escritorio para el panel administrativo.

## Estructura de carpetas

```
src/
├── app/
│   ├── layout.tsx                # Root layout (fuente, providers, metadata)
│   ├── globals.css               # Tokens de tema (CSS variables) + base Tailwind
│   ├── providers.tsx             # Wrapper de providers cliente
│   ├── page.tsx                  # Raíz → redirige a /saas
│   └── (dashboard)/              # Grupo de rutas con shell administrativo
│       ├── layout.tsx            # Sidebar + Topbar + MobileNav
│       ├── saas/                 # 01 Admin SaaS
│       ├── usuarios/             # 02 Usuarios y Permisos (RBAC)
│       ├── clientes/             # 03 Clientes y Membresías (perfil 360°)
│       ├── pos/                  # 04 Ventas y Pagos (POS táctil)
│       ├── entrenamiento/        # 05 Diseñador de rutinas + Timer CrossFit
│       ├── agenda/               # 06 Agenda y Clases (semanal/mensual)
│       ├── nutricion/            # 07 Nutrición (macros + PDF)
│       ├── accesos/              # 08 Control de Accesos (live feed + QR)
│       ├── inventario/           # 09 Inventario y Proveedores
│       ├── crm/                  # 10 CRM y Leads (Kanban)
│       ├── mensajeria/           # 11 Mensajería WhatsApp (Evolution API)
│       ├── auditoria/            # 12 Logs de Auditoría
│       ├── sistema/              # 13 Salud del Sistema (errores + alertas)
│       └── configuracion/        # 14 Configuración del Tenant (marca blanca)
├── components/
│   ├── ui/                       # Sistema de diseño (primitivas)
│   ├── layout/                   # Sidebar, Topbar, MobileNav
│   └── modules/                  # Componentes específicos por módulo
├── lib/
│   ├── utils.ts                  # cn, formatCurrency, formatDate, …
│   ├── navigation.ts             # Mapa de los 14 módulos (filtrado por RBAC)
│   └── api/                      # Capa de datos: client + mocks por módulo
├── store/                        # Zustand: sesión, tenant, UI, carrito POS
└── types/                        # Interfaces TypeScript (shared + por módulo)
```

## Multitenant y RBAC

- `useSessionStore` expone `user`, `tenant` y `can(permission)`; hoy se hidrata con un
  superadmin mock y en producción vendrá de `GET /api/auth/session`.
- El `Sidebar` y `MobileNav` filtran los 14 módulos según los permisos del usuario.
- `useTenant... `/`TenantContext` aporta marca, plan, moneda y locale para la marca blanca.

## Los 14 módulos

Cada módulo sigue el mismo patrón: `types/<m>.ts` (contratos) → `lib/api/<m>.ts`
(mocks + endpoints) → `app/(dashboard)/<ruta>/page.tsx` (vista) → `components/modules/<m>/`
(piezas complejas: gráficos SVG, Kanban DnD, cronómetro, generador QR, etc.).
