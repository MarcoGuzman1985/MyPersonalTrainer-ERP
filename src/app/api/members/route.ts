import { NextRequest, NextResponse } from "next/server";
import { tenantQuery, tenantTransaction } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isMemberLimitReached } from "@/lib/plan/limits";

const LIST_QUERY = `
  SELECT
    m.id, m.name, m.email, m.phone, m.gender,
    m.birth_date::text AS "birthDate",
    m.avatar_url AS "avatarUrl",
    m.tags,
    m.created_at AS "createdAt",
    cs.obj AS subscription,
    COALESCE(ae.items, '[]'::json) AS anthropometrics,
    COALESCE(ar.items, '[]'::json) AS attendance,
    count(*) OVER()::int AS total_count
  FROM members m
  LEFT JOIN LATERAL (
    SELECT json_build_object(
      'plan', plan, 'status', status, 'startDate', start_date, 'endDate', end_date,
      'price', price, 'autoRenew', auto_renew, 'frozenUntil', frozen_until
    ) AS obj
    FROM member_subscriptions
    WHERE member_id = m.id AND is_current = true
    LIMIT 1
  ) cs ON true
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
      'id', id, 'date', date, 'weightKg', weight_kg,
      'bodyFatPct', body_fat_pct, 'muscleMassKg', muscle_mass_kg
    ) ORDER BY date ASC) AS items
    FROM anthropometric_entries
    WHERE member_id = m.id
  ) ae ON true
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object(
      'id', ar2.id, 'checkInAt', ar2.check_in_at,
      'classType', ar2.class_type, 'coach', su.name
    ) ORDER BY ar2.check_in_at DESC) AS items
    FROM attendance_records ar2
    LEFT JOIN staff_users su ON su.id = ar2.coach_id
    WHERE ar2.member_id = m.id
  ) ar ON true
  WHERE m.tenant_id = $1
    AND ($2::text IS NULL OR (m.name ILIKE '%'||$2||'%' OR m.email ILIKE '%'||$2||'%' OR m.phone ILIKE '%'||$2||'%'))
    AND ($3::text IS NULL OR (cs.obj->>'status') = $3::text)
  ORDER BY m.created_at DESC
  LIMIT $4 OFFSET $5
`;

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 50)));

  const { rows } = await tenantQuery(auth, LIST_QUERY, [
    auth.tenantId,
    search || null,
    status || null,
    pageSize,
    (page - 1) * pageSize,
  ]);

  const total = rows[0]?.total_count ?? 0;
  const data = rows.map(({ total_count, ...member }) => member);

  return NextResponse.json({ data, page, pageSize, total });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, email, phone, gender, birthDate, avatarUrl, tags, subscription } = body ?? {};

  if (!name || !email || !phone || !gender || !birthDate || !subscription) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }

  if (await isMemberLimitReached(auth)) {
    return NextResponse.json({ error: "Límite del plan alcanzado" }, { status: 403 });
  }

  try {
    const member = await tenantTransaction(auth, async (client) => {
      const { rows: memberRows } = await client.query(
        `INSERT INTO members (tenant_id, name, email, phone, gender, birth_date, avatar_url, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, name, email, phone, gender,
                   birth_date::text AS "birthDate",
                   avatar_url AS "avatarUrl", tags,
                   created_at AS "createdAt"`,
        [auth.tenantId, name, email, phone, gender, birthDate, avatarUrl ?? null, tags ?? []],
      );
      const member = memberRows[0];

      const { rows: subRows } = await client.query(
        `INSERT INTO member_subscriptions
           (member_id, plan, status, start_date, end_date, price, auto_renew, frozen_until, is_current)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, true)
         RETURNING plan, status,
                   start_date::text AS "startDate", end_date::text AS "endDate",
                   price, auto_renew AS "autoRenew",
                   frozen_until::text AS "frozenUntil"`,
        [
          member.id,
          subscription.plan,
          subscription.status,
          subscription.startDate,
          subscription.endDate,
          subscription.price,
          subscription.autoRenew ?? true,
          subscription.frozenUntil ?? null,
        ],
      );

      return { ...member, subscription: subRows[0], anthropometrics: [], attendance: [] };
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error creando el socio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
