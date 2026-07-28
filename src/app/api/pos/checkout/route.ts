import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/requirePermission";
import { buildReceipt } from "@/lib/pos/receipt";
import { sendMail } from "@/lib/mail/sendMail";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_METHODS = new Set(["cash", "card", "transfer", "wallet"]);

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const perm = requirePermission(auth, "pos.cobrar");
  if (perm) return perm;

  const { customerId, paymentMethod, lines } = await req.json();

  if (!PAYMENT_METHODS.has(paymentMethod)) {
    return NextResponse.json({ error: "Método de pago inválido." }, { status: 400 });
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "El ticket está vacío." }, { status: 400 });
  }

  try {
    const saleId = await withTransaction(async (client) => {
      if (customerId) {
        const { rows } = await client.query(
          `SELECT id FROM members WHERE id = $1 AND tenant_id = $2`,
          [customerId, auth.tenantId],
        );
        if (rows.length === 0) throw new Error("El cliente no pertenece a este tenant.");
      }

      const productIds: string[] = lines.map((l: { productId: string }) => l.productId);
      const { rows: products } = await client.query(
        `SELECT id, name, price, stock FROM products
         WHERE id = ANY($1::uuid[]) AND tenant_id = $2
         FOR UPDATE`,
        [productIds, auth.tenantId],
      );
      const byId = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      for (const line of lines) {
        const product = byId.get(line.productId);
        if (!product) throw new Error(`Producto no encontrado: ${line.productId}`);
        if (!Number.isInteger(line.qty) || line.qty <= 0) throw new Error("Cantidad inválida.");
        if (product.stock !== null && product.stock < line.qty) {
          throw new Error(`Stock insuficiente para "${product.name}" (disponible: ${product.stock}).`);
        }
        subtotal += Number(product.price) * line.qty;
      }

      const { rows: settingsRows } = await client.query(
        `SELECT tax_rate FROM tenant_settings WHERE tenant_id = $1`,
        [auth.tenantId],
      );
      const taxRate = Number(settingsRows[0]?.tax_rate ?? 0);
      const total = subtotal + subtotal * taxRate;

      const { rows: saleRows } = await client.query(
        `INSERT INTO sales (tenant_id, member_id, staff_user_id, payment_method, subtotal, tax_rate, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [auth.tenantId, customerId ?? null, auth.sub, paymentMethod, subtotal, taxRate, total],
      );
      const saleId = saleRows[0].id;

      for (const line of lines) {
        const product = byId.get(line.productId)!;
        await client.query(
          `INSERT INTO sale_lines (sale_id, product_id, name, price, qty)
           VALUES ($1, $2, $3, $4, $5)`,
          [saleId, product.id, product.name, product.price, line.qty],
        );

        if (product.stock !== null) {
          await client.query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [line.qty, product.id]);
          await client.query(
            `INSERT INTO stock_movements (tenant_id, product_id, type, qty, note, staff_user_id)
             VALUES ($1, $2, 'out', $3, 'Venta POS', $4)`,
            [auth.tenantId, product.id, line.qty, auth.sub],
          );
        }
      }

      return saleId;
    });

    const receipt = await buildReceipt(saleId, auth.tenantId);

    // Envío de recibo por correo: no se espera (fire-and-forget) para no
    // retrasar la respuesta del cobro al cajero.
    if (receipt?.customer?.email) {
      const itemsHtml = receipt.lines
        .map((l) => `<li>${l.qty}x ${l.name} — ${formatCurrency(l.lineTotal, receipt.tenant.currency)}</li>`)
        .join("");
      sendMail(
        receipt.customer.email,
        `Tu recibo de compra — Folio ${receipt.saleId.slice(0, 8).toUpperCase()}`,
        `<p>Gracias por tu compra en ${receipt.tenant.name}.</p>
         <ul>${itemsHtml}</ul>
         <p><b>Total: ${formatCurrency(receipt.total, receipt.tenant.currency)}</b></p>`,
      ).catch((err) => console.error("No se pudo enviar el recibo por correo:", err));
    }

    return NextResponse.json(receipt, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo procesar el cobro.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
