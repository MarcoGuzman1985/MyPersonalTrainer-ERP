/**
 * Cliente HTTP central del ERP.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  CONEXIÓN CON EL BACKEND
 * ───────────────────────────────────────────────────────────────────────────
 *  - Todas las llamadas pasan por `apiFetch`, que inyecta automáticamente:
 *      · el header `Authorization: Bearer <token>` (sesión)
 *      · el header `X-Tenant-Id` (aislamiento multitenant)
 *  - La base URL se resuelve desde NEXT_PUBLIC_API_URL.
 *  - Cada módulo expone sus funciones en `src/lib/api/<modulo>.ts` y consume
 *    este `apiFetch`. Las vistas hoy usan datos mock; al conectar el backend,
 *    basta sustituir los mocks por estas funciones dentro de useEffect / hooks
 *    de datos (o React Query / SWR si se adopta).
 * ───────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends RequestInit {
  /** Sobrescribe el tenant activo (uso en Admin SaaS). */
  tenantId?: string;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { tenantId, headers, ...rest } = options;

  // TODO(backend): obtener token/tenant reales desde la sesión httpOnly o el store.
  const token = typeof window !== "undefined" ? window.localStorage.getItem("mpt_token") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Error ${res.status} en ${path}`);
  }
  return res.json() as Promise<T>;
}
