import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/requirePermission";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(
    `SELECT id, name, capacity, status, notes FROM rooms WHERE tenant_id = $1 ORDER BY name`,
    [auth.tenantId],
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const perm = requirePermission(auth, "agenda.gestionar");
  if (perm) return perm;

  const { name, capacity, status, notes } = await req.json();
  if (!name || !Number.isInteger(capacity) || capacity <= 0) {
    return NextResponse.json({ error: "Datos de sala inválidos." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO rooms (tenant_id, name, capacity, status, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, capacity, status, notes`,
    [auth.tenantId, name, capacity, status === "maintenance" ? "maintenance" : "active", notes || null],
  );

  return NextResponse.json(rows[0], { status: 201 });
}
