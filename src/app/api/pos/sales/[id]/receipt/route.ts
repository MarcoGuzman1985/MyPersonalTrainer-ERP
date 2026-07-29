import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { buildReceipt } from "@/lib/pos/receipt";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const receipt = await buildReceipt(params.id, auth);
  if (!receipt) {
    return NextResponse.json({ error: "Venta no encontrada." }, { status: 404 });
  }
  return NextResponse.json(receipt);
}
