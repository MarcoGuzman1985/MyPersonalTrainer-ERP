-- Bloque 04/09: Ventas y Pagos (POS) + Inventario y Proveedores.
-- Unifica PosProduct e inventory.Product en una sola tabla `products`.

CREATE TABLE suppliers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  contact    text NOT NULL,
  phone      text NOT NULL,
  email      citext NOT NULL
);

CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);

CREATE TABLE products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku          text,
  name         text NOT NULL,
  category     text NOT NULL,
  kind         product_kind NOT NULL,
  price        numeric(10,2) NOT NULL,
  stock        integer,
  min_stock    integer,
  supplier_id  uuid REFERENCES suppliers(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_low_stock ON products(tenant_id) WHERE stock IS NOT NULL AND min_stock IS NOT NULL;

CREATE TABLE stock_movements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type         stock_movement_type NOT NULL,
  qty          integer NOT NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  note         text NOT NULL DEFAULT '',
  staff_user_id uuid REFERENCES staff_users(id)
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id, occurred_at DESC);

CREATE TABLE sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id       uuid REFERENCES members(id), -- null = venta a público general
  staff_user_id   uuid NOT NULL REFERENCES staff_users(id),
  payment_method  payment_method NOT NULL,
  subtotal        numeric(10,2) NOT NULL,
  tax_rate        numeric(5,4) NOT NULL DEFAULT 0,
  total           numeric(10,2) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_tenant_created ON sales(tenant_id, created_at DESC);

CREATE TABLE sale_lines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id),
  name        text NOT NULL,   -- snapshot al momento de la venta
  price       numeric(10,2) NOT NULL, -- snapshot
  qty         integer NOT NULL
);

CREATE INDEX idx_sale_lines_sale ON sale_lines(sale_id);
