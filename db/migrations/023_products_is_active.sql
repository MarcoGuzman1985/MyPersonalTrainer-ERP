-- Borrado lógico del catálogo POS: nunca se elimina la fila para no romper
-- la integridad histórica de sale_lines/stock_movements ya emitidos.
ALTER TABLE products ADD COLUMN is_active boolean NOT NULL DEFAULT true;
