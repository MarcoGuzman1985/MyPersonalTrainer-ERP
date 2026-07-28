import { NextRequest, NextResponse } from "next/server";
import { pool, withTransaction } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { hashPassword } from "@/lib/auth/password";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(`
    SELECT t.id, t.name, t.owner, t.plan, t.status,
           t.monthly_price AS mrr, t.seats, t.metadata,
           t.created_at AS "createdAt", t.renews_at AS "renewsAt",
           (SELECT count(*)::int FROM members m WHERE m.tenant_id = t.id) AS members,
           (SELECT email FROM staff_users su WHERE su.tenant_id = t.id ORDER BY su.created_at ASC LIMIT 1) AS "ownerEmail"
    FROM tenants t
    ORDER BY t.created_at DESC
  `);

  return NextResponse.json(rows.map((r) => ({ ...r, mrr: Number(r.mrr) })));
}

export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { gymName, ownerName, ownerEmail, tempPassword, plan, trialDays } = await req.json();
  if (!gymName || !ownerName || !ownerEmail || !tempPassword || !plan) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }
  const trialDaysNum = Number(trialDays);
  if (!Number.isInteger(trialDaysNum) || trialDaysNum < 0 || trialDaysNum > 365) {
    return NextResponse.json({ error: "Días de prueba inválidos (0-365)." }, { status: 400 });
  }

  try {
    const tenant = await withTransaction(async (client) => {
      const { rows: planRows } = await client.query(
        `SELECT monthly_price FROM plan_definitions WHERE id = $1`,
        [plan],
      );
      if (planRows.length === 0) throw new Error("Plan inválido.");
      const monthlyPrice = planRows[0].monthly_price;

      const { rows: tenantRows } = await client.query(
        `INSERT INTO tenants (name, owner, plan, status, monthly_price, seats, renews_at)
         VALUES ($1, $2, $3, 'trial', $4, 1, now() + make_interval(days => $5))
         RETURNING id, name, owner, plan, status, monthly_price AS mrr, seats, metadata,
                   created_at AS "createdAt", renews_at AS "renewsAt"`,
        [gymName, ownerName, plan, monthlyPrice, trialDaysNum],
      );
      const tenant = tenantRows[0];

      await client.query(
        `INSERT INTO tenant_settings (tenant_id, currency, locale) VALUES ($1, 'USD', 'es-ES')`,
        [tenant.id],
      );

      const { rows: roleRows } = await client.query(
        `INSERT INTO roles (tenant_id, name, description, is_system)
         VALUES ($1, 'Superadministrador', 'Acceso total a todos los módulos del gimnasio.', true)
         RETURNING id`,
        [tenant.id],
      );
      const roleId = roleRows[0].id;

      const { rows: permissionRows } = await client.query(`SELECT key FROM permission_actions`);
      for (const p of permissionRows) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2)`,
          [roleId, p.key],
        );
      }

      const passwordHash = await hashPassword(tempPassword);
      await client.query(
        `INSERT INTO staff_users (tenant_id, name, email, role_id, status, password_hash, is_platform_admin)
         VALUES ($1, $2, $3, $4, 'active', $5, false)`,
        [tenant.id, ownerName, ownerEmail, roleId, passwordHash],
      );

      return { ...tenant, mrr: Number(tenant.mrr), members: 0, ownerEmail };
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el inquilino.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
