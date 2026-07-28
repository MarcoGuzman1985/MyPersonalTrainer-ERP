import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(
    `SELECT pd.max_members AS "membersLimit", pd.max_seats AS "seatsLimit",
            (SELECT count(*)::int FROM members WHERE tenant_id = t.id) AS "membersUsed",
            (SELECT count(*)::int FROM staff_users
             WHERE tenant_id = t.id AND status IN ('active', 'invited')) AS "seatsUsed"
     FROM tenants t
     JOIN plan_definitions pd ON pd.id = t.plan
     WHERE t.id = $1`,
    [auth.tenantId],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Tenant no encontrado." }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
