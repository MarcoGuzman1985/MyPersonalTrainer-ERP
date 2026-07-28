import { pool } from "@/lib/db";

export async function isMemberLimitReached(tenantId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT pd.max_members AS "maxMembers",
            (SELECT count(*)::int FROM members WHERE tenant_id = $1) AS "currentCount"
     FROM tenants t
     JOIN plan_definitions pd ON pd.id = t.plan
     WHERE t.id = $1`,
    [tenantId],
  );
  if (rows.length === 0) return false;
  return rows[0].currentCount >= rows[0].maxMembers;
}

export async function isSeatLimitReached(tenantId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT pd.max_seats AS "maxSeats",
            (SELECT count(*)::int FROM staff_users
             WHERE tenant_id = $1 AND status IN ('active', 'invited')) AS "currentCount"
     FROM tenants t
     JOIN plan_definitions pd ON pd.id = t.plan
     WHERE t.id = $1`,
    [tenantId],
  );
  if (rows.length === 0) return false;
  return rows[0].currentCount >= rows[0].maxSeats;
}
