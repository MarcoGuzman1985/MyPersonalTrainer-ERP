import { NextRequest, NextResponse } from "next/server";
import { tenantQuery } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";

const SELECT_FIELDS = `
  id, first_name AS "firstName", last_name AS "lastName",
  (first_name || ' ' || last_name) AS name,
  dob::text AS dob, phone, address, email,
  anthropometric_data AS "anthropometricData"
`;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { firstName, lastName, dob, phone, address, email, anthropometricData } = await req.json();
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Nombre y apellido son requeridos." }, { status: 400 });
  }

  const { rows } = await tenantQuery(
    auth,
    `UPDATE coaches SET
       first_name = $1, last_name = $2, dob = $3, phone = $4,
       address = $5, email = $6, anthropometric_data = $7
     WHERE id = $8 AND tenant_id = $9
     RETURNING ${SELECT_FIELDS}`,
    [firstName, lastName, dob || null, phone || null, address || null, email || null,
     JSON.stringify(anthropometricData ?? {}), params.id, auth.tenantId],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Coach no encontrado." }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { rowCount } = await tenantQuery(
      auth,
      `DELETE FROM coaches WHERE id = $1 AND tenant_id = $2`,
      [params.id, auth.tenantId],
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: "Coach no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23503") {
      return NextResponse.json({ error: "El coach tiene clases asignadas; no se puede eliminar." }, { status: 400 });
    }
    throw err;
  }
}
