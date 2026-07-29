import { NextRequest, NextResponse } from "next/server";
import { platformTransaction } from "@/lib/db/tenantQuery";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await platformTransaction((client) => client.query(`
    SELECT
      COALESCE(SUM(monthly_price) FILTER (WHERE status = 'active'), 0) AS mrr,
      COUNT(*) FILTER (WHERE status = 'active') AS active_tenants,
      COUNT(*) FILTER (WHERE status = 'trial') AS trials,
      COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_tenants,
      COUNT(*) AS total_tenants
    FROM tenants
  `));

  const r = rows[0];
  const total = Number(r.total_tenants);

  return NextResponse.json({
    mrr: Number(r.mrr),
    mrrDelta: 0,
    activeTenants: Number(r.active_tenants),
    activeTenantsDelta: 0,
    trials: Number(r.trials),
    churnRate: total > 0 ? Number(((Number(r.suspended_tenants) / total) * 100).toFixed(1)) : 0,
  });
}
