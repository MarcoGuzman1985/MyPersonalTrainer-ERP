"use client";

import { create } from "zustand";
import type { SessionUser, TenantContext } from "@/types/shared";

interface SessionState {
  user: SessionUser | null;
  tenant: TenantContext | null;
  setSession: (user: SessionUser, tenant: TenantContext) => void;
  clear: () => void;
  /** Verifica un permiso RBAC del usuario en sesión. */
  can: (permission: string) => boolean;
}

/**
 * Estado global de sesión y tenant.
 * En producción se hidrata desde el endpoint de sesión:
 *   GET /api/auth/session  -> { user, tenant }
 * Aquí se inicializa con un usuario mock (superadmin) para demo de UI.
 */
const mockUser: SessionUser = {
  id: "usr_1",
  name: "Marco Guzmán",
  email: "guzmanmurillom@gmail.com",
  role: "Superadministrador",
  tenantId: "tnt_1",
  // El superadmin de demo posee todos los permisos *.view.
  permissions: [
    "saas.view", "users.view", "members.view", "pos.view", "schedule.view",
    "access.view", "training.view", "nutrition.view", "crm.view",
    "messaging.view", "inventory.view", "audit.view", "system.view", "tenant.view",
  ],
};

const mockTenant: TenantContext = {
  id: "tnt_1",
  name: "Iron Box CrossFit",
  plan: "pro",
  primaryColor: "#1e3a8a",
  currency: "USD",
  locale: "es-ES",
};

export const useSessionStore = create<SessionState>((set, get) => ({
  user: mockUser,
  tenant: mockTenant,
  setSession: (user, tenant) => set({ user, tenant }),
  clear: () => set({ user: null, tenant: null }),
  can: (permission) => get().user?.permissions.includes(permission) ?? false,
}));
