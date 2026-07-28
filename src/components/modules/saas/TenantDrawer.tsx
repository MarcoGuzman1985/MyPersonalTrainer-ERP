"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound } from "lucide-react";
import {
  Drawer, Button, Field, Input, Select, Textarea, Badge,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { updateTenant, resetTenantPassword } from "@/lib/api/saas";
import { ApiError } from "@/lib/api/client";
import { IntegrationsTab } from "./IntegrationsTab";
import type { PlanDefinition, Tenant, TenantStatus } from "@/types/saas";

interface TenantDrawerProps {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  plans: PlanDefinition[];
  onUpdated: () => void;
}

const statusOptions: { value: TenantStatus; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "trial", label: "Trial" },
  { value: "past_due", label: "Pago vencido" },
  { value: "suspended", label: "Suspendido" },
];

export function TenantDrawer({ open, onClose, tenant, plans, onUpdated }: TenantDrawerProps) {
  const [owner, setOwner] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [status, setStatus] = useState<TenantStatus>("trial");
  const [plan, setPlan] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [metadataText, setMetadataText] = useState("{}");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ ownerEmail: string; tempPassword: string; emailSent: boolean } | null>(null);

  useEffect(() => {
    if (!tenant) return;
    setOwner(tenant.owner);
    setOwnerEmail(tenant.ownerEmail);
    setStatus(tenant.status);
    setPlan(tenant.plan);
    setMonthlyPrice(String(tenant.mrr));
    setMetadataText(JSON.stringify(tenant.metadata ?? {}, null, 2));
    setSaveError(null);
    setResetError(null);
    setResetResult(null);
  }, [tenant]);

  if (!tenant) return null;

  async function handleSave() {
    let metadata: Record<string, unknown>;
    try {
      metadata = JSON.parse(metadataText || "{}");
    } catch {
      setSaveError("El JSON de Notas IA no es válido.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await updateTenant(tenant!.id, {
        owner,
        ownerEmail,
        status,
        plan,
        monthlyPrice: Number(monthlyPrice),
        metadata,
      });
      onUpdated();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    setResetting(true);
    setResetError(null);
    setResetResult(null);
    try {
      const result = await resetTenantPassword(tenant!.id);
      setResetResult(result);
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : "No se pudo generar la contraseña.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Detalles de inquilino"
      description={tenant.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={handleSave} loading={saving}>Guardar cambios</Button>
        </>
      }
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="soporte">Soporte</TabsTrigger>
          <TabsTrigger value="notas">Notas IA</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-5 space-y-4">
          <Field label="Nombre del dueño" htmlFor="drawer-owner">
            <Input id="drawer-owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </Field>
          <Field label="Correo del dueño" htmlFor="drawer-owner-email">
            <Input
              id="drawer-owner-email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </Field>
          <Field label="Estado de la cuenta" htmlFor="drawer-status" hint="Alta/baja del inquilino en la plataforma.">
            <Select id="drawer-status" value={status} onChange={(e) => setStatus(e.target.value as TenantStatus)}>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
        </TabsContent>

        <TabsContent value="facturacion" className="mt-5 space-y-4">
          <Field label="Plan" htmlFor="drawer-plan">
            <Select id="drawer-plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Precio mensual" htmlFor="drawer-price">
            <Input
              id="drawer-price"
              type="number"
              min={0}
              step={0.01}
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
            />
          </Field>
          <p className="text-xs text-content-subtle">
            MRR actual: {formatCurrency(tenant.mrr)} · Socios: {tenant.members.toLocaleString("es-ES")}
          </p>
        </TabsContent>

        <TabsContent value="soporte" className="mt-5 space-y-4">
          <p className="text-sm text-content-muted">
            Genera una contraseña temporal para el dueño del inquilino. En su próximo
            inicio de sesión deberá cambiarla antes de usar el ERP.
          </p>
          <Button icon={KeyRound} loading={resetting} onClick={handleResetPassword}>
            Generar y enviar nueva contraseña temporal
          </Button>

          {resetError && <p className="text-sm text-red-600">{resetError}</p>}

          {resetResult && (
            <div className="space-y-2 rounded-lg border border-line bg-surface-muted p-4">
              <p className="text-sm text-content-muted">
                Envía esto a <span className="font-medium text-content">{resetResult.ownerEmail}</span>:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-surface px-3 py-2 text-sm font-mono">
                  {resetResult.tempPassword}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  icon={Copy}
                  aria-label="Copiar contraseña"
                  onClick={() => navigator.clipboard.writeText(resetResult.tempPassword)}
                />
              </div>
              <Badge tone="warning">Deberá cambiarla al iniciar sesión</Badge>
              <Badge tone={resetResult.emailSent ? "success" : "danger"} dot>
                {resetResult.emailSent ? "Correo enviado" : "No se pudo enviar el correo — compártela manualmente"}
              </Badge>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notas" className="mt-5 space-y-2">
          <Field label="Notas IA" htmlFor="drawer-metadata" hint="JSON libre para agentes de soporte (contexto, historial, etc.).">
            <Textarea
              id="drawer-metadata"
              value={metadataText}
              onChange={(e) => setMetadataText(e.target.value)}
              className="min-h-[220px] font-mono text-xs"
              spellCheck={false}
            />
          </Field>
        </TabsContent>

        <TabsContent value="integraciones" className="mt-5">
          <IntegrationsTab tenantId={tenant.id} />
        </TabsContent>
      </Tabs>

      {saveError && <p className="mt-4 text-sm text-red-600">{saveError}</p>}
    </Drawer>
  );
}
