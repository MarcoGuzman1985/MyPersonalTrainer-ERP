import { NextRequest, NextResponse } from "next/server";
import { tenantQuery } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

export async function requirePlatformAdmin(req: NextRequest): Promise<AccessTokenPayload | NextResponse> {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // staff_users tiene RLS: el propio JWT ya trae el tenantId del usuario, así
  // que basta con tenantQuery (no hace falta el bypass is_platform aquí,
  // ya que solo se está leyendo la fila propia del usuario dentro de su tenant).
  const { rows } = await tenantQuery(auth, `SELECT is_platform_admin FROM staff_users WHERE id = $1`, [auth.sub]);
  if (!rows[0]?.is_platform_admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  return auth;
}
