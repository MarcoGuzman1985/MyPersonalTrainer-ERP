import { NextRequest, NextResponse } from "next/server";
import { platformTransaction } from "@/lib/db/tenantQuery";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

const PROVIDERS = ["google_calendar", "meta", "whatsapp", "gemini"] as const;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await platformTransaction((client) => client.query(
    `SELECT provider, credentials, is_active AS "isActive"
     FROM tenant_integrations WHERE tenant_id = $1`,
    [params.id],
  ));
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  const result = PROVIDERS.map((provider) => ({
    provider,
    credentials: byProvider.get(provider)?.credentials ?? {},
    isActive: byProvider.get(provider)?.isActive ?? false,
  }));

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const { provider, credentials, isActive } = await req.json();
  if (!PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Proveedor inválido." }, { status: 400 });
  }
  if (typeof credentials !== "object" || credentials === null) {
    return NextResponse.json({ error: "credentials debe ser un objeto JSON." }, { status: 400 });
  }

  const row = await platformTransaction(async (client) => {
    const { rows: tenantRows } = await client.query(`SELECT id FROM tenants WHERE id = $1`, [params.id]);
    if (tenantRows.length === 0) return null;

    const { rows } = await client.query(
      `INSERT INTO tenant_integrations (tenant_id, provider, credentials, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, provider) DO UPDATE SET
         credentials = EXCLUDED.credentials, is_active = EXCLUDED.is_active
       RETURNING provider, credentials, is_active AS "isActive"`,
      [params.id, provider, JSON.stringify(credentials), Boolean(isActive)],
    );
    return rows[0];
  });

  if (!row) {
    return NextResponse.json({ error: "Inquilino no encontrado." }, { status: 404 });
  }

  return NextResponse.json(row);
}
