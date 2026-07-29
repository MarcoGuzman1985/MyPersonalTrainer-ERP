import { NextRequest, NextResponse } from "next/server";
import { tenantQuery } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await tenantQuery(
    auth,
    `SELECT id, amount, receipt_url AS "receiptUrl", status, created_at AS "createdAt"
     FROM subscription_renewals
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [auth.tenantId],
  );

  return NextResponse.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
}
