# Known issues

## "Eliminar" falla en Usuarios y Permisos tras cambios de JWT/sesión (resuelto con re-login)

**Reportado:** Marco Guzmán, sobre `guzmanmurillom@gmail.com` (Superadministrador, Iron Box CrossFit),
justo después de la Tanda 2 (RLS multitenant) y el hotfix `hotfix/rls-saas-platform-tx`.

**Síntoma:** click en "…" → "Eliminar" sobre un usuario en `/usuarios` no completaba la
acción. La consola del navegador mostraba ~8 respuestas 401 en `/api/saas/*` y
`/api/tenant/usage` durante la sola carga de la página, antes de tocar "Eliminar".

**Diagnóstico:** con logout + login limpio, `DELETE /api/users/:id` devuelve 200 de
forma consistente (probado con curl replicando exactamente el request del frontend,
en frío, y con el ciclo de vida completo — ver `scripts/smoke-users.js`). `GET
/api/saas/metrics`, `/api/saas/plans`, `/api/saas/tenants` y `/api/tenant/usage`
también devuelven 200 con un token recién emitido. **Era una sesión/token obsoleto
en el navegador**, no un bug de RLS, permisos ni del endpoint de borrado.

Se revisó también el código frontend de `/usuarios`: no existe ningún hook o
componente que dispare fetch a `/api/saas/*` desde esa página (`Topbar` solo llama
a `getTenantUsage()`, que es `/api/tenant/usage`, tenant-scoped). Los 401 de
`/api/saas/*` reportados junto al fallo del DELETE son consistentes con requests
en vuelo de una visita previa a `/saas` en la misma pestaña (sin `AbortController`
al desmontar) fallando por el mismo token vencido, no con un fetch intencional ni
con un bug nuevo en `/usuarios`.

**Instrucción operativa:** tras cualquier deploy que cambie el payload del JWT, los
guards de auth (`requireAuth`, `requirePlatformAdmin`) o los helpers de sesión de
RLS (`src/lib/db/tenantQuery.ts`), **forzar re-login** de las sesiones activas antes
de validar manualmente — no basta con recargar la página si el `accessToken` en
`localStorage` sigue siendo válido por firma/expiración pero quedó desalineado con
el nuevo comportamiento del backend.

**Fix a futuro (no implementado todavía):** en `POST /api/auth/login`, si se
detecta que el JWT anterior (si el cliente lo manda o se puede inferir) le faltan
claims que el backend actual espera, revocar todos los `refresh_tokens` del usuario
para forzar que todas sus sesiones activas re-autentiquen con el nuevo shape,
en vez de dejar sesiones mixtas (unas con JWT viejo, otras con el nuevo) convivir
silenciosamente.

**Mini-mejora de UX pendiente (no urgente):** los fetchers a nivel de página
(`saas/page.tsx`, `usuarios/page.tsx`, etc.) no usan `AbortController` en su
`useEffect` de carga. Si el usuario navega fuera de la página antes de que la
petición resuelva, la respuesta llega igual y se procesa contra un componente
ya desmontado — probablemente la causa de los 401 "fantasma" en consola
descritos arriba. Envolver esos fetchers en un `AbortController` con cleanup
(`return () => controller.abort()`) silenciaría la consola y evitaría procesar
responses obsoletos. No bloquea nada, queda como mejora futura.

**Hallazgo secundario — elevado a tarea propia:** el `useSessionStore` mock
(`src/store/useSessionStore.ts`) no es "ruido de UX" menor — ver
[Tanda 4bis: hidratación real de sesión](./tanda-4bis-session-hydration.md).
`Sidebar.can(permission)` filtra los 14 módulos contra permisos mock (no los
reales del JWT), así que cualquier usuario logueado ve los 14 links de
navegación, no solo los que su rol real permite. `Topbar` además muestra
"Marco Guzmán / Superadministrador" hardcoded sin importar quién inició sesión
(p. ej. Laura de PowerHouse vería el nombre de Marco). El backend bloquea el
daño real (Tanda 1 + Tanda 2 responden 403/404 en cada endpoint), pero la UI le
miente al usuario sobre quién es y qué puede tocar. Programado en paralelo al
outbox (Tanda 4), no bloquea Tanda 3 ni Tanda 4, pero debe resolverse antes de
conectar más módulos al backend.

**Smoke test:** `scripts/smoke-users.js` cubre el ciclo de vida completo (login
admin → invitar → login invitado + cambio de password → suspender → reactivar →
eliminar) y debe correrse antes de cerrar cualquier tanda que toque
`src/app/api/users/**`, `src/app/api/auth/**` o los helpers de RLS.
