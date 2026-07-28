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

// El access token dura 15 min (ver src/lib/auth/jwt.ts). Cuando expira, apiFetch
// lo renueva una vez vía /auth/refresh (cookie httpOnly con el refresh token) y
// reintenta la petición original. Las renovaciones concurrentes comparten la
// misma promesa para no rotar el refresh token dos veces en paralelo.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (res) => (res.ok ? (await res.json()).accessToken as string : null))
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { tenantId, headers, ...rest } = options;

  // FormData (subida de archivos) fija su propio Content-Type con boundary;
  // si lo forzamos a JSON el multipart llega corrupto al servidor.
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

  const doFetch = () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("mpt_token") : null;
    return fetch(`${BASE_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
        ...headers,
      },
    });
  };

  let res = await doFetch();

  if (res.status === 401 && typeof window !== "undefined") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      window.localStorage.setItem("mpt_token", newToken);
      res = await doFetch();
    } else {
      window.localStorage.removeItem("mpt_token");
      window.location.href = "/login";
      return new Promise<T>(() => {}); // la navegación reemplaza la página
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error ?? `Error ${res.status} en ${path}`);
  }
  return res.json() as Promise<T>;
}
