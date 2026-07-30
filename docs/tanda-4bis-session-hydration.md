# Tanda 4bis: hidratación real de sesión (desconexión auth real ↔ estado del cliente)

**Estado:** planeada, no implementada. En paralelo a Tanda 4 (mail outbox) — no
bloquea Tanda 3 (pgcrypto) ni Tanda 4, pero debe resolverse antes de conectar
más módulos al backend real.

## Por qué es más que un known-issue

`src/store/useSessionStore.ts` es un store **mock**: `setSession()` nunca se
invoca desde el flujo real de login (`/login` solo guarda el `accessToken` en
`localStorage`, ver `src/lib/api/client.ts`). El store sigue devolviendo
siempre `mockUser`/`mockTenant`, con consecuencias concretas, no solo
cosméticas:

- `Sidebar.can(permission)` filtra los 14 módulos de navegación contra los
  permisos **mock** (que incluyen todos los `*.view`), no contra los permisos
  reales del JWT. Cualquier usuario logueado ve los 14 links de navegación —
  no solo "Admin SaaS", también CRM, Mensajería, Auditoría, Sistema, etc. —
  independientemente de su rol real.
- `Topbar` muestra "Marco Guzmán / Superadministrador" hardcoded sin importar
  quién inició sesión. Si Laura de PowerHouse se loguea, ve el nombre de Marco.
- El backend sí bloquea el daño real: Tanda 1 (RBAC) y Tanda 2 (RLS) responden
  403/404 en cada endpoint según el JWT real, independientemente de lo que
  muestre la UI. **No es un hueco de seguridad** — es una desconexión total
  entre la autenticación real (JWT/backend) y el estado que el cliente cree
  tener.

## Alcance mínimo

1. Nuevo endpoint `GET /api/auth/session` que devuelva
   `{ user, tenant, permissions, isPlatformAdmin }` derivados del JWT actual
   (vía `requireAuth`, igual que cualquier otra ruta `[tenant]`/`[auth]`).
2. Al login exitoso (`/login`), invocar `useSessionStore.setSession(...)` con
   la respuesta real en vez de dejar el store en su estado mock inicial.
3. En `(dashboard)/layout.tsx`: si el store está vacío al montar, hidratar
   contra `GET /api/auth/session`. Si el fetch devuelve 401, redirigir a
   `/login`.
4. Al logout, `useSessionStore.clear()`.
5. Eliminar `mockUser`/`mockTenant` de `src/store/useSessionStore.ts` — sin
   fallback mock una vez que el punto 3 esté implementado.

## Relacionado

- [Known issues](./known-issues.md) — diagnóstico original que motivó elevar
  esto a tarea propia.
