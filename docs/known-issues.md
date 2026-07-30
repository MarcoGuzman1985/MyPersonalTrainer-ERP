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

**Hallazgo secundario (fuera de alcance de este issue, dejar registrado):**
`src/store/useSessionStore.ts` sigue siendo un store mock — `setSession()` nunca
se invoca desde el flujo real de login, así que `user`/`tenant` en ese store son
siempre los valores mock hardcodeados (incluyendo `"saas.view"` en los permisos
mock). Esto no causa los 401 de este issue porque `Sidebar`/`Topbar` no disparan
fetches basados en ese store, pero sí significa que el link "Admin SaaS" del
sidebar se muestra a **cualquier** usuario logueado, no solo a platform admins
(el backend igual lo bloquea con 403 vía `requirePlatformAdmin`, así que no es un
hueco de seguridad, pero sí ruido de UX). Recomendado abordarlo en una tanda de
UI/auth aparte.

**Smoke test:** `scripts/smoke-users.js` cubre el ciclo de vida completo (login
admin → invitar → login invitado + cambio de password → suspender → reactivar →
eliminar) y debe correrse antes de cerrar cualquier tanda que toque
`src/app/api/users/**`, `src/app/api/auth/**` o los helpers de RLS.
