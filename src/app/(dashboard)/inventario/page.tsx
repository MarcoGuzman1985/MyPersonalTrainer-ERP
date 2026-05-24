"use client";

import { useMemo, useState } from "react";
import {
  Boxes, AlertTriangle, TrendingDown, Wallet, Plus, ArrowDownToLine, ArrowUpFromLine, Search, Mail, Phone, User,
} from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, DataTable, Button,
  Tabs, TabsList, TabsTrigger, TabsContent, Modal, Field, Input, Textarea, Select,
  type Column,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { productsMock, suppliersMock, movementsMock } from "@/lib/api/inventory";
import type { Product, StockMovement, Supplier } from "@/types/inventory";
import type { Tone } from "@/types/shared";

/** Clasifica el estado de stock de un producto para las alertas de color. */
function stockStatus(p: Product): { label: string; tone: Tone } {
  if (p.stock <= 0) return { label: "Crítico", tone: "danger" };
  if (p.stock <= p.minStock) return { label: "Bajo mínimo", tone: "warning" };
  return { label: "OK", tone: "success" };
}

export default function InventarioPage() {
  // TODO(backend): sustituir mocks por getProducts()/getSuppliers()/getMovements() en un hook de datos.
  const [loading] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const [movementOpen, setMovementOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(productsMock.map((p) => p.category)))],
    [],
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productsMock.filter((p) => {
      const matchesCategory = category === "all" || p.category === category;
      const matchesQuery =
        q === "" || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  // Métricas agregadas del inventario.
  const metrics = useMemo(() => {
    const critical = productsMock.filter((p) => p.stock <= 0).length;
    const low = productsMock.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
    const value = productsMock.reduce((sum, p) => sum + p.stock * p.price, 0);
    return { skus: productsMock.length, critical, low, value };
  }, []);

  const productColumns: Column<Product>[] = [
    { key: "sku", header: "SKU", cell: (p) => <span className="font-mono text-xs text-content-muted">{p.sku}</span> },
    {
      key: "name",
      header: "Producto",
      cell: (p) => (
        <div>
          <p className="font-medium text-content">{p.name}</p>
          <p className="text-xs text-content-subtle">{p.category}</p>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock / Mín.",
      align: "right",
      cell: (p) => (
        <span className="tabular-nums">
          <span className="font-semibold text-content">{p.stock}</span>
          <span className="text-content-subtle"> / {p.minStock}</span>
        </span>
      ),
    },
    { key: "price", header: "Precio", align: "right", cell: (p) => formatCurrency(p.price) },
    { key: "supplier", header: "Proveedor", cell: (p) => <span className="text-content-muted">{p.supplierName}</span> },
    {
      key: "status",
      header: "Estado",
      align: "right",
      cell: (p) => {
        const s = stockStatus(p);
        return <Badge tone={s.tone} dot>{s.label}</Badge>;
      },
    },
  ];

  const supplierColumns: Column<Supplier>[] = [
    { key: "name", header: "Proveedor", cell: (s) => <p className="font-medium text-content">{s.name}</p> },
    {
      key: "contact",
      header: "Contacto",
      cell: (s) => (
        <span className="flex items-center gap-1.5 text-content-muted">
          <User className="h-3.5 w-3.5 shrink-0" /> {s.contact}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      cell: (s) => (
        <span className="flex items-center gap-1.5 text-content-muted">
          <Phone className="h-3.5 w-3.5 shrink-0" /> {s.phone}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (s) => (
        <span className="flex items-center gap-1.5 text-content-muted">
          <Mail className="h-3.5 w-3.5 shrink-0" /> {s.email}
        </span>
      ),
    },
  ];

  const movementColumns: Column<StockMovement>[] = [
    { key: "date", header: "Fecha", cell: (m) => <span className="text-content-muted">{formatDate(m.date)}</span> },
    { key: "product", header: "Producto", cell: (m) => <span className="font-medium text-content">{m.productName}</span> },
    {
      key: "type",
      header: "Tipo",
      cell: (m) =>
        m.type === "in" ? (
          <Badge tone="success" dot>Entrada</Badge>
        ) : (
          <Badge tone="warning" dot>Salida</Badge>
        ),
    },
    {
      key: "qty",
      header: "Cantidad",
      align: "right",
      cell: (m) => (
        <span className={m.type === "in" ? "font-semibold text-teal-700" : "font-semibold text-amber-600"}>
          {m.type === "in" ? "+" : "−"}{m.qty}
        </span>
      ),
    },
    { key: "note", header: "Nota", cell: (m) => <span className="text-content-muted">{m.note}</span> },
    { key: "user", header: "Usuario", align: "right", cell: (m) => <span className="text-content-subtle">{m.user}</span> },
  ];

  function handleRegisterMovement(e: React.FormEvent) {
    e.preventDefault();
    // TODO(backend): POST /api/inventory/movements con { productId, type, qty, note }.
    setMovementOpen(false);
  }

  function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    // TODO(backend): POST /api/suppliers con { name, contact, phone, email }.
    setSupplierOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Inventario y Proveedores"
        description="Control de stock, alertas de reposición, proveedores y movimientos de almacén."
        actions={
          <Button icon={Plus} onClick={() => setMovementOpen(true)}>
            Registrar movimiento
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="SKUs totales" value={metrics.skus} icon={Boxes} accent="brand" loading={loading} />
        <StatCard label="En stock crítico" value={metrics.critical} icon={AlertTriangle} accent="brand" loading={loading} />
        <StatCard label="Bajo mínimo" value={metrics.low} icon={TrendingDown} accent="brand" loading={loading} />
        <StatCard label="Valor de inventario" value={formatCurrency(metrics.value)} icon={Wallet} accent="teal" loading={loading} />
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        {/* INVENTARIO */}
        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader
              title="Control de stock"
              description="Las alertas de color indican productos que requieren reposición."
              action={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por nombre o SKU…"
                      className="pl-9 sm:w-64"
                      aria-label="Buscar productos"
                    />
                  </div>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Filtrar por categoría"
                    className="sm:w-48"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c === "all" ? "Todas las categorías" : c}
                      </option>
                    ))}
                  </Select>
                </div>
              }
            />
            <CardContent className="p-0">
              <DataTable
                columns={productColumns}
                rows={filteredProducts}
                rowKey={(p) => p.id}
                loading={loading}
                emptyMessage="No hay productos que coincidan con el filtro."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROVEEDORES */}
        <TabsContent value="suppliers" className="mt-6">
          <Card>
            <CardHeader
              title="Proveedores"
              description="Empresas que abastecen el catálogo de productos."
              action={
                <Button variant="outline" icon={Plus} onClick={() => setSupplierOpen(true)}>
                  Añadir proveedor
                </Button>
              }
            />
            <CardContent className="p-0">
              <DataTable
                columns={supplierColumns}
                rows={suppliersMock}
                rowKey={(s) => s.id}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* MOVIMIENTOS */}
        <TabsContent value="movements" className="mt-6">
          <Card>
            <CardHeader
              title="Movimientos de stock"
              description="Histórico de entradas y salidas de almacén."
            />
            <CardContent className="p-0">
              <DataTable
                columns={movementColumns}
                rows={movementsMock}
                rowKey={(m) => m.id}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: registrar movimiento */}
      <Modal
        open={movementOpen}
        onClose={() => setMovementOpen(false)}
        title="Registrar movimiento"
        description="Registra una entrada o salida de stock para un producto."
        footer={
          <>
            <Button variant="ghost" onClick={() => setMovementOpen(false)}>
              Cancelar
            </Button>
            <Button form="movement-form" type="submit" icon={ArrowDownToLine}>
              Guardar movimiento
            </Button>
          </>
        }
      >
        <form id="movement-form" onSubmit={handleRegisterMovement} className="space-y-4">
          <Field label="Producto" htmlFor="mov-product">
            <Select id="mov-product" defaultValue="" required>
              <option value="" disabled>
                Selecciona un producto…
              </option>
              {productsMock.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo de movimiento" htmlFor="mov-type">
              <Select id="mov-type" defaultValue="in">
                <option value="in">Entrada</option>
                <option value="out">Salida</option>
              </Select>
            </Field>
            <Field label="Cantidad" htmlFor="mov-qty">
              <Input id="mov-qty" type="number" min={1} defaultValue={1} required />
            </Field>
          </div>
          <Field label="Nota" htmlFor="mov-note" hint="Motivo o referencia del movimiento.">
            <Textarea id="mov-note" placeholder="Ej. Reposición pedido #4821" />
          </Field>
        </form>
      </Modal>

      {/* MODAL: añadir proveedor */}
      <Modal
        open={supplierOpen}
        onClose={() => setSupplierOpen(false)}
        title="Añadir proveedor"
        description="Da de alta un nuevo proveedor en el sistema."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSupplierOpen(false)}>
              Cancelar
            </Button>
            <Button form="supplier-form" type="submit" icon={ArrowUpFromLine}>
              Guardar proveedor
            </Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleAddSupplier} className="space-y-4">
          <Field label="Nombre del proveedor" htmlFor="sup-name">
            <Input id="sup-name" placeholder="Ej. NutriSport Distribución" required />
          </Field>
          <Field label="Persona de contacto" htmlFor="sup-contact">
            <Input id="sup-contact" placeholder="Ej. Marta Ibáñez" required />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Teléfono" htmlFor="sup-phone">
              <Input id="sup-phone" type="tel" placeholder="+34 911 223 344" />
            </Field>
            <Field label="Email" htmlFor="sup-email">
              <Input id="sup-email" type="email" placeholder="ventas@proveedor.es" required />
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}
