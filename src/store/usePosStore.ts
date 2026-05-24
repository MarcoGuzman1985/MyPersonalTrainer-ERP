"use client";

import { create } from "zustand";
import type { ID } from "@/types/shared";

export interface PosProduct {
  id: ID;
  name: string;
  price: number;
  category: string;
  /** Distingue membresías de productos físicos. */
  kind: "product" | "membership";
  stock?: number;
}

export interface CartLine extends PosProduct {
  qty: number;
}

export type PaymentMethod = "cash" | "card" | "transfer" | "wallet";

interface PosState {
  customerId: ID | null;
  customerName: string | null;
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  setCustomer: (id: ID | null, name: string | null) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  addItem: (p: PosProduct) => void;
  removeItem: (id: ID) => void;
  setQty: (id: ID, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  /** Impuesto local configurado por el tenant (placeholder 0%). */
  taxRate: number;
  total: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  customerId: null,
  customerName: null,
  lines: [],
  paymentMethod: "card",
  taxRate: 0,
  setCustomer: (customerId, customerName) => set({ customerId, customerName }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  addItem: (p) =>
    set((s) => {
      const existing = s.lines.find((l) => l.id === p.id);
      if (existing) {
        return { lines: s.lines.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l)) };
      }
      return { lines: [...s.lines, { ...p, qty: 1 }] };
    }),
  removeItem: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
  setQty: (id, qty) =>
    set((s) => ({
      lines: qty <= 0 ? s.lines.filter((l) => l.id !== id) : s.lines.map((l) => (l.id === id ? { ...l, qty } : l)),
    })),
  clear: () => set({ lines: [], customerId: null, customerName: null }),
  subtotal: () => get().lines.reduce((acc, l) => acc + l.price * l.qty, 0),
  total: () => {
    const sub = get().subtotal();
    return sub + sub * get().taxRate;
  },
}));
