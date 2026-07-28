import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m";

export interface AccessTokenPayload {
  sub: string; // staff_user_id
  tenantId: string;
  role: string;
  permissions: string[];
  mustChangePassword: boolean;
}

function secret() {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error("Falta JWT_ACCESS_SECRET en el entorno.");
  return s;
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, secret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, secret()) as AccessTokenPayload;
}
