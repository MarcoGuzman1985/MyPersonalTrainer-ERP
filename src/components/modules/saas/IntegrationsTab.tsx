"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Save } from "lucide-react";
import { Button, Textarea, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getTenantIntegrations, updateTenantIntegration } from "@/lib/api/saas";
import { ApiError } from "@/lib/api/client";
import type { IntegrationProvider, TenantIntegration } from "@/types/saas";

const providerLabels: Record<IntegrationProvider, string> = {
  google_calendar: "Google Calendar",
  meta: "Meta (Facebook/Instagram)",
  whatsapp: "WhatsApp (Evolution API)",
  gemini: "Gemini (IA)",
};

interface IntegrationsTabProps {
  tenantId: string;
}

export function IntegrationsTab({ tenantId }: IntegrationsTabProps) {
  const [integrations, setIntegrations] = useState<TenantIntegration[]>([]);
  const [openProvider, setOpenProvider] = useState<IntegrationProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTenantIntegrations(tenantId)
      .then(setIntegrations)
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false));
  }, [tenantId]);

  function handleSaved(updated: TenantIntegration) {
    setIntegrations((prev) => prev.map((i) => (i.provider === updated.provider ? updated : i)));
  }

  if (loading) {
    return <p className="text-sm text-content-subtle">Cargando integraciones…</p>;
  }

  return (
    <div className="space-y-3">
      {integrations.map((integration) => (
        <IntegrationRow
          key={integration.provider}
          tenantId={tenantId}
          integration={integration}
          open={openProvider === integration.provider}
          onToggle={() =>
            setOpenProvider((p) => (p === integration.provider ? null : integration.provider))
          }
          onSaved={handleSaved}
        />
      ))}
    </div>
  );
}

function IntegrationRow({
  tenantId, integration, open, onToggle, onSaved,
}: {
  tenantId: string;
  integration: TenantIntegration;
  open: boolean;
  onToggle: () => void;
  onSaved: (updated: TenantIntegration) => void;
}) {
  const [credentialsText, setCredentialsText] = useState(
    JSON.stringify(integration.credentials ?? {}, null, 2),
  );
  const [isActive, setIsActive] = useState(integration.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(credentialsText || "{}");
    } catch {
      setError("El JSON de credenciales no es válido.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateTenantIntegration(tenantId, integration.provider, { credentials, isActive });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la integración.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-line">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-content">
          {providerLabels[integration.provider]}
          <Badge tone={integration.isActive ? "success" : "neutral"} dot>
            {integration.isActive ? "Activa" : "Inactiva"}
          </Badge>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-content-subtle transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-line p-4">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-surface-muted px-4 py-2.5">
            <span className="text-sm font-medium text-content">Integración activa</span>
            <span className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="h-6 w-11 rounded-full bg-surface-muted ring-1 ring-inset ring-line transition-colors peer-checked:bg-teal-700" />
              <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
          </label>

          <Textarea
            value={credentialsText}
            onChange={(e) => setCredentialsText(e.target.value)}
            className="min-h-[140px] font-mono text-xs"
            spellCheck={false}
            placeholder='{ "apiKey": "..." }'
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button size="sm" icon={Save} loading={saving} onClick={handleSave}>
            Guardar {providerLabels[integration.provider]}
          </Button>
        </div>
      )}
    </div>
  );
}
