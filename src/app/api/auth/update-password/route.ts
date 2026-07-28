import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, { allowPasswordChangeRequired: true });
  if (auth instanceof NextResponse) return auth;

  const { newPassword } = await req.json();
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await pool.query(
    `UPDATE staff_users SET
       password_hash = $1, force_password_change = false,
       status = CASE WHEN status = 'invited' THEN 'active' ELSE status END
     WHERE id = $2`,
    [passwordHash, auth.sub],
  );

  // El token en curso aún trae mustChangePassword=true (los JWT son inmutables);
  // se emite uno nuevo para no bloquear al usuario hasta el próximo refresh.
  // (se reconstruye el payload explícito: jwt.verify añade iat/exp en runtime
  // que no se declaran en AccessTokenPayload pero rompen jwt.sign si se reenvían)
  const accessToken = signAccessToken({
    sub: auth.sub,
    tenantId: auth.tenantId,
    role: auth.role,
    permissions: auth.permissions,
    mustChangePassword: false,
  });

  return NextResponse.json({ ok: true, accessToken });
}
