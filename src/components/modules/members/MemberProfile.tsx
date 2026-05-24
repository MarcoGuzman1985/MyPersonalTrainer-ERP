"use client";

import { useMemo } from "react";
import {
  Mail, Phone, Cake, VenetianMask, CalendarClock, Snowflake, RefreshCw, CalendarCheck, Activity, X,
} from "lucide-react";
import {
  Avatar, Badge, Button, Card, CardContent, CardHeader, DataTable, StatCard,
  Tabs, TabsContent, TabsList, TabsTrigger, type Column,
} from "@/components/ui";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Tone } from "@/types/shared";
import type {
  AnthropometricEntry, AttendanceRecord, Gender, Member, MembershipStatus,
} from "@/types/members";
import { EvolutionChart } from "./EvolutionChart";

export const statusMeta: Record<MembershipStatus, { label: string; tone: Tone }> = {
  active: { label: "Activa", tone: "success" },
  expired: { label: "Vencida", tone: "danger" },
  frozen: { label: "Congelada", tone: "warning" },
};

const genderLabel: Record<Gender, string> = {
  male: "Masculino",
  female: "Femenino",
  other: "Otro",
};

/** Calcula la edad a partir de una fecha de nacimiento ISO. */
function ageFrom(iso: string): number {
  const b = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** Fila de definición etiqueta/valor para vistas de solo lectura. */
function DefRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-content-subtle" />
      <div className="min-w-0">
        <p className="text-xs text-content-subtle">{label}</p>
        <p className="truncate text-sm font-medium text-content">{value}</p>
      </div>
    </div>
  );
}

interface MemberProfileProps {
  member: Member;
  /** Cierra el panel (móvil / vista conmutada). */
  onClose?: () => void;
  className?: string;
}

/** Perfil 360° del socio con pestañas: datos, suscripción, antropométricos y asistencia. */
export function MemberProfile({ member, onClose, className }: MemberProfileProps) {
  const { subscription: sub } = member;
  const subTone = statusMeta[sub.status];

  // Mediciones recientes primero para la mini-tabla.
  const recentMeasures = useMemo(
    () => [...member.anthropometrics].reverse().slice(0, 5),
    [member.anthropometrics],
  );

  // Asistencias del mes en curso para el StatCard.
  const attendanceThisMonth = useMemo(() => {
    const now = new Date();
    return member.attendance.filter((a) => {
      const d = new Date(a.checkInAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [member.attendance]);

  const measureColumns: Column<AnthropometricEntry>[] = [
    { key: "date", header: "Fecha", cell: (m) => formatDate(m.date) },
    { key: "weight", header: "Peso", align: "right", cell: (m) => `${m.weightKg} kg` },
    { key: "fat", header: "% Grasa", align: "right", cell: (m) => `${m.bodyFatPct} %` },
    {
      key: "muscle",
      header: "M. muscular",
      align: "right",
      cell: (m) => (m.muscleMassKg != null ? `${m.muscleMassKg} kg` : "—"),
    },
  ];

  const attendanceColumns: Column<AttendanceRecord>[] = [
    { key: "when", header: "Fecha y hora", cell: (a) => formatDateTime(a.checkInAt) },
    { key: "class", header: "Clase", cell: (a) => <span className="font-medium text-content">{a.classType}</span> },
    { key: "coach", header: "Entrenador", cell: (a) => a.coach ?? "—" },
  ];

  return (
    <Card className={cn("flex flex-col", className)}>
      {/* Cabecera del perfil */}
      <CardHeader
        action={
          onClose && (
            <Button variant="ghost" size="icon" icon={X} onClick={onClose} aria-label="Cerrar perfil" />
          )
        }
      >
        <div className="flex items-center gap-3">
          <Avatar name={member.name} src={member.avatarUrl} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-content">{member.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={subTone.tone} dot>{subTone.label}</Badge>
              <Badge tone="brand" className="capitalize">{sub.plan}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="datos">
          <TabsList>
            <TabsTrigger value="datos">Datos personales</TabsTrigger>
            <TabsTrigger value="suscripcion">Suscripción</TabsTrigger>
            <TabsTrigger value="antropometricos">Antropométricos</TabsTrigger>
            <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          </TabsList>

          {/* 1) Datos personales */}
          <TabsContent value="datos" className="pt-4">
            <div className="flex flex-col items-center gap-2 pb-2">
              <Avatar name={member.name} src={member.avatarUrl} size="lg" className="h-20 w-20 text-xl" />
              <p className="text-base font-semibold text-content">{member.name}</p>
            </div>
            <div className="divide-y divide-line">
              <DefRow icon={Mail} label="Correo" value={<a href={`mailto:${member.email}`} className="hover:underline">{member.email}</a>} />
              <DefRow icon={Phone} label="Teléfono" value={member.phone} />
              <DefRow icon={VenetianMask} label="Género" value={genderLabel[member.gender]} />
              <DefRow icon={Cake} label="Nacimiento" value={`${formatDate(member.birthDate)} · ${ageFrom(member.birthDate)} años`} />
              <DefRow icon={CalendarCheck} label="Socio desde" value={formatDate(member.createdAt)} />
            </div>
            {member.tags.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs text-content-subtle">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {member.tags.map((t) => (
                    <Badge key={t} tone="info">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 2) Suscripción */}
          <TabsContent value="suscripcion" className="pt-4">
            <div className="rounded-xl border border-line bg-surface-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-content-muted">Estado de la membresía</span>
                <Badge tone={subTone.tone} dot>{subTone.label}</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-content-subtle">Plan</dt>
                  <dd className="font-medium capitalize text-content">{sub.plan}</dd>
                </div>
                <div>
                  <dt className="text-content-subtle">Cuota</dt>
                  <dd className="font-medium text-content">{formatCurrency(sub.price)}</dd>
                </div>
                <div>
                  <dt className="text-content-subtle">Inicio</dt>
                  <dd className="font-medium text-content">{formatDate(sub.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-content-subtle">Vencimiento</dt>
                  <dd className="font-medium text-content">{formatDate(sub.endDate)}</dd>
                </div>
                <div>
                  <dt className="text-content-subtle">Renovación automática</dt>
                  <dd className="font-medium text-content">{sub.autoRenew ? "Sí" : "No"}</dd>
                </div>
                {sub.frozenUntil && (
                  <div>
                    <dt className="text-content-subtle">Reactiva el</dt>
                    <dd className="font-medium text-content">{formatDate(sub.frozenUntil)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="success"
                icon={RefreshCw}
                // TODO(backend): POST /api/members/:id/subscription/renew { plan, periods }
                onClick={() => {}}
              >
                Renovar membresía
              </Button>
              {sub.status === "frozen" ? (
                <Button
                  variant="outline"
                  icon={Activity}
                  // TODO(backend): POST /api/members/:id/subscription/unfreeze
                  onClick={() => {}}
                >
                  Reactivar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  icon={Snowflake}
                  // TODO(backend): POST /api/members/:id/subscription/freeze { until }
                  onClick={() => {}}
                >
                  Congelar
                </Button>
              )}
            </div>
          </TabsContent>

          {/* 3) Antropométricos */}
          <TabsContent value="antropometricos" className="pt-4">
            <Card className="shadow-none">
              <CardHeader title="Evolución" description="Peso y porcentaje de grasa a lo largo del tiempo." />
              <CardContent>
                <EvolutionChart entries={member.anthropometrics} />
              </CardContent>
            </Card>
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-content">Últimas mediciones</p>
              <DataTable
                columns={measureColumns}
                rows={recentMeasures}
                rowKey={(m) => m.id}
                emptyMessage="Sin mediciones registradas."
              />
            </div>
          </TabsContent>

          {/* 4) Asistencia */}
          <TabsContent value="asistencia" className="pt-4">
            <div className="mb-4">
              <StatCard
                label="Asistencias este mes"
                value={attendanceThisMonth}
                icon={CalendarClock}
                accent="teal"
              />
            </div>
            <DataTable
              columns={attendanceColumns}
              rows={member.attendance}
              rowKey={(a) => a.id}
              emptyMessage="Sin check-ins registrados."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
