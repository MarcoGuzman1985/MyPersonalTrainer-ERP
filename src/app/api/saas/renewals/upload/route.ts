import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { tenantQuery } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData();
  const file = form.get("receipt");
  const amount = Number(form.get("amount"));

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Falta el archivo del comprobante." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Monto inválido." }, { status: 400 });
  }

  // TODO: Integrar subida a Google Drive API mediante Service Account.
  const receiptUrl = `https://drive.placeholder.internal/receipts/${randomUUID()}-${encodeURIComponent(file.name)}`;

  const { rows } = await tenantQuery(
    auth,
    `INSERT INTO subscription_renewals (tenant_id, amount, receipt_url)
     VALUES ($1, $2, $3)
     RETURNING id, amount, receipt_url AS "receiptUrl", status, created_at AS "createdAt"`,
    [auth.tenantId, amount, receiptUrl],
  );

  return NextResponse.json({ ...rows[0], amount: Number(rows[0].amount) }, { status: 201 });
}
