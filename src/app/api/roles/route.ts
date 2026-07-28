import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(
    `SELECT r.id, r.name, r.description, r.is_system AS "isSystem",
       COALESCE(array_agg(rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL), '{}') AS permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     WHERE r.tenant_id = $1
     GROUP BY r.id
     ORDER BY r.created_at ASC`,
    [auth.tenantId],
  );

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { name, description } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "El nombre del rol es requerido." }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO roles (tenant_id, name, description, is_system)
       VALUES ($1, $2, $3, false)
       RETURNING id, name, description, is_system AS "isSystem"`,
      [auth.tenantId, name, description ?? ""],
    );
    return NextResponse.json({ ...rows[0], permissions: [] }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre." }, { status: 409 });
    }
    throw err;
  }
}
