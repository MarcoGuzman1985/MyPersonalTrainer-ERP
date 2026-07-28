import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(
    `SELECT id, name, email, phone FROM members WHERE id = $1 AND tenant_id = $2`,
    [params.id, auth.tenantId],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
