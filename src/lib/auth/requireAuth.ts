import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/auth/jwt";

interface RequireAuthOptions {
  /** Permite continuar aunque el usuario tenga pendiente el cambio forzado de contraseña. */
  allowPasswordChangeRequired?: boolean;
}

export function requireAuth(
  req: NextRequest,
  options: RequireAuthOptions = {},
): AccessTokenPayload | NextResponse {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
  }

  if (payload.mustChangePassword && !options.allowPasswordChangeRequired) {
    return NextResponse.json({ error: "Debes actualizar tu contraseña antes de continuar." }, { status: 403 });
  }

  return payload;
}
