import { NextRequest, NextResponse } from "next/server";
import { tenantQuery } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows: staffRows } = await tenantQuery(
    auth,
    `SELECT
       count(*) FILTER (WHERE status = 'active') AS active_users,
       count(*) FILTER (WHERE status = 'invited') AS pending_invites
     FROM staff_users WHERE tenant_id = $1`,
    [auth.tenantId],
  );
  const { rows: roleRows } = await tenantQuery(
    auth,
    `SELECT count(*) AS roles_count FROM roles WHERE tenant_id = $1`,
    [auth.tenantId],
  );

  return NextResponse.json({
    activeUsers: Number(staffRows[0].active_users),
    rolesCount: Number(roleRows[0].roles_count),
    pendingInvites: Number(staffRows[0].pending_invites),
  });
}
