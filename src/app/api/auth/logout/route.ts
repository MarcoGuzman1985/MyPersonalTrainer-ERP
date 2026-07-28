import { NextRequest, NextResponse } from "next/server";
import { revokeRefreshToken } from "@/lib/auth/refreshTokens";

const REFRESH_COOKIE = "mpt_refresh";

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (rawToken) await revokeRefreshToken(rawToken);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
