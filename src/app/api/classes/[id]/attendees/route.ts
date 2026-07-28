import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(
    `SELECT cb.id, m.id AS "memberId", m.name, m.avatar_url AS "avatarUrl", cb.waitlisted
     FROM class_bookings cb
     JOIN members m ON m.id = cb.member_id
     JOIN gym_classes gc ON gc.id = cb.gym_class_id
     WHERE cb.gym_class_id = $1 AND gc.tenant_id = $2
     ORDER BY cb.waitlisted ASC, cb.created_at ASC`,
    [params.id, auth.tenantId],
  );

  return NextResponse.json(rows);
}
