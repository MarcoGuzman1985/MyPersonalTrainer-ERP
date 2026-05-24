import type { Product, StockMovement, Supplier } from "@/types/inventory";

/**
 * Capa de datos del módulo Inventario y Proveedores (Bloque 9).
 * MOCK para demo de UI. Para conectar el backend, reemplazar los retornos por:
 *   getProducts   -> apiFetch<Product[]>("/api/inventory/products")
 *   getSuppliers  -> apiFetch<Supplier[]>("/api/suppliers")
 *   getMovements  -> apiFetch<StockMovement[]>("/api/inventory/movements")
 *
 * // TODO(backend): GET /api/inventory/products
 * // TODO(backend): POST /api/inventory/movements
 * // TODO(backend): POST /api/suppliers
 */

export const suppliersMock: Supplier[] = [
  { id: "sup_1", name: "NutriSport Distribución", contact: "Marta Ibáñez", phone: "+34 911 223 344", email: "ventas@nutrisport.es" },
  { id: "sup_2", name: "GymGear Importaciones", contact: "Rubén Alcalá", phone: "+34 933 778 991", email: "pedidos@gymgear.com" },
  { id: "sup_3", name: "PureWater Iberia", contact: "Sandra Ojeda", phone: "+34 955 010 202", email: "comercial@purewater.es" },
  { id: "sup_4", name: "ProteinLab S.L.", contact: "Iván Castaño", phone: "+34 944 556 677", email: "hola@proteinlab.es" },
];

export const productsMock: Product[] = [
  // OK
  { id: "prd_1", sku: "PRO-WHEY-1K", name: "Proteína Whey 1kg Chocolate", category: "Suplementos", stock: 48, minStock: 15, price: 29.9, supplierId: "sup_4", supplierName: "ProteinLab S.L." },
  { id: "prd_2", sku: "AGUA-50CL", name: "Agua mineral 50cl (pack 24)", category: "Bebidas", stock: 120, minStock: 30, price: 8.5, supplierId: "sup_3", supplierName: "PureWater Iberia" },
  { id: "prd_3", sku: "TOALLA-MICRO", name: "Toalla microfibra gimnasio", category: "Accesorios", stock: 65, minStock: 20, price: 12.0, supplierId: "sup_2", supplierName: "GymGear Importaciones" },
  { id: "prd_4", sku: "CAMISETA-DRY-M", name: "Camiseta técnica Dry-Fit (M)", category: "Ropa", stock: 33, minStock: 10, price: 19.95, supplierId: "sup_2", supplierName: "GymGear Importaciones" },
  // Bajo mínimo
  { id: "prd_5", sku: "BCAA-300G", name: "BCAA 300g Sandía", category: "Suplementos", stock: 8, minStock: 12, price: 24.5, supplierId: "sup_4", supplierName: "ProteinLab S.L." },
  { id: "prd_6", sku: "BARRA-PROT", name: "Barrita proteica (caja 12)", category: "Suplementos", stock: 5, minStock: 10, price: 18.0, supplierId: "sup_1", supplierName: "NutriSport Distribución" },
  { id: "prd_7", sku: "BANDA-RESIST", name: "Banda de resistencia media", category: "Accesorios", stock: 14, minStock: 15, price: 9.9, supplierId: "sup_2", supplierName: "GymGear Importaciones" },
  // Crítico
  { id: "prd_8", sku: "CREATINA-500", name: "Creatina monohidrato 500g", category: "Suplementos", stock: 0, minStock: 10, price: 22.0, supplierId: "sup_4", supplierName: "ProteinLab S.L." },
  { id: "prd_9", sku: "SHAKER-600", name: "Shaker 600ml con malla", category: "Accesorios", stock: 0, minStock: 25, price: 6.5, supplierId: "sup_2", supplierName: "GymGear Importaciones" },
  { id: "prd_10", sku: "ISO-DRINK", name: "Bebida isotónica 500ml (pack 12)", category: "Bebidas", stock: 0, minStock: 18, price: 14.4, supplierId: "sup_1", supplierName: "NutriSport Distribución" },
];

export const movementsMock: StockMovement[] = [
  { id: "mov_1", productId: "prd_1", productName: "Proteína Whey 1kg Chocolate", type: "in", qty: 30, date: "2026-05-22", note: "Reposición pedido #4821", user: "Laura Pérez" },
  { id: "mov_2", productId: "prd_8", productName: "Creatina monohidrato 500g", type: "out", qty: 12, date: "2026-05-21", note: "Venta mostrador", user: "Carlos Núñez" },
  { id: "mov_3", productId: "prd_2", productName: "Agua mineral 50cl (pack 24)", type: "in", qty: 48, date: "2026-05-20", note: "Entrada de almacén", user: "Laura Pérez" },
  { id: "mov_4", productId: "prd_5", productName: "BCAA 300g Sandía", type: "out", qty: 4, date: "2026-05-19", note: "Consumo interno staff", user: "Marco Guzmán" },
  { id: "mov_5", productId: "prd_9", productName: "Shaker 600ml con malla", type: "out", qty: 25, date: "2026-05-18", note: "Promoción nuevos socios", user: "Carlos Núñez" },
  { id: "mov_6", productId: "prd_6", productName: "Barrita proteica (caja 12)", type: "in", qty: 10, date: "2026-05-17", note: "Reposición urgente", user: "Laura Pérez" },
];
