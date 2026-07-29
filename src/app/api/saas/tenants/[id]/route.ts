import { NextRequest, NextResponse } from "next/server";
import { platformTransaction } from "@/lib/db/tenantQuery";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

const STATUSES = new Set(["active", "trial", "past_due", "suspended"]);

const TENANT_SELECT = `
  SELECT t.id, t.name, t.owner, t.plan, t.status,
         t.monthly_price AS mrr, t.seats, t.metadata,
         t.created_at AS "createdAt", t.renews_at AS "renewsAt",
         (SELECT count(*)::int FROM members m WHERE m.tenant_id = t.id) AS members,
         (SELECT email FROM staff_users su WHERE su.tenant_id = t.id ORDER BY su.created_at ASC LIMIT 1) AS "ownerEmail"
  FROM tenants t
  WHERE t.id = $1
`;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { status, owner, ownerEmail, plan, monthlyPrice, metadata } = await req.json();

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (status !== undefined) {
    if (!STATUSES.has(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    sets.push(`status = $${i++}`);
    values.push(status);
  }
  if (owner !== undefined) {
    sets.push(`owner = $${i++}`);
    values.push(owner);
  }

  try {
    const result = await platformTransaction(async (client) => {
      if (plan !== undefined) {
        const { rows } = await client.query(`SELECT id FROM plan_definitions WHERE id = $1`, [plan]);
        if (rows.length === 0) {
          return { error: "Plan inválido.", status: 400 } as const;
        }
        sets.push(`plan = $${i++}`);
        values.push(plan);
      }
      if (monthlyPrice !== undefined) {
        sets.push(`monthly_price = $${i++}`);
        values.push(monthlyPrice);
      }
      if (metadata !== undefined) {
        sets.push(`metadata = $${i++}`);
        values.push(JSON.stringify(metadata));
      }

      if (sets.length === 0 && ownerEmail === undefined) {
        return { error: "Nada que actualizar.", status: 400 } as const;
      }

      if (sets.length > 0) {
        values.push(params.id);
        const { rowCount } = await client.query(
          `UPDATE tenants SET ${sets.join(", ")} WHERE id = $${i}`,
          values,
        );
        if (rowCount === 0) {
          return { error: "Inquilino no encontrado.", status: 404 } as const;
        }
      }

      if (ownerEmail !== undefined) {
        const { rows: ownerRows } = await client.query(
          `SELECT id FROM staff_users WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [params.id],
        );
        if (ownerRows.length === 0) {
          return { error: "El inquilino no tiene un usuario dueño.", status: 404 } as const;
        }
        try {
          await client.query(`UPDATE staff_users SET email = $1 WHERE id = $2`, [ownerEmail, ownerRows[0].id]);
        } catch (err: unknown) {
          if ((err as { code?: string }).code === "23505") {
            return { error: "Ya existe otro usuario con ese correo en el tenant.", status: 400 } as const;
          }
          throw err;
        }
      }

      const { rows } = await client.query(TENANT_SELECT, [params.id]);
      if (rows.length === 0) {
        return { error: "Inquilino no encontrado.", status: 404 } as const;
      }

      return { tenant: rows[0] } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ...result.tenant, mrr: Number(result.tenant.mrr) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error actualizando el inquilino.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
