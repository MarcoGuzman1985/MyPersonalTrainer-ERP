import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(`
    SELECT id, name, monthly_price AS "monthlyPrice", max_members AS "maxMembers",
           max_seats AS "maxSeats", features, highlighted
    FROM plan_definitions
    ORDER BY monthly_price ASC
  `);

  return NextResponse.json(rows.map((r) => ({ ...r, monthlyPrice: Number(r.monthlyPrice) })));
}

const ID_FORMAT = /^[a-z0-9][a-z0-9-]{1,49}$/;

export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { id, name, monthlyPrice, maxMembers, maxSeats, features, highlighted } = await req.json();

  if (!ID_FORMAT.test(id ?? "")) {
    return NextResponse.json({ error: "ID inválido (minúsculas, números y guiones, 2-50 chars)." }, { status: 400 });
  }
  if (!name || typeof monthlyPrice !== "number" || !Number.isInteger(maxMembers) || !Number.isInteger(maxSeats)) {
    return NextResponse.json({ error: "Datos de plan inválidos." }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO plan_definitions (id, name, monthly_price, max_members, max_seats, features, highlighted)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, monthly_price AS "monthlyPrice", max_members AS "maxMembers",
                 max_seats AS "maxSeats", features, highlighted`,
      [id, name, monthlyPrice, maxMembers, maxSeats, JSON.stringify(features ?? []), Boolean(highlighted)],
    );
    return NextResponse.json({ ...rows[0], monthlyPrice: Number(rows[0].monthlyPrice) }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Ya existe un plan con ese ID." }, { status: 409 });
    }
    throw err;
  }
}
