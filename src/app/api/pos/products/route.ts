import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

const KINDS = new Set(["product", "membership", "service"]);

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(
    `SELECT id, name, price, category, kind, stock
     FROM products
     WHERE tenant_id = $1 AND is_active = true
     ORDER BY category, name`,
    [auth.tenantId],
  );

  return NextResponse.json(rows.map((r) => ({ ...r, price: Number(r.price) })));
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { name, category, kind, price, stock, sku } = await req.json();
  if (!name || !category || !KINDS.has(kind) || typeof price !== "number" || price < 0) {
    return NextResponse.json({ error: "Datos de producto inválidos." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO products (tenant_id, sku, name, category, kind, price, stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, price, category, kind, stock`,
    [auth.tenantId, sku || null, name, category, kind, price, stock ?? null],
  );

  return NextResponse.json({ ...rows[0], price: Number(rows[0].price) }, { status: 201 });
}
