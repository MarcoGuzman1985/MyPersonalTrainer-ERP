import { NextRequest, NextResponse } from "next/server";
import { platformTransaction } from "@/lib/db/tenantQuery";

// Endpoint de servidor-a-servidor (n8n), no usa JWT de usuario: se protege
// con un token estático compartido vía header.
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-webhook-token");
  if (!token || token !== process.env.CRON_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // El primer staff_user creado en el tenant es su dueño (así se crea el
  // registro en POST /api/saas/tenants), de ahí se toma el contacto.
  const { rows } = await platformTransaction((client) => client.query(`
    SELECT t.id AS "tenantId", t.name AS "gymName", t.owner AS "ownerName",
           t.plan, t.renews_at AS "renewsAt",
           owner_staff.email AS "ownerEmail"
    FROM tenants t
    LEFT JOIN LATERAL (
      SELECT email FROM staff_users
      WHERE tenant_id = t.id
      ORDER BY created_at ASC
      LIMIT 1
    ) owner_staff ON true
    WHERE t.renews_at::date = (current_date + 10)
    ORDER BY t.renews_at ASC
  `));

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    count: rows.length,
    tenants: rows,
  });
}
