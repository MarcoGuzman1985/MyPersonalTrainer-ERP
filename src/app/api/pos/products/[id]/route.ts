import { NextRequest, NextResponse } from "next/server";
import { tenantQuery } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { name, price, stock } = await req.json();
  if (!name || typeof price !== "number" || price < 0) {
    return NextResponse.json({ error: "Datos de producto inválidos." }, { status: 400 });
  }

  const { rows } = await tenantQuery(
    auth,
    `UPDATE products SET name = $1, price = $2, stock = $3
     WHERE id = $4 AND tenant_id = $5
     RETURNING id, name, price, category, kind, stock`,
    [name, price, stock ?? null, params.id, auth.tenantId],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ...rows[0], price: Number(rows[0].price) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rowCount } = await tenantQuery(
    auth,
    `UPDATE products SET is_active = false WHERE id = $1 AND tenant_id = $2`,
    [params.id, auth.tenantId],
  );

  if (rowCount === 0) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
