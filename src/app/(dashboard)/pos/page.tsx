"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Trash2, User, CheckCircle2, Receipt as ReceiptIcon, Settings } from "lucide-react";
import {
  PageHeader, Card, CardContent, Button, Input, Select, Badge, Modal,
} from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { usePosStore, type PosProduct } from "@/store/usePosStore";
import { posCategories, getProducts, checkout } from "@/lib/api/pos";
import { getMembers } from "@/lib/api/members";
import { ApiError } from "@/lib/api/client";
import type { Member } from "@/types/members";
import { ProductCard } from "@/components/modules/pos/ProductCard";
import { CartLineRow } from "@/components/modules/pos/CartLineRow";
import { PaymentMethodPicker, paymentMeta } from "@/components/modules/pos/PaymentMethodPicker";
import { BillingModal } from "@/components/modules/pos/BillingModal";
import { CatalogManagerModal } from "@/components/modules/pos/CatalogManagerModal";

const GENERAL_CUSTOMER = "__general__";

export default function PosPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [billingOpen, setBillingOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [customers, setCustomers] = useState<Member[]>([]);
  const [products, setProducts] = useState<PosProduct[]>([]);

  const {
    customerId, customerName, lines, paymentMethod, taxRate,
    setCustomer, setPaymentMethod, addItem, removeItem, setQty, clear, subtotal, total,
  } = usePosStore();

  function refreshProducts() {
    return getProducts().then(setProducts).catch(() => setProducts([]));
  }

  useEffect(() => {
    getMembers({ pageSize: 100 })
      .then((res) => setCustomers(res.data))
      .catch(() => setCustomers([]));
    refreshProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const byCategory = !activeCategory || p.category === activeCategory;
      const byQuery = !q || p.name.toLowerCase().includes(q);
      return byCategory && byQuery;
    });
  }, [products, activeCategory, query]);

  const sub = subtotal();
  const tax = sub * taxRate;
  const grandTotal = total();
  const itemCount = lines.reduce((acc, l) => acc + l.qty, 0);
  const isEmpty = lines.length === 0;

  function handleCustomerChange(value: string) {
    if (value === GENERAL_CUSTOMER) {
      setCustomer(null, null);
      return;
    }
    const found = customers.find((c) => c.id === value);
    setCustomer(found?.id ?? null, found?.name ?? null);
  }

  async function handleConfirmCheckout() {
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const receipt = await checkout({ customerId, paymentMethod, lines });
      setConfirmOpen(false);
      clear();
      window.open(`/print/receipt/${receipt.saleId}`, "_blank", "noopener,noreferrer");
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : "No se pudo procesar el cobro.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Punto de Venta"
        description="Cobra membresías y productos en mostrador con un par de toques."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={Settings} onClick={() => setCatalogOpen(true)}>
              Administrar catálogo
            </Button>
            {!isEmpty && (
              <Button variant="outline" icon={Trash2} onClick={clear}>
                Vaciar
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
        {/* PANEL IZQUIERDO: catálogo */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto o membresía…"
              className="pl-9"
              aria-label="Buscar producto"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryChip label="Todos" active={activeCategory === null} onClick={() => setActiveCategory(null)} />
            {posCategories.map((cat) => (
              <CategoryChip
                key={cat}
                label={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-sm text-content-subtle">
                No hay productos que coincidan con la búsqueda.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={addItem} />
              ))}
            </div>
          )}
        </div>

        {/* PANEL DERECHO: carrito (sticky en desktop, debajo en móvil) */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="flex max-h-[calc(100vh-7rem)] flex-col">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-content">
                  <ShoppingCart className="h-5 w-5" />
                  Ticket
                </h2>
                {itemCount > 0 && <Badge tone="brand">{itemCount} art.</Badge>}
              </div>

              {/* Cliente */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-content-subtle" />
                <Select
                  value={customerId ?? GENERAL_CUSTOMER}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  aria-label="Seleccionar cliente"
                >
                  <option value={GENERAL_CUSTOMER}>Cliente general</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {customerId && (
                  <Button
                    variant="outline"
                    size="icon"
                    icon={ReceiptIcon}
                    aria-label="Actualizar datos de facturación"
                    onClick={() => setBillingOpen(true)}
                  />
                )}
              </div>

              {/* Líneas */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {isEmpty ? (
                  <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center text-sm text-content-subtle">
                    <ShoppingCart className="h-8 w-8 opacity-40" />
                    El ticket está vacío. Pulsa un producto para añadirlo.
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {lines.map((line) => (
                      <CartLineRow
                        key={line.id}
                        line={line}
                        onInc={(id) => setQty(id, (lines.find((l) => l.id === id)?.qty ?? 0) + 1)}
                        onDec={(id) => setQty(id, (lines.find((l) => l.id === id)?.qty ?? 0) - 1)}
                        onRemove={removeItem}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {/* Totales */}
              <div className="space-y-1.5 border-t border-line pt-3 text-sm">
                <div className="flex justify-between text-content-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(sub)}</span>
                </div>
                <div className="flex justify-between text-content-muted">
                  <span>Impuesto ({(taxRate * 100).toFixed(0)}%)</span>
                  <span className="tabular-nums">{formatCurrency(tax)}</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-base font-semibold text-content">Total</span>
                  <span className="text-2xl font-bold tabular-nums text-content">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Método de pago */}
              <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />

              {/* Cobro rápido */}
              <Button
                variant="success"
                size="lg"
                className="w-full"
                disabled={isEmpty}
                onClick={() => setConfirmOpen(true)}
              >
                Cobrar {formatCurrency(grandTotal)}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Confirmación de cobro */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar cobro"
        description="Revisa el resumen antes de registrar la venta."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={checkingOut}>
              Cancelar
            </Button>
            <Button variant="success" icon={CheckCircle2} loading={checkingOut} onClick={handleConfirmCheckout}>
              Confirmar cobro
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-content-muted">Cliente</span>
            <span className="font-medium text-content">{customerName ?? "Cliente general"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-content-muted">Método de pago</span>
            <Badge tone="brand">{paymentMeta[paymentMethod].label}</Badge>
          </div>

          <ul className="divide-y divide-line rounded-lg border border-line">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="truncate text-content">
                  {l.name} <span className="text-content-subtle">×{l.qty}</span>
                </span>
                <span className="tabular-nums text-content-muted">{formatCurrency(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold text-content">Total a cobrar</span>
            <span className="text-xl font-bold tabular-nums text-content">{formatCurrency(grandTotal)}</span>
          </div>

          {checkoutError && <p className="text-sm text-red-600">{checkoutError}</p>}
        </div>
      </Modal>

      {customerId && (
        <BillingModal
          open={billingOpen}
          onClose={() => setBillingOpen(false)}
          memberId={customerId}
          memberName={customerName ?? ""}
        />
      )}

      <CatalogManagerModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        products={products}
        onChanged={refreshProducts}
      />
    </>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
        active
          ? "border-brand-800 bg-brand-800 text-white"
          : "border-line bg-surface text-content-muted hover:bg-surface-muted",
      )}
    >
      {label}
    </button>
  );
}
