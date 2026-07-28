import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueRefreshToken } from "@/lib/auth/refreshTokens";

const REFRESH_COOKIE = "mpt_refresh";

export async function POST(req: NextRequest) {
  const { tenantId, email, password } = await req.json();

  if (!tenantId || !email || !password) {
    return NextResponse.json({ error: "tenantId, email y password son requeridos." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT su.id, su.password_hash, su.status, su.name, su.force_password_change,
            su.is_platform_admin, r.name AS role_name,
            COALESCE(array_agg(rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL), '{}') AS permissions
     FROM staff_users su
     JOIN roles r ON r.id = su.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     WHERE su.tenant_id = $1 AND su.email = $2
     GROUP BY su.id, r.name`,
    [tenantId, email],
  );

  const user = rows[0];
  // "invited" con password_hash ya asignado = aún no completa su primer login
  // forzado (ver /api/auth/update-password); "disabled" nunca puede entrar.
  if (!user || !user.password_hash || !["active", "invited"].includes(user.status)) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const accessToken = signAccessToken({
    sub: user.id,
    tenantId,
    role: user.role_name,
    permissions: user.permissions,
    mustChangePassword: user.force_password_change,
    isPlatformAdmin: user.is_platform_admin,
  });

  const refreshToken = await issueRefreshToken(user.id, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  await pool.query(`UPDATE staff_users SET last_active_at = now() WHERE id = $1`, [user.id]);

  const res = NextResponse.json({
    accessToken,
    user: {
      id: user.id, name: user.name, role: user.role_name, permissions: user.permissions,
      mustChangePassword: user.force_password_change,
    },
  });

  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60,
  });

  return res;
}
