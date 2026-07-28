import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";

// Catálogo global de permisos (no depende del tenant), pero igual se exige sesión válida.
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rows } = await pool.query(`
    SELECT pm.key, pm.label,
      COALESCE(
        json_agg(json_build_object('key', pa.key, 'label', pa.label) ORDER BY pa.key)
        FILTER (WHERE pa.key IS NOT NULL),
        '[]'
      ) AS actions
    FROM permission_modules pm
    LEFT JOIN permission_actions pa ON pa.module_key = pm.key
    GROUP BY pm.key, pm.label
    ORDER BY pm.key
  `);

  return NextResponse.json(rows);
}
