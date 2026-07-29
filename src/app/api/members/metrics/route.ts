import { NextRequest, NextResponse } from "next/server";
import { tenantQuery } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await tenantQuery(
    auth,
    `
    SELECT
      count(*) FILTER (WHERE cs.status = 'active') AS active,
      count(*) FILTER (WHERE cs.status = 'active' AND cs.end_date <= (now()::date + interval '7 days')) AS expiring_this_week,
      count(*) FILTER (WHERE cs.status = 'frozen') AS frozen,
      count(*) FILTER (WHERE m.created_at >= date_trunc('month', now())) AS new_this_month
    FROM members m
    LEFT JOIN LATERAL (
      SELECT status, end_date FROM member_subscriptions
      WHERE member_id = m.id AND is_current = true LIMIT 1
    ) cs ON true
    WHERE m.tenant_id = $1
    `,
    [auth.tenantId],
  );

  const r = rows[0];
  return NextResponse.json({
    active: Number(r.active),
    activeDelta: 0,
    expiringThisWeek: Number(r.expiring_this_week),
    frozen: Number(r.frozen),
    newThisMonth: Number(r.new_this_month),
    newThisMonthDelta: 0,
  });
}
