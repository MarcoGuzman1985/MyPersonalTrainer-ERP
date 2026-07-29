import { NextRequest, NextResponse } from "next/server";
import { tenantQuery } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { name, capacity, status, notes } = await req.json();
  if (!name || !Number.isInteger(capacity) || capacity <= 0) {
    return NextResponse.json({ error: "Datos de sala inválidos." }, { status: 400 });
  }

  const { rows } = await tenantQuery(
    auth,
    `UPDATE rooms SET name = $1, capacity = $2, status = $3, notes = $4
     WHERE id = $5 AND tenant_id = $6
     RETURNING id, name, capacity, status, notes`,
    [name, capacity, status === "maintenance" ? "maintenance" : "active", notes || null, params.id, auth.tenantId],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Sala no encontrada." }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { rowCount } = await tenantQuery(
      auth,
      `DELETE FROM rooms WHERE id = $1 AND tenant_id = $2`,
      [params.id, auth.tenantId],
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: "Sala no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23503") {
      return NextResponse.json({ error: "La sala tiene clases asociadas; no se puede eliminar." }, { status: 400 });
    }
    throw err;
  }
}
