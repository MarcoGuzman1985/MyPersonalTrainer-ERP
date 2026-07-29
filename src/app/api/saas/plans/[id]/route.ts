import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { platformTransaction } from "@/lib/db/tenantQuery";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { monthlyPrice, maxMembers, maxSeats } = await req.json();
  if (
    typeof monthlyPrice !== "number" ||
    !Number.isInteger(maxMembers) ||
    !Number.isInteger(maxSeats)
  ) {
    return NextResponse.json({ error: "Datos de plan inválidos." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE plan_definitions
     SET monthly_price = $1, max_members = $2, max_seats = $3
     WHERE id = $4
     RETURNING id, name, monthly_price AS "monthlyPrice", max_members AS "maxMembers",
               max_seats AS "maxSeats", features, highlighted`,
    [monthlyPrice, maxMembers, maxSeats, params.id],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ...rows[0], monthlyPrice: Number(rows[0].monthlyPrice) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { rows: activeRows } = await platformTransaction((client) => client.query(
    `SELECT count(*)::int AS count FROM tenants WHERE plan = $1 AND status = 'active'`,
    [params.id],
  ));
  if (activeRows[0].count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: ${activeRows[0].count} inquilino(s) activo(s) usan este plan.` },
      { status: 400 },
    );
  }

  try {
    const { rowCount } = await pool.query(`DELETE FROM plan_definitions WHERE id = $1`, [params.id]);
    if (rowCount === 0) {
      return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23503") {
      return NextResponse.json({ error: "El plan sigue en uso por otros inquilinos." }, { status: 400 });
    }
    throw err;
  }
}
