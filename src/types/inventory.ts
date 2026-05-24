import type { ID } from "@/types/shared";

/**
 * Tipos del módulo Inventario y Proveedores (Bloque 9).
 * Extienden los contratos transversales de "@/types/shared".
 */

/** Proveedor que abastece productos del catálogo. */
export interface Supplier {
  id: ID;
  name: string;
  /** Persona de contacto en el proveedor. */
  contact: string;
  phone: string;
  email: string;
}

/** Artículo de inventario con control de stock. */
export interface Product {
  id: ID;
  sku: string;
  name: string;
  category: string;
  /** Existencias actuales. */
  stock: number;
  /** Umbral mínimo que dispara la alerta de reposición. */
  minStock: number;
  price: number;
  supplierId: ID;
  supplierName: string;
}

/** Tipo de movimiento de stock. */
export type StockMovementType = "in" | "out";

/** Registro de entrada o salida de stock. */
export interface StockMovement {
  id: ID;
  productId: ID;
  productName: string;
  type: StockMovementType;
  qty: number;
  /** Fecha ISO del movimiento. */
  date: string;
  note: string;
  /** Usuario que registró el movimiento. */
  user: string;
}
