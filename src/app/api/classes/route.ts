import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

const CLASS_TYPES = new Set(["crossfit", "spinning", "yoga", "funcional", "boxeo", "hiit"]);

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? new Date(Date.now() - 30 * 86400_000).toISOString();
  const to = searchParams.get("to") ?? new Date(Date.now() + 60 * 86400_000).toISOString();
  const roomId = searchParams.get("roomId");
  const coachId = searchParams.get("coachId");
  const memberId = searchParams.get("memberId");

  const { rows } = await pool.query(
    `SELECT gc.id, gc.title, gc.start_at AS start, gc.end_at AS "end", gc.capacity, gc.type,
            gc.room_id AS "roomId", r.name AS room,
            gc.coach_id AS "coachId", COALESCE(co.first_name || ' ' || co.last_name, 'Sin asignar') AS coach,
            (SELECT count(*)::int FROM class_bookings cb WHERE cb.gym_class_id = gc.id AND cb.waitlisted = false) AS booked,
            (SELECT count(*)::int FROM class_bookings cb WHERE cb.gym_class_id = gc.id AND cb.waitlisted = true) AS waitlist,
            CASE WHEN $6::uuid IS NULL THEN NULL ELSE (
              SELECT CASE WHEN cb3.waitlisted THEN 'waitlisted' ELSE 'confirmed' END
              FROM class_bookings cb3 WHERE cb3.gym_class_id = gc.id AND cb3.member_id = $6
            ) END AS "memberBookingStatus"
     FROM gym_classes gc
     JOIN rooms r ON r.id = gc.room_id
     LEFT JOIN coaches co ON co.id = gc.coach_id
     WHERE gc.tenant_id = $1
       AND gc.start_at >= $2 AND gc.start_at <= $3
       AND ($4::uuid IS NULL OR gc.room_id = $4)
       AND ($5::uuid IS NULL OR gc.coach_id = $5)
       AND ($6::uuid IS NULL OR EXISTS (
         SELECT 1 FROM class_bookings cb2 WHERE cb2.gym_class_id = gc.id AND cb2.member_id = $6
       ))
     ORDER BY gc.start_at`,
    [auth.tenantId, from, to, roomId, coachId, memberId],
  );

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { title, roomId, coachId, type, start, end, capacity } = await req.json();
  if (!title || !roomId || !CLASS_TYPES.has(type) || !start || !end) {
    return NextResponse.json({ error: "Datos de clase inválidos." }, { status: 400 });
  }
  if (new Date(end) <= new Date(start)) {
    return NextResponse.json({ error: "La hora de fin debe ser posterior al inicio." }, { status: 400 });
  }

  const { rows: roomRows } = await pool.query(
    `SELECT name, capacity FROM rooms WHERE id = $1 AND tenant_id = $2`,
    [roomId, auth.tenantId],
  );
  if (roomRows.length === 0) {
    return NextResponse.json({ error: "Sala inválida." }, { status: 400 });
  }

  let coachName = "Sin asignar";
  if (coachId) {
    const { rows: coachRows } = await pool.query(
      `SELECT first_name, last_name FROM coaches WHERE id = $1 AND tenant_id = $2`,
      [coachId, auth.tenantId],
    );
    if (coachRows.length === 0) {
      return NextResponse.json({ error: "Coach inválido." }, { status: 400 });
    }
    coachName = `${coachRows[0].first_name} ${coachRows[0].last_name}`;
  }

  const finalCapacity = Number.isInteger(capacity) && capacity > 0 ? capacity : roomRows[0].capacity;

  const { rows } = await pool.query(
    `INSERT INTO gym_classes (tenant_id, title, coach_id, room, room_id, start_at, end_at, capacity, type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, title, start_at AS start, end_at AS "end", capacity, type,
               room_id AS "roomId", room, coach_id AS "coachId"`,
    [auth.tenantId, title, coachId || null, roomRows[0].name, roomId, start, end, finalCapacity, type],
  );

  return NextResponse.json({ ...rows[0], coach: coachName, booked: 0, waitlist: 0 }, { status: 201 });
}
