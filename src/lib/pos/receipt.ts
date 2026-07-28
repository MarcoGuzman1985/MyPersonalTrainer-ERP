import { pool } from "@/lib/db";

export async function buildReceipt(saleId: string, tenantId: string) {
  const { rows: saleRows } = await pool.query(
    `SELECT s.id, s.created_at AS "createdAt", s.payment_method AS "paymentMethod",
            s.subtotal, s.tax_rate AS "taxRate", s.total,
            t.name AS "tenantName",
            COALESCE(ts.tax_name, 'IVA') AS "taxName",
            COALESCE(ts.tax_id, '') AS "taxId",
            COALESCE(ts.currency, 'USD') AS currency,
            su.name AS "cashierName",
            m.id AS "memberId", m.name AS "memberName", m.email AS "memberEmail", m.phone AS "memberPhone"
     FROM sales s
     JOIN tenants t ON t.id = s.tenant_id
     LEFT JOIN tenant_settings ts ON ts.tenant_id = s.tenant_id
     JOIN staff_users su ON su.id = s.staff_user_id
     LEFT JOIN members m ON m.id = s.member_id
     WHERE s.id = $1 AND s.tenant_id = $2`,
    [saleId, tenantId],
  );
  const sale = saleRows[0];
  if (!sale) return null;

  const { rows: lines } = await pool.query(
    `SELECT name, price, qty FROM sale_lines WHERE sale_id = $1 ORDER BY name`,
    [saleId],
  );

  let subscription = null;
  if (sale.memberId) {
    const { rows: subRows } = await pool.query(
      `SELECT plan, status, start_date AS "startDate", end_date AS "endDate"
       FROM member_subscriptions WHERE member_id = $1 AND is_current = true LIMIT 1`,
      [sale.memberId],
    );
    subscription = subRows[0] ?? null;
  }

  return {
    saleId: sale.id,
    createdAt: sale.createdAt,
    paymentMethod: sale.paymentMethod,
    tenant: {
      name: sale.tenantName,
      taxName: sale.taxName,
      taxId: sale.taxId,
      currency: sale.currency,
    },
    cashier: { name: sale.cashierName },
    customer: sale.memberId
      ? { name: sale.memberName, email: sale.memberEmail, phone: sale.memberPhone }
      : null,
    subscription,
    lines: lines.map((l) => ({
      name: l.name,
      price: Number(l.price),
      qty: l.qty,
      lineTotal: Number(l.price) * l.qty,
    })),
    subtotal: Number(sale.subtotal),
    taxRate: Number(sale.taxRate),
    total: Number(sale.total),
  };
}
