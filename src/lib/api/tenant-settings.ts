import type { TenantSettings } from "@/types/tenant-settings";

/**
 * Capa de datos del módulo "Configuración del Tenant" (marca blanca).
 * MOCK para demo de UI. Para conectar el backend, reemplazar por:
 *   getTenantSettings  -> apiFetch<TenantSettings>("/tenant/settings")
 *   saveTenantSettings -> apiFetch<TenantSettings>("/tenant/settings", { method: "PUT", body })
 *   uploadTenantLogo   -> apiFetch<{ logoUrl: string }>("/tenant/logo", { method: "POST", body: FormData })
 *
 * TODO(backend): GET  /api/tenant/settings
 * TODO(backend): PUT  /api/tenant/settings
 * TODO(backend): POST /api/tenant/logo
 */

export const tenantSettingsMock: TenantSettings = {
  branding: {
    logoUrl: undefined,
    primaryColor: "#1e293b", // brand-800 (azul pizarra)
    secondaryColor: "#0f766e", // teal-700
    portalSubdomain: "ironbox",
  },
  tax: {
    taxName: "IVA",
    taxRate: 16,
    taxId: "ESB12345678",
    currency: "EUR",
    locale: "es-ES",
  },
  gateways: [
    { provider: "stripe", enabled: true, publicKey: "pk_live_51Hxxxxxxxxxxxx", secretKey: "sk_live_51Hxxxxxxxxxxxx" },
    { provider: "mercadopago", enabled: false, publicKey: "", secretKey: "" },
    { provider: "paypal", enabled: false, publicKey: "", secretKey: "" },
  ],
};
