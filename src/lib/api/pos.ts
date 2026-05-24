import type { ID } from "@/types/shared";
import type { PosProduct } from "@/store/usePosStore";

/**
 * Capa de datos del módulo POS (Ventas y Pagos).
 * MOCK para demo de UI. Para conectar el backend, reemplazar por:
 *   getProducts  -> apiFetch<PosProduct[]>("/pos/products")
 *   getCustomers -> apiFetch<PosCustomer[]>("/pos/customers")
 *   checkout     -> apiFetch<CheckoutResult>("/pos/checkout", { method: "POST", body })
 */

// TODO(backend): GET /api/pos/products
// TODO(backend): POST /api/pos/checkout

/** Categorías del catálogo, en el orden en que se muestran los chips. */
export const posCategories = [
  "Membresías",
  "Suplementos",
  "Bebidas",
  "Merchandising",
  "Servicios",
] as const;

export type PosCategory = (typeof posCategories)[number];

export const posProductsMock: PosProduct[] = [
  // Membresías
  { id: "mem_mensual", name: "Membresía Mensual", price: 45, category: "Membresías", kind: "membership" },
  { id: "mem_trimestral", name: "Membresía Trimestral", price: 120, category: "Membresías", kind: "membership" },
  { id: "mem_semestral", name: "Membresía Semestral", price: 220, category: "Membresías", kind: "membership" },
  { id: "mem_anual", name: "Membresía Anual", price: 399, category: "Membresías", kind: "membership" },
  { id: "mem_dropin", name: "Pase Diario (Drop-in)", price: 8, category: "Membresías", kind: "membership" },
  { id: "mem_pareja", name: "Membresía Pareja", price: 79, category: "Membresías", kind: "membership" },

  // Suplementos
  { id: "sup_proteina", name: "Proteína Whey 1kg", price: 32, category: "Suplementos", kind: "product", stock: 24 },
  { id: "sup_creatina", name: "Creatina 300g", price: 19, category: "Suplementos", kind: "product", stock: 40 },
  { id: "sup_preworkout", name: "Pre-entreno 250g", price: 27, category: "Suplementos", kind: "product", stock: 12 },
  { id: "sup_bcaa", name: "BCAA 400g", price: 22, category: "Suplementos", kind: "product", stock: 0 },
  { id: "sup_omega3", name: "Omega-3 90 cáps", price: 15, category: "Suplementos", kind: "product", stock: 33 },
  { id: "sup_barrita", name: "Barrita Proteica", price: 3, category: "Suplementos", kind: "product", stock: 120 },

  // Bebidas
  { id: "beb_agua", name: "Agua Mineral 500ml", price: 1.5, category: "Bebidas", kind: "product", stock: 200 },
  { id: "beb_isotonica", name: "Bebida Isotónica", price: 2.5, category: "Bebidas", kind: "product", stock: 85 },
  { id: "beb_batido", name: "Batido Recovery", price: 4, category: "Bebidas", kind: "product", stock: 30 },
  { id: "beb_cafe", name: "Café Americano", price: 1.8, category: "Bebidas", kind: "product", stock: 999 },

  // Merchandising
  { id: "mer_camiseta", name: "Camiseta Técnica", price: 24, category: "Merchandising", kind: "product", stock: 50 },
  { id: "mer_botella", name: "Botella Shaker", price: 9, category: "Merchandising", kind: "product", stock: 60 },
  { id: "mer_toalla", name: "Toalla Microfibra", price: 12, category: "Merchandising", kind: "product", stock: 18 },
  { id: "mer_gorra", name: "Gorra Logo", price: 14, category: "Merchandising", kind: "product", stock: 22 },
  { id: "mer_banda", name: "Banda Elástica", price: 7, category: "Merchandising", kind: "product", stock: 45 },

  // Servicios
  { id: "srv_pt", name: "Sesión Personal Training", price: 30, category: "Servicios", kind: "product" },
  { id: "srv_nutricion", name: "Consulta Nutricional", price: 40, category: "Servicios", kind: "product" },
  { id: "srv_inbody", name: "Análisis InBody", price: 18, category: "Servicios", kind: "product" },
  { id: "srv_masaje", name: "Masaje Deportivo", price: 35, category: "Servicios", kind: "product" },
];

/** Cliente mostrado en el selector de venta. */
export interface PosCustomer {
  id: ID;
  name: string;
}

export const posCustomersMock: PosCustomer[] = [
  { id: "cli_1", name: "Marco Guzmán" },
  { id: "cli_2", name: "Lucía Fernández" },
  { id: "cli_3", name: "Diego Ramírez" },
  { id: "cli_4", name: "Carla Méndez" },
  { id: "cli_5", name: "Javier Soto" },
  { id: "cli_6", name: "Ana López" },
  { id: "cli_7", name: "Pablo Ortega" },
  { id: "cli_8", name: "Sofía Navarro" },
];
