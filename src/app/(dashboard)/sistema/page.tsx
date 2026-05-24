"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Gauge,
  Timer,
  Zap,
  Bell,
  Mail,
  Webhook,
  Check,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  Progress,
  Select,
  Field,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Modal,
} from "@/components/ui";
import { cn, formatDateTime } from "@/lib/utils";
import { systemErrorsMock, alertRulesMock, healthStatsMock } from "@/lib/api/system";
import type { AlertChannel, AlertRule, HealthStat, LogLevel, SystemError } from "@/types/system";
import type { Tone } from "@/types/shared";

const levelMeta: Record<LogLevel, { label: string; tone: Tone }> = {
  error: { label: "Error", tone: "danger" },
  warning: { label: "Advertencia", tone: "warning" },
  info: { label: "Info", tone: "info" },
};

const channelMeta: Record<AlertChannel, { label: string; tone: Tone; icon: LucideIcon }> = {
  push: { label: "Push", tone: "brand", icon: Bell },
  email: { label: "Email", tone: "info", icon: Mail },
  webhook: { label: "Webhook", tone: "neutral", icon: Webhook },
};

/** Devuelve el tono de una métrica de salud según sus umbrales. */
function healthTone(stat: HealthStat): Tone {
  if (stat.value >= stat.dangerAt) return "danger";
  if (stat.value >= stat.warnAt) return "warning";
  return "success";
}

/** Switch mínimo accesible para alternar el estado de una regla. */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2",
        checked ? "bg-brand-800" : "bg-surface-muted border border-line",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export default function SystemHealthPage() {
  // TODO(backend): sustituir mocks por getErrors()/getAlerts()/getHealth() en un hook de datos.
  const [errors, setErrors] = useState<SystemError[]>(systemErrorsMock);
  const [rules, setRules] = useState<AlertRule[]>(alertRulesMock);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [stackOf, setStackOf] = useState<SystemError | null>(null);

  const filteredErrors = useMemo(
    () => (levelFilter === "all" ? errors : errors.filter((e) => e.level === levelFilter)),
    [errors, levelFilter],
  );

  function toggleResolved(id: string) {
    // TODO(backend): PATCH /api/system/errors/:id { resolved }
    setErrors((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: !e.resolved } : e)));
  }

  function toggleRule(id: string) {
    // TODO(backend): PATCH /api/system/alerts/:id { enabled }
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  return (
    <>
      <PageHeader
        title="Salud del sistema"
        description="Centro de control de métricas, excepciones en desarrollo y alertas internas."
      />

      <Tabs defaultValue="salud">
        <TabsList>
          <TabsTrigger value="salud">Salud</TabsTrigger>
          <TabsTrigger value="excepciones">Excepciones</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- Salud */}
        <TabsContent value="salud" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Uptime (30d)" value="99,97%" icon={Activity} accent="teal" delta={0.02} />
            <StatCard label="Tasa de errores" value="0,41%" icon={AlertTriangle} delta={-0.12} />
            <StatCard label="Peticiones/min" value="1.284" icon={Zap} delta={3.6} />
            <StatCard label="Latencia media" value="148 ms" icon={Timer} delta={-5.1} accent="teal" />
          </div>

          <Card>
            <CardHeader title="Uso de recursos" description="Consumo en tiempo real de la infraestructura." />
            <CardContent className="space-y-5">
              {healthStatsMock.map((stat) => {
                const tone = healthTone(stat);
                return (
                  <div key={stat.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-content">
                        <Gauge className="h-4 w-4 text-content-subtle" />
                        {stat.label}
                      </span>
                      <span className="flex items-center gap-2 font-medium text-content">
                        {stat.value}%
                        {tone !== "success" && (
                          <Badge tone={tone} dot>
                            {tone === "danger" ? "Crítico" : "Alto"}
                          </Badge>
                        )}
                      </span>
                    </div>
                    <Progress value={stat.value} tone={tone} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------------- Excepciones */}
        <TabsContent value="excepciones" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <Field label="Filtrar por nivel">
                <Select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as LogLevel | "all")}
                >
                  <option value="all">Todos los niveles</option>
                  <option value="error">Errores</option>
                  <option value="warning">Advertencias</option>
                  <option value="info">Información</option>
                </Select>
              </Field>
            </div>
            <p className="text-sm text-content-subtle">
              {filteredErrors.length} evento{filteredErrors.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="space-y-3">
            {filteredErrors.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-content-subtle">
                  No hay eventos para este filtro.
                </CardContent>
              </Card>
            ) : (
              filteredErrors.map((err) => (
                <Card key={err.id} className={cn(err.resolved && "opacity-60")}>
                  <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge tone={levelMeta[err.level].tone} dot>
                          {levelMeta[err.level].label}
                        </Badge>
                        {err.resolved && <Badge tone="success">Resuelto</Badge>}
                        <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-content-muted">
                          {err.source}
                        </span>
                      </div>
                      <p className="break-words font-medium text-content">{err.message}</p>
                      <p className="mt-1 text-xs text-content-subtle">
                        {err.count.toLocaleString("es-ES")} ocurrencias · última vez{" "}
                        {formatDateTime(err.lastSeen)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {err.stack && (
                        <Button variant="ghost" size="sm" onClick={() => setStackOf(err)}>
                          Ver stack
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={err.resolved ? RotateCcw : Check}
                        onClick={() => toggleResolved(err.id)}
                      >
                        {err.resolved ? "Reabrir" : "Resolver"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- Alertas */}
        <TabsContent value="alertas" className="space-y-3">
          <p className="text-sm text-content-muted">
            Bandeja de configuración de alertas internas. Activa o desactiva cada regla y revisa su umbral.
          </p>
          {rules.map((rule) => {
            const ch = channelMeta[rule.channel];
            const ChIcon = ch.icon;
            return (
              <Card key={rule.id}>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-medium text-content">{rule.name}</p>
                      <Badge tone={ch.tone}>
                        <ChIcon className="h-3 w-3" />
                        {ch.label}
                      </Badge>
                      <span className="text-xs text-content-subtle">Umbral: {rule.threshold}</span>
                    </div>
                    <p className="text-sm text-content-muted">{rule.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs font-medium text-content-subtle">
                      {rule.enabled ? "Activa" : "Inactiva"}
                    </span>
                    <Switch
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      label={`Alternar regla ${rule.name}`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <Modal
        open={stackOf !== null}
        onClose={() => setStackOf(null)}
        title="Traza de la excepción"
        description={stackOf?.message}
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setStackOf(null)}>
            Cerrar
          </Button>
        }
      >
        <pre className="max-h-96 overflow-auto rounded-lg border border-line bg-surface-muted p-4 font-mono text-xs leading-relaxed text-content-muted">
          {stackOf?.stack ?? "Sin traza disponible."}
        </pre>
      </Modal>
    </>
  );
}
