/**
 * Tipos del módulo "Configuración del Tenant" (marca blanca).
 * Define la personalización visual, fiscal y de pasarelas de pago
 * que cada inquilino aplica a su propio portal de clientes.
 */

/** Identidad visual del portal del inquilino (logo y colores de marca). */
export interface Branding {
  /** URL del logotipo subido. Opcional hasta que se cargue. */
  logoUrl?: string;
  /** Color primario de marca en formato HEX (#RRGGBB). */
  primaryColor: string;
  /** Color secundario/acento en formato HEX (#RRGGBB). */
  secondaryColor: string;
  /** Subdominio público del portal del cliente (ej. "ironbox" -> ironbox.midominio.app). */
  portalSubdomain?: string;
}

/** Configuración fiscal y de formato regional aplicada a facturación. */
export interface TaxSettings {
  /** Nombre del impuesto mostrado (ej. "IVA", "IGV"). */
  taxName: string;
  /** Tasa porcentual del impuesto (ej. 16 = 16%). */
  taxRate: number;
  /** Identificador fiscal del negocio (RFC, NIF, RUC…). */
  taxId: string;
  /** Código ISO de la moneda (ej. "EUR", "MXN", "USD"). */
  currency: string;
  /** Locale BCP-47 para formato de números/fechas (ej. "es-ES"). */
  locale: string;
}

/** Proveedores de pasarela de pago soportados. */
export type GatewayProvider = "stripe" | "mercadopago" | "paypal";

/** Credenciales y estado de una pasarela de pago concreta. */
export interface GatewayConfig {
  provider: GatewayProvider;
  /** Si la pasarela está activa para cobros. */
  enabled: boolean;
  /** Clave pública/publishable (segura para frontend). */
  publicKey: string;
  /** Clave secreta (sensible, nunca se expone al cliente final). */
  secretKey: string;
}

/** Configuración completa del inquilino para personalización de marca blanca. */
export interface TenantSettings {
  branding: Branding;
  tax: TaxSettings;
  gateways: GatewayConfig[];
}
