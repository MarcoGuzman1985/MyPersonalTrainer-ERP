"use client";

import { useEffect, useState } from "react";
import {
  Upload, Save, Eye, EyeOff, Palette, Receipt, CreditCard, Globe, Image as ImageIcon, FileUp,
} from "lucide-react";
import {
  PageHeader, Card, CardHeader, CardContent, Badge, Button,
  Input, Select, Field,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { tenantSettingsMock } from "@/lib/api/tenant-settings";
import { getRenewals } from "@/lib/api/saas";
import { RenewalUploadModal } from "@/components/modules/tenant-settings/RenewalUploadModal";
import type {
  TenantSettings, GatewayConfig, GatewayProvider,
} from "@/types/tenant-settings";
import type { RenewalStatus, SubscriptionRenewal } from "@/types/saas";
import type { Tone } from "@/types/shared";

const renewalStatusMeta: Record<RenewalStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pendiente de revisión", tone: "warning" },
  approved: { label: "Aprobado", tone: "success" },
  rejected: { label: "Rechazado", tone: "danger" },
};

const gatewayMeta: Record<GatewayProvider, { label: string; hint: string }> = {
  stripe: { label: "Stripe", hint: "Tarjetas internacionales y suscripciones." },
  mercadopago: { label: "MercadoPago", hint: "Pagos en Latinoamérica." },
  paypal: { label: "PayPal", hint: "Cuentas PayPal y tarjetas." },
};

const currencies = [
  { value: "EUR", label: "Euro (EUR €)" },
  { value: "USD", label: "Dólar (USD $)" },
  { value: "MXN", label: "Peso mexicano (MXN $)" },
  { value: "COP", label: "Peso colombiano (COP $)" },
  { value: "ARS", label: "Peso argentino (ARS $)" },
  { value: "PEN", label: "Sol peruano (PEN S/)" },
];

const locales = [
  { value: "es-ES", label: "Español (España)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "es-CO", label: "Español (Colombia)" },
  { value: "es-AR", label: "Español (Argentina)" },
  { value: "es-PE", label: "Español (Perú)" },
];

export default function ConfiguracionPage() {
  // TODO(backend): inicializar con getTenantSettings() en un effect/hook de datos.
  const [settings, setSettings] = useState<TenantSettings>(() =>
    structuredClone(tenantSettingsMock),
  );
  const [logoPreview, setLogoPreview] = useState<string | undefined>(
    tenantSettingsMock.branding.logoUrl,
  );
  const [saving, setSaving] = useState(false);
  const [renewals, setRenewals] = useState<SubscriptionRenewal[]>([]);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);

  function refreshRenewals() {
    getRenewals().then(setRenewals).catch(() => setRenewals([]));
  }

  useEffect(() => {
    refreshRenewals();
  }, []);

  const [revealed, setRevealed] = useState<Record<GatewayProvider, boolean>>({
    stripe: false,
    mercadopago: false,
    paypal: false,
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Vista previa local inmediata; el upload real ocurre al guardar.
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    setSettings((s) => ({ ...s, branding: { ...s.branding, logoUrl: url } }));
    // TODO(backend): subir el archivo a POST /api/tenant/logo y guardar la URL devuelta.
  }

  function patchBranding<K extends keyof TenantSettings["branding"]>(
    key: K,
    value: TenantSettings["branding"][K],
  ) {
    setSettings((s) => ({ ...s, branding: { ...s.branding, [key]: value } }));
  }

  function patchTax<K extends keyof TenantSettings["tax"]>(
    key: K,
    value: TenantSettings["tax"][K],
  ) {
    setSettings((s) => ({ ...s, tax: { ...s.tax, [key]: value } }));
  }

  function patchGateway(provider: GatewayProvider, patch: Partial<GatewayConfig>) {
    setSettings((s) => ({
      ...s,
      gateways: s.gateways.map((g) =>
        g.provider === provider ? { ...g, ...patch } : g,
      ),
    }));
  }

  function handleSave() {
    setSaving(true);
    // TODO(backend): PUT /api/tenant/settings con el cuerpo `settings`.
    setTimeout(() => setSaving(false), 800);
  }

  const { branding, tax, gateways } = settings;

  return (
    <>
      <PageHeader
        title="Configuración del tenant"
        description="Personaliza la marca, la fiscalidad y las pasarelas de pago de tu portal."
        actions={
          <Button icon={Save} loading={saving} onClick={handleSave}>
            Guardar cambios
          </Button>
        }
      />

      <Tabs defaultValue="marca">
        <TabsList>
          <TabsTrigger value="marca">Marca</TabsTrigger>
          <TabsTrigger value="impuestos">Impuestos</TabsTrigger>
          <TabsTrigger value="pasarelas">Pasarelas de pago</TabsTrigger>
          <TabsTrigger value="suscripcion">Suscripción</TabsTrigger>
        </TabsList>

        {/* ---------------------------- MARCA ---------------------------- */}
        <TabsContent value="marca" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-brand-800" /> Identidad visual
                  </span>
                }
                description="Logo, colores y dirección del portal de clientes."
              />
              <CardContent className="space-y-5">
                {/* Logo */}
                <Field label="Logotipo" hint="PNG o SVG, máx. 2 MB. Fondo transparente recomendado.">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-muted">
                      {logoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-content-subtle" />
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-muted">
                      <Upload className="h-4 w-4" />
                      Subir logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                </Field>

                {/* Colores */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Color primario">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        aria-label="Color primario"
                        value={branding.primaryColor}
                        onChange={(e) => patchBranding("primaryColor", e.target.value)}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
                      />
                      <Input
                        value={branding.primaryColor}
                        onChange={(e) => patchBranding("primaryColor", e.target.value)}
                        className="font-mono uppercase"
                      />
                    </div>
                  </Field>
                  <Field label="Color secundario">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        aria-label="Color secundario"
                        value={branding.secondaryColor}
                        onChange={(e) => patchBranding("secondaryColor", e.target.value)}
                        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
                      />
                      <Input
                        value={branding.secondaryColor}
                        onChange={(e) => patchBranding("secondaryColor", e.target.value)}
                        className="font-mono uppercase"
                      />
                    </div>
                  </Field>
                </div>

                {/* Subdominio */}
                <Field label="Subdominio del portal" hint="La dirección pública donde tus clientes acceden.">
                  <div className="flex items-center">
                    <span className="pointer-events-none flex h-10 items-center rounded-l-lg border border-r-0 border-line bg-surface-muted px-3 text-sm text-content-subtle">
                      <Globe className="mr-1.5 h-4 w-4" />
                    </span>
                    <Input
                      value={branding.portalSubdomain ?? ""}
                      onChange={(e) => patchBranding("portalSubdomain", e.target.value)}
                      placeholder="mi-gimnasio"
                      className="rounded-l-none"
                    />
                    <span className="flex h-10 items-center rounded-r-lg border border-l-0 border-line bg-surface-muted px-3 text-sm text-content-subtle">
                      .midominio.app
                    </span>
                  </div>
                </Field>
              </CardContent>
            </Card>

            {/* Previsualización en vivo */}
            <Card>
              <CardHeader
                title="Previsualización en vivo"
                description="Cabecera del portal de tus clientes con la marca actual."
              />
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-line shadow-sm">
                  {/* Cabecera del portal con color primario en vivo */}
                  <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white/90">
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {branding.portalSubdomain || "mi-gimnasio"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform active:scale-95"
                      style={{ backgroundColor: branding.secondaryColor }}
                    >
                      Reservar clase
                    </button>
                  </div>
                  {/* Cuerpo simulado */}
                  <div className="space-y-3 bg-surface p-5">
                    <div className="h-2.5 w-2/3 rounded-full bg-surface-muted" />
                    <div className="h-2.5 w-full rounded-full bg-surface-muted" />
                    <div className="h-2.5 w-4/5 rounded-full bg-surface-muted" />
                    <div className="flex gap-2 pt-2">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                        Etiqueta
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: branding.secondaryColor }}
                      >
                        Acento
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-content-subtle">
                  Los colores se aplican en tiempo real conforme los editas.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* -------------------------- IMPUESTOS -------------------------- */}
        <TabsContent value="impuestos" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-brand-800" /> Fiscalidad y moneda
                </span>
              }
              description="Datos usados en facturas y formatos del portal."
            />
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre del impuesto" hint="Ej. IVA, IGV, IEPS.">
                  <Input
                    value={tax.taxName}
                    onChange={(e) => patchTax("taxName", e.target.value)}
                    placeholder="IVA"
                  />
                </Field>
                <Field label="Tasa (%)">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={tax.taxRate}
                    onChange={(e) => patchTax("taxRate", e.target.valueAsNumber || 0)}
                  />
                </Field>
              </div>

              <Field label="Identificador fiscal" hint="RFC, NIF, CIF, RUC… según tu país.">
                <Input
                  value={tax.taxId}
                  onChange={(e) => patchTax("taxId", e.target.value)}
                  className="font-mono uppercase"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Moneda">
                  <Select
                    value={tax.currency}
                    onChange={(e) => patchTax("currency", e.target.value)}
                  >
                    {currencies.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Locale" hint="Formato de números y fechas.">
                  <Select
                    value={tax.locale}
                    onChange={(e) => patchTax("locale", e.target.value)}
                  >
                    {locales.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------- PASARELAS -------------------------- */}
        <TabsContent value="pasarelas" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {gateways.map((g) => {
              const meta = gatewayMeta[g.provider];
              const tone: Tone = g.enabled ? "success" : "neutral";
              return (
                <Card key={g.provider}>
                  <CardHeader
                    title={
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-brand-800" /> {meta.label}
                      </span>
                    }
                    description={meta.hint}
                    action={
                      <Badge tone={tone} dot>
                        {g.enabled ? "Activa" : "Inactiva"}
                      </Badge>
                    }
                  />
                  <CardContent className="space-y-4">
                    {/* Toggle enabled */}
                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-surface-muted px-4 py-3">
                      <span className="text-sm font-medium text-content">
                        Habilitar pasarela
                      </span>
                      <span className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={g.enabled}
                          onChange={(e) => patchGateway(g.provider, { enabled: e.target.checked })}
                        />
                        <span className="h-6 w-11 rounded-full bg-surface-muted ring-1 ring-inset ring-line transition-colors peer-checked:bg-teal-700" />
                        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                      </span>
                    </label>

                    <Field label="Clave pública">
                      <Input
                        value={g.publicKey}
                        onChange={(e) => patchGateway(g.provider, { publicKey: e.target.value })}
                        placeholder="pk_live_…"
                        className="font-mono text-xs"
                        disabled={!g.enabled}
                      />
                    </Field>

                    <Field label="Clave secreta" hint="Nunca se expone al cliente final.">
                      <div className="flex items-center gap-2">
                        <Input
                          type={revealed[g.provider] ? "text" : "password"}
                          value={g.secretKey}
                          onChange={(e) => patchGateway(g.provider, { secretKey: e.target.value })}
                          placeholder="sk_live_…"
                          className="font-mono text-xs"
                          disabled={!g.enabled}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          icon={revealed[g.provider] ? EyeOff : Eye}
                          aria-label={revealed[g.provider] ? "Ocultar clave" : "Mostrar clave"}
                          onClick={() =>
                            setRevealed((r) => ({ ...r, [g.provider]: !r[g.provider] }))
                          }
                          className={cn(!g.enabled && "pointer-events-none opacity-50")}
                        />
                      </div>
                    </Field>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* -------------------------- SUSCRIPCIÓN -------------------------- */}
        <TabsContent value="suscripcion" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-brand-800" /> Renovación de suscripción
                </span>
              }
              description="Adjunta el comprobante de tu pago para que la plataforma renueve tu cuenta."
              action={
                <Button icon={FileUp} onClick={() => setRenewalModalOpen(true)}>
                  Adjuntar comprobante
                </Button>
              }
            />
            <CardContent className="space-y-3">
              {renewals.length === 0 ? (
                <p className="text-sm text-content-subtle">Aún no has enviado ningún comprobante.</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {renewals.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-content">{formatCurrency(r.amount)}</p>
                        <p className="text-xs text-content-subtle">{formatDateTime(r.createdAt)}</p>
                      </div>
                      <Badge tone={renewalStatusMeta[r.status].tone} dot>
                        {renewalStatusMeta[r.status].label}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RenewalUploadModal
        open={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        onUploaded={refreshRenewals}
      />
    </>
  );
}
