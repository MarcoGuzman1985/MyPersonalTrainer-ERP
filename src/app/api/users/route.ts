import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/requirePermission";
import { isSeatLimitReached } from "@/lib/plan/limits";
import { hashPassword } from "@/lib/auth/password";
import { generateTempPassword } from "@/lib/auth/tempPassword";
import { sendMail } from "@/lib/mail/sendMail";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(
    `SELECT su.id, su.name, su.email, su.avatar_url AS "avatarUrl",
            su.role_id AS "roleId", r.name AS "roleName", su.status,
            su.last_active_at AS "lastActiveAt"
     FROM staff_users su
     JOIN roles r ON r.id = su.role_id
     WHERE su.tenant_id = $1
     ORDER BY su.created_at DESC`,
    [auth.tenantId],
  );

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const perm = requirePermission(auth, "config.usuarios");
  if (perm) return perm;

  const { name, email, roleId } = await req.json();
  if (!name || !email || !roleId) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }

  const { rows: roleRows } = await pool.query(
    `SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`,
    [roleId, auth.tenantId],
  );
  if (roleRows.length === 0) {
    return NextResponse.json({ error: "El rol no existe para este tenant." }, { status: 400 });
  }

  if (await isSeatLimitReached(auth.tenantId)) {
    return NextResponse.json({ error: "Límite del plan alcanzado" }, { status: 403 });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  try {
    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO staff_users (tenant_id, name, email, role_id, status, password_hash, force_password_change)
         VALUES ($1, $2, $3, $4, 'invited', $5, true)
         RETURNING id, name, email, avatar_url, role_id, status, last_active_at
       )
       SELECT inserted.id, inserted.name, inserted.email,
              inserted.avatar_url AS "avatarUrl",
              inserted.role_id AS "roleId", r.name AS "roleName",
              inserted.status, inserted.last_active_at AS "lastActiveAt"
       FROM inserted JOIN roles r ON r.id = inserted.role_id`,
      [auth.tenantId, name, email, roleId, passwordHash],
    );

    let emailSent = true;
    try {
      await sendMail(
        email,
        "Tu acceso a MyPersonalTrainer ERP",
        `<p>Se creó tu cuenta en MyPersonalTrainer ERP con el rol <b>${rows[0].roleName}</b>.</p>
         <p>Correo: <b>${email}</b></p>
         <p>Contraseña temporal: <b style="font-family:monospace;font-size:16px">${tempPassword}</b></p>
         <p>Deberás cambiarla al iniciar sesión por primera vez.</p>`,
      );
    } catch (err) {
      emailSent = false;
      console.error("No se pudo enviar el correo de invitación:", err);
    }

    return NextResponse.json({ ...rows[0], tempPassword, emailSent }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Ya existe otro usuario con ese correo en el tenant." }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Error invitando al usuario.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
