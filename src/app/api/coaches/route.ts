import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

const SELECT_FIELDS = `
  id, first_name AS "firstName", last_name AS "lastName",
  (first_name || ' ' || last_name) AS name,
  dob::text AS dob, phone, address, email,
  anthropometric_data AS "anthropometricData"
`;

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM coaches WHERE tenant_id = $1 ORDER BY first_name, last_name`,
    [auth.tenantId],
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { firstName, lastName, dob, phone, address, email, anthropometricData } = await req.json();
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Nombre y apellido son requeridos." }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO coaches (tenant_id, first_name, last_name, dob, phone, address, email, anthropometric_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${SELECT_FIELDS}`,
    [auth.tenantId, firstName, lastName, dob || null, phone || null, address || null, email || null,
     JSON.stringify(anthropometricData ?? {})],
  );

  return NextResponse.json(rows[0], { status: 201 });
}
