import { NextRequest, NextResponse } from "next/server";
import { tenantQuery, tenantTransaction } from "@/lib/db/tenantQuery";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { permissions } = await req.json();
  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: "`permissions` debe ser un array." }, { status: 400 });
  }

  const { rows: roleRows } = await tenantQuery(
    auth,
    `SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`,
    [params.id, auth.tenantId],
  );
  if (roleRows.length === 0) {
    return NextResponse.json({ error: "Rol no encontrado." }, { status: 404 });
  }

  try {
    await tenantTransaction(auth, async (client) => {
      await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [params.id]);
      for (const key of permissions) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_key) VALUES ($1, $2)`,
          [params.id, key],
        );
      }
    });
    return NextResponse.json({ id: params.id, permissions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error actualizando permisos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
