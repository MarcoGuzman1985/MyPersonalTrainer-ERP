import { apiFetch } from "@/lib/api/client";
import type { PosProduct, PaymentMethod, CartLine } from "@/store/usePosStore";

/** Categorías del catálogo, en el orden en que se muestran los chips. */
export const posCategories = [
  "Membresías",
  "Suplementos",
  "Bebidas",
  "Merchandising",
  "Servicios",
] as const;

export type PosCategory = (typeof posCategories)[number];

export function getProducts() {
  return apiFetch<PosProduct[]>("/pos/products");
}

export interface CheckoutInput {
  customerId: string | null;
  paymentMethod: PaymentMethod;
  lines: CartLine[];
}

export interface ReceiptLine {
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface Receipt {
  saleId: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  tenant: { name: string; taxName: string; taxId: string; currency: string };
  cashier: { name: string };
  customer: { name: string; email: string; phone: string } | null;
  subscription: { plan: string; status: string; startDate: string; endDate: string } | null;
  lines: ReceiptLine[];
  subtotal: number;
  taxRate: number;
  total: number;
}

export function checkout(input: CheckoutInput) {
  return apiFetch<Receipt>("/pos/checkout", {
    method: "POST",
    body: JSON.stringify({
      customerId: input.customerId,
      paymentMethod: input.paymentMethod,
      lines: input.lines.map((l) => ({ productId: l.id, qty: l.qty })),
    }),
  });
}

export function getReceipt(saleId: string) {
  return apiFetch<Receipt>(`/pos/sales/${saleId}/receipt`);
}

export interface CreateProductInput {
  name: string;
  category: string;
  kind: PosProduct["kind"];
  price: number;
  stock?: number | null;
  sku?: string;
}

export function createProduct(input: CreateProductInput) {
  return apiFetch<PosProduct>("/pos/products", { method: "POST", body: JSON.stringify(input) });
}

export interface UpdateProductInput {
  name: string;
  price: number;
  stock?: number | null;
}

export function updateProduct(id: string, input: UpdateProductInput) {
  return apiFetch<PosProduct>(`/pos/products/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteProduct(id: string) {
  return apiFetch<{ ok: true }>(`/pos/products/${id}`, { method: "DELETE" });
}
