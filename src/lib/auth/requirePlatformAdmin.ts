import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

export async function requirePlatformAdmin(req: NextRequest): Promise<AccessTokenPayload | NextResponse> {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(`SELECT is_platform_admin FROM staff_users WHERE id = $1`, [auth.sub]);
  if (!rows[0]?.is_platform_admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  return auth;
}
