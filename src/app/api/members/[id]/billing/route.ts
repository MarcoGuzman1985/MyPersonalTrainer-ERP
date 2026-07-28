import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

async function assertMemberInTenant(memberId: string, tenantId: string) {
  const { rows } = await pool.query(
    `SELECT id FROM members WHERE id = $1 AND tenant_id = $2`,
    [memberId, tenantId],
  );
  return rows.length > 0;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!(await assertMemberInTenant(params.id, auth.tenantId))) {
    return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
  }

  const { rows } = await pool.query(
    `SELECT legal_name AS "legalName", tax_id AS "taxId",
            billing_email AS "billingEmail", address
     FROM member_billing_profiles WHERE member_id = $1`,
    [params.id],
  );

  return NextResponse.json(rows[0] ?? { legalName: "", taxId: "", billingEmail: "", address: "" });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!(await assertMemberInTenant(params.id, auth.tenantId))) {
    return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
  }

  const { legalName, taxId, billingEmail, address } = await req.json();

  const { rows } = await pool.query(
    `INSERT INTO member_billing_profiles (member_id, legal_name, tax_id, billing_email, address)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (member_id) DO UPDATE SET
       legal_name = EXCLUDED.legal_name, tax_id = EXCLUDED.tax_id,
       billing_email = EXCLUDED.billing_email, address = EXCLUDED.address
     RETURNING legal_name AS "legalName", tax_id AS "taxId",
               billing_email AS "billingEmail", address`,
    [params.id, legalName ?? "", taxId ?? "", billingEmail || null, address ?? ""],
  );

  return NextResponse.json(rows[0]);
}
