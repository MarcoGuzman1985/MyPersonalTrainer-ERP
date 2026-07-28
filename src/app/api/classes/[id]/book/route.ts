import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/requirePermission";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const perm = requirePermission(auth, "agenda.reservar");
  if (perm) return perm;

  const { memberId } = await req.json();
  if (!memberId) {
    return NextResponse.json({ error: "Falta memberId." }, { status: 400 });
  }

  try {
    const result = await withTransaction(async (client) => {
      const { rows: memberRows } = await client.query(
        `SELECT id FROM members WHERE id = $1 AND tenant_id = $2`,
        [memberId, auth.tenantId],
      );
      if (memberRows.length === 0) throw new Error("El socio no pertenece a este tenant.");

      // Bloquea la fila de la clase para serializar reservas concurrentes
      // (evita que dos requests simultáneos pasen el chequeo de aforo a la vez).
      const { rows: classRows } = await client.query(
        `SELECT gc.id, gc.start_at, gc.end_at, r.capacity AS room_capacity
         FROM gym_classes gc
         JOIN rooms r ON r.id = gc.room_id
         WHERE gc.id = $1 AND gc.tenant_id = $2
         FOR UPDATE OF gc`,
        [params.id, auth.tenantId],
      );
      if (classRows.length === 0) throw new Error("Clase no encontrada.");
      const cls = classRows[0];

      const { rows: conflictRows } = await client.query(
        `SELECT 1 FROM class_bookings cb
         JOIN gym_classes gc2 ON gc2.id = cb.gym_class_id
         WHERE cb.member_id = $1 AND cb.waitlisted = false
           AND gc2.tenant_id = $2 AND gc2.id != $3
           AND gc2.start_at < $4 AND gc2.end_at > $5
         LIMIT 1`,
        [memberId, auth.tenantId, params.id, cls.end_at, cls.start_at],
      );
      if (conflictRows.length > 0) {
        return { conflict: true } as const;
      }

      const { rows: confirmedRows } = await client.query(
        `SELECT count(*)::int AS confirmed FROM class_bookings WHERE gym_class_id = $1 AND waitlisted = false`,
        [params.id],
      );
      const waitlisted = confirmedRows[0].confirmed >= cls.room_capacity;

      const { rows: insertedRows } = await client.query(
        `INSERT INTO class_bookings (gym_class_id, member_id, waitlisted)
         VALUES ($1, $2, $3)
         ON CONFLICT (gym_class_id, member_id) DO NOTHING
         RETURNING id`,
        [params.id, memberId, waitlisted],
      );
      if (insertedRows.length === 0) {
        return { alreadyBooked: true } as const;
      }

      return { status: waitlisted ? "waitlisted" : "confirmed" } as const;
    });

    if ("conflict" in result) {
      return NextResponse.json(
        { error: "El socio ya tiene una clase reservada en ese horario." },
        { status: 409 },
      );
    }
    if ("alreadyBooked" in result) {
      return NextResponse.json({ error: "El socio ya tiene una reserva para esta clase." }, { status: 409 });
    }

    return NextResponse.json({ status: result.status }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo procesar la reserva.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
