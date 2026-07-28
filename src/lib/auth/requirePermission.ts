import { NextResponse } from "next/server";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

/**
 * Verifica un permiso puntual del catálogo `permission_actions` sobre un
 * payload de JWT ya validado por requireAuth(). Los platform admins
 * (is_platform_admin) tienen bypass total: gestionan la plataforma, no
 * un tenant, y el catálogo de permisos es tenant-scoped por diseño.
 */
export function requirePermission(
  auth: AccessTokenPayload,
  permission: string,
): NextResponse | null {
  if (!auth.permissions.includes(permission) && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "forbidden", permission }, { status: 403 });
  }
  return null;
}
