import { NextRequest, NextResponse } from "next/server";
import { authTransaction } from "@/lib/db/tenantQuery";
import { signAccessToken } from "@/lib/auth/jwt";
import { rotateRefreshToken } from "@/lib/auth/refreshTokens";

const REFRESH_COOKIE = "mpt_refresh";

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!rawToken) {
    return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });
  }

  const rotated = await rotateRefreshToken(rawToken, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  if (!rotated) {
    const res = NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  const { rows } = await authTransaction((client) => client.query(
    `SELECT su.id, su.tenant_id, su.force_password_change, r.name AS role_name,
            COALESCE(array_agg(rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL), '{}') AS permissions
     FROM staff_users su
     JOIN roles r ON r.id = su.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     WHERE su.id = $1
     GROUP BY su.id, r.name`,
    [rotated.staffUserId],
  ));
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 401 });
  }

  const accessToken = signAccessToken({
    sub: user.id,
    tenantId: user.tenant_id,
    role: user.role_name,
    permissions: user.permissions,
    mustChangePassword: user.force_password_change,
  });

  const res = NextResponse.json({ accessToken });
  res.cookies.set(REFRESH_COOKIE, rotated.newRawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60,
  });

  return res;
}
