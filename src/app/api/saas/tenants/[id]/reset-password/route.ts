import { NextRequest, NextResponse } from "next/server";
import { platformTransaction } from "@/lib/db/tenantQuery";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { hashPassword } from "@/lib/auth/password";
import { sendMail } from "@/lib/mail/sendMail";
import { generateTempPassword } from "@/lib/auth/tempPassword";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const tempPassword: string = body.tempPassword && String(body.tempPassword).length >= 8
    ? String(body.tempPassword)
    : generateTempPassword();

  const passwordHash = await hashPassword(tempPassword);

  const owner = await platformTransaction(async (client) => {
    const { rows: ownerRows } = await client.query(
      `SELECT id, email FROM staff_users
       WHERE tenant_id = $1
       ORDER BY created_at ASC
       LIMIT 1`,
      [params.id],
    );
    const owner = ownerRows[0];
    if (!owner) return null;

    await client.query(
      `UPDATE staff_users SET password_hash = $1, force_password_change = true WHERE id = $2`,
      [passwordHash, owner.id],
    );
    await client.query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE staff_user_id = $1 AND revoked_at IS NULL`,
      [owner.id],
    );
    return owner;
  });

  if (!owner) {
    return NextResponse.json({ error: "El inquilino no tiene un usuario dueño." }, { status: 404 });
  }

  let emailSent = true;
  try {
    await sendMail(
      owner.email,
      "Tu contraseña temporal de MyPersonalTrainer ERP",
      `<p>Se generó una contraseña temporal para tu cuenta:</p>
       <p style="font-family:monospace;font-size:16px"><b>${tempPassword}</b></p>
       <p>Deberás cambiarla al iniciar sesión.</p>`,
    );
  } catch (err) {
    emailSent = false;
    console.error("No se pudo enviar el correo de reset:", err);
  }

  return NextResponse.json({ ownerEmail: owner.email, tempPassword, emailSent });
}
