"use client";

import { useEffect, useState } from "react";
import { getReceipt, type Receipt } from "@/lib/api/pos";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const paymentLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  wallet: "Monedero",
};

const subscriptionStatusLabels: Record<string, string> = {
  active: "Activa",
  expired: "Vencida",
  frozen: "Congelada",
};

export default function ReceiptPrintPage({ params }: { params: { saleId: string } }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReceipt(params.saleId)
      .then(setReceipt)
      .catch(() => setError("No se pudo cargar el recibo."));
  }, [params.saleId]);

  useEffect(() => {
    if (!receipt) return;
    const timer = setTimeout(() => window.print(), 350);
    return () => clearTimeout(timer);
  }, [receipt]);

  if (error) {
    return <p className="p-6 text-sm text-red-600">{error}</p>;
  }
  if (!receipt) {
    return <p className="p-6 text-sm text-gray-500">Cargando recibo…</p>;
  }

  const { tenant, cashier, customer, subscription, lines, subtotal, taxRate, total, createdAt, paymentMethod, saleId } = receipt;

  return (
    <>
      <style>{`
        @page { size: 80mm auto; margin: 0; }
        html, body { background: #ddd; }
        @media print {
          html, body { background: #fff; }
          .no-print { display: none !important; }
        }
        .ticket {
          width: 80mm;
          padding: 4mm;
          margin: 0 auto;
          background: #fff;
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          line-height: 1.45;
          color: #000;
        }
        .ticket hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; gap: 6px; }
        .center { text-align: center; }
        .bold { font-weight: 700; }
        .muted { color: #333; }
      `}</style>

      <div className="no-print flex justify-center gap-3 py-4">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white"
        >
          Imprimir
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          Cerrar
        </button>
      </div>

      <div className="ticket">
        <div className="center bold">{tenant.name}</div>
        {tenant.taxId && <div className="center">{tenant.taxName}: {tenant.taxId}</div>}
        <div className="center">Folio: {saleId.slice(0, 8).toUpperCase()}</div>
        <div className="center">{formatDateTime(createdAt)}</div>
        <hr />

        <div className="row"><span>Cajero</span><span>{cashier.name}</span></div>
        <div className="row"><span>Pago</span><span>{paymentLabels[paymentMethod] ?? paymentMethod}</span></div>
        <hr />

        <div className="bold">CLIENTE</div>
        {customer ? (
          <>
            <div>{customer.name}</div>
            {customer.email && <div className="muted">{customer.email}</div>}
            {customer.phone && <div className="muted">{customer.phone}</div>}
          </>
        ) : (
          <div>Cliente general</div>
        )}

        {subscription && (
          <>
            <hr />
            <div className="bold">MEMBRESÍA VIGENTE</div>
            <div className="row"><span>Plan</span><span className="bold">{subscription.plan.toUpperCase()}</span></div>
            <div className="row"><span>Estado</span><span>{subscriptionStatusLabels[subscription.status] ?? subscription.status}</span></div>
            <div className="row"><span>Inicio</span><span>{subscription.startDate}</span></div>
            <div className="row"><span>Vence</span><span>{subscription.endDate}</span></div>
          </>
        )}

        <hr />
        <div className="bold">DETALLE</div>
        {lines.map((l, i) => (
          <div key={i} className="row">
            <span>{l.qty}x {l.name}</span>
            <span>{formatCurrency(l.lineTotal, tenant.currency)}</span>
          </div>
        ))}

        <hr />
        <div className="row"><span>Subtotal</span><span>{formatCurrency(subtotal, tenant.currency)}</span></div>
        <div className="row"><span>Impuesto ({(taxRate * 100).toFixed(0)}%)</span><span>{formatCurrency(total - subtotal, tenant.currency)}</span></div>
        <div className="row bold" style={{ fontSize: "13px" }}><span>TOTAL</span><span>{formatCurrency(total, tenant.currency)}</span></div>

        <hr />
        <div className="center">¡Gracias por tu visita!</div>
      </div>
    </>
  );
}
