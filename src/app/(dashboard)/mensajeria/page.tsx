"use client";

import { useMemo, useRef, useState } from "react";
import {
  Send,
  CheckCheck,
  Eye,
  EyeOff,
  XCircle,
  PlugZap,
  Variable,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardContent,
  Badge,
  DataTable,
  Button,
  Input,
  Textarea,
  Field,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type Column,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import {
  evolutionConfigMock,
  templateVariablesMock,
  templatesMock,
  sendLogsMock,
} from "@/lib/api/messaging";
import type { EvolutionConfig, SendLog, SendStatus } from "@/types/messaging";
import type { Tone } from "@/types/shared";

const statusMeta: Record<SendStatus, { label: string; tone: Tone }> = {
  queued: { label: "En cola", tone: "neutral" },
  sent: { label: "Enviado", tone: "info" },
  delivered: { label: "Entregado", tone: "brand" },
  read: { label: "Leído", tone: "success" },
  failed: { label: "Fallido", tone: "danger" },
};

export default function MensajeriaPage() {
  // TODO(backend): sustituir mocks por GET /api/messaging/logs + config de la instancia.
  const [config, setConfig] = useState<EvolutionConfig>(evolutionConfigMock);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const [body, setBody] = useState(templatesMock[0]?.body ?? "");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const logs = sendLogsMock;

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const sentToday = logs.filter((l) => new Date(l.sentAt).toDateString() === today).length;
    const delivered = logs.filter((l) => l.status === "delivered" || l.status === "read").length;
    const read = logs.filter((l) => l.status === "read").length;
    const failed = logs.filter((l) => l.status === "failed").length;
    return { sentToday, delivered, read, failed };
  }, [logs]);

  /** Inserta {{variable}} en la posición del cursor del textarea. */
  function insertVariable(key: string) {
    const token = `{{${key}}}`;
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    // Reposiciona el cursor justo después del token insertado.
    requestAnimationFrame(() => {
      const pos = start + token.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  /** Reemplaza {{variables}} por sus valores de ejemplo para la previsualización. */
  const preview = useMemo(() => {
    return templateVariablesMock.reduce(
      (acc, v) => acc.replaceAll(`{{${v.key}}}`, v.sample),
      body,
    );
  }, [body]);

  function handleTestConnection() {
    // TODO(backend): POST /api/messaging/evolution/test con instanceName/baseUrl/apiKey.
    setTesting(true);
    setTimeout(() => setTesting(false), 900);
  }

  const columns: Column<SendLog>[] = [
    {
      key: "recipient",
      header: "Destinatario",
      cell: (l) => (
        <div>
          <p className="font-medium text-content">{l.recipient}</p>
          {l.error && <p className="text-xs text-red-500">{l.error}</p>}
        </div>
      ),
    },
    { key: "phone", header: "Teléfono", cell: (l) => <span className="text-content-muted">{l.phone}</span> },
    { key: "templateName", header: "Plantilla", cell: (l) => <span className="text-content-muted">{l.templateName}</span> },
    {
      key: "status",
      header: "Estado",
      cell: (l) => <Badge tone={statusMeta[l.status].tone} dot>{statusMeta[l.status].label}</Badge>,
    },
    {
      key: "sentAt",
      header: "Fecha",
      align: "right",
      cell: (l) => <span className="text-content-muted">{formatDateTime(l.sentAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Mensajería masiva"
        description="Envía campañas de WhatsApp con plantillas dinámicas vía Evolution API."
        actions={<Button icon={Send}>Nuevo envío</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enviados hoy" value={stats.sentToday} icon={Send} />
        <StatCard label="Entregados" value={stats.delivered} icon={CheckCheck} accent="teal" />
        <StatCard label="Leídos" value={stats.read} icon={Eye} accent="teal" />
        <StatCard label="Fallidos" value={stats.failed} icon={XCircle} />
      </div>

      <Tabs defaultValue="plantilla" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plantilla">Editor de plantillas</TabsTrigger>
          <TabsTrigger value="config">Conexión</TabsTrigger>
          <TabsTrigger value="logs">Logs de envío</TabsTrigger>
        </TabsList>

        {/* EDITOR DE PLANTILLAS */}
        <TabsContent value="plantilla">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Editor de plantilla"
                description="Redacta el mensaje e inserta variables dinámicas."
              />
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-content">
                    <Variable className="h-4 w-4 text-brand-800 dark:text-brand-300" />
                    Insertar variable
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {templateVariablesMock.map((v) => (
                      <Button
                        key={v.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(v.key)}
                      >
                        {`{{${v.key}}}`}
                      </Button>
                    ))}
                  </div>
                </div>

                <Field label="Cuerpo del mensaje" htmlFor="msg-body" hint="Las variables se reemplazan al enviar.">
                  <Textarea
                    id="msg-body"
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    placeholder="Hola {{nombre}}, tu plan {{plan}} vence el {{vencimiento}}…"
                  />
                </Field>

                <p className="text-right text-xs text-content-subtle">
                  {body.length} caracteres
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Previsualización en vivo"
                description="Vista con datos de ejemplo de un cliente."
              />
              <CardContent>
                <div className="rounded-xl bg-surface-muted p-4">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-700 px-4 py-2.5 text-sm text-white shadow-sm">
                    {preview.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < preview.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs text-content-subtle">
                  Variables de ejemplo:{" "}
                  {templateVariablesMock.map((v) => `${v.label} = "${v.sample}"`).join(" · ")}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONFIGURACIÓN EVOLUTION API */}
        <TabsContent value="config">
          <Card>
            <CardHeader
              title="Conexión Evolution API"
              description="Credenciales de la instancia de WhatsApp."
              action={
                config.connected ? (
                  <Badge tone="success" dot>Conectado</Badge>
                ) : (
                  <Badge tone="danger" dot>Desconectado</Badge>
                )
              }
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre de instancia" htmlFor="cfg-instance">
                  <Input
                    id="cfg-instance"
                    value={config.instanceName}
                    onChange={(e) => setConfig((c) => ({ ...c, instanceName: e.target.value }))}
                    placeholder="mi-instancia"
                  />
                </Field>
                <Field label="URL base" htmlFor="cfg-url">
                  <Input
                    id="cfg-url"
                    value={config.baseUrl}
                    onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))}
                    placeholder="https://evolution.tudominio.com"
                  />
                </Field>
              </div>

              <Field label="API Key" htmlFor="cfg-apikey" hint="Token de autenticación de la instancia.">
                <div className="relative">
                  <Input
                    id="cfg-apikey"
                    type={showApiKey ? "text" : "password"}
                    value={config.apiKey}
                    onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                    className="pr-11"
                    placeholder="evo_sk_…"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((s) => !s)}
                    aria-label={showApiKey ? "Ocultar API Key" : "Mostrar API Key"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-content-subtle hover:text-content"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {config.phoneNumber && (
                <p className="text-sm text-content-muted">
                  Número vinculado:{" "}
                  <span className="font-medium text-content">{config.phoneNumber}</span>
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  icon={PlugZap}
                  loading={testing}
                  onClick={handleTestConnection}
                >
                  Probar conexión
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOGS DE ENVÍO */}
        <TabsContent value="logs">
          <Card>
            <CardHeader
              title="Logs de envío"
              description="Estado de cada mensaje enviado a tus contactos."
            />
            <CardContent className="p-0">
              <DataTable columns={columns} rows={logs} rowKey={(l) => l.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
