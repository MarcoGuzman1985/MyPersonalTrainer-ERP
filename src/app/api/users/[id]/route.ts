import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/requirePermission";

const STATUSES = new Set(["active", "invited", "disabled"]);

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const perm = requirePermission(auth, "config.usuarios");
  if (perm) return perm;

  const { name, email, roleId, status } = await req.json();

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (name !== undefined) { sets.push(`name = $${i++}`); values.push(name); }
  if (email !== undefined) { sets.push(`email = $${i++}`); values.push(email); }
  if (roleId !== undefined) {
    const { rows } = await pool.query(`SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`, [roleId, auth.tenantId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "El rol no existe para este tenant." }, { status: 400 });
    }
    sets.push(`role_id = $${i++}`); values.push(roleId);
  }
  if (status !== undefined) {
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    sets.push(`status = $${i++}`); values.push(status);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  values.push(params.id, auth.tenantId);

  try {
    const { rows } = await pool.query(
      `UPDATE staff_users SET ${sets.join(", ")}
       WHERE id = $${i++} AND tenant_id = $${i}
       RETURNING id, name, email, avatar_url AS "avatarUrl", role_id AS "roleId", status, last_active_at AS "lastActiveAt"`,
      values,
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const { rows: roleRows } = await pool.query(`SELECT name FROM roles WHERE id = $1`, [rows[0].roleId]);

    return NextResponse.json({ ...rows[0], roleName: roleRows[0]?.name ?? "" });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Ya existe otro usuario con ese correo en el tenant." }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const perm = requirePermission(auth, "config.usuarios");
  if (perm) return perm;

  if (params.id === auth.sub) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  // Borrado lógico: nunca se elimina la fila para no romper auditoría/ventas
  // históricas que referencian a este staff_user.
  const { rowCount } = await pool.query(
    `UPDATE staff_users SET status = 'disabled' WHERE id = $1 AND tenant_id = $2`,
    [params.id, auth.tenantId],
  );

  if (rowCount === 0) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
