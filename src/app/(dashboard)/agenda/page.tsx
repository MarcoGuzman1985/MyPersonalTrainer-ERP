"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Users, Hourglass,
  CalendarRange, LayoutGrid,
} from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, Button, Progress,
  Avatar, Modal,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { getClasses, getAttendees } from "@/lib/api/schedule";
import type { GymClass } from "@/types/schedule";
import type { Tone } from "@/types/shared";

type CalendarView = "week" | "month";

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_NAMES_LONG = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Rango horario de la grilla semanal.
const HOUR_START = 6;
const HOUR_END = 22;
const SLOT_MIN = 60; // minutos por fila
const ROW_PX = 56; // alto de cada franja

// ---------- helpers de fecha (sin dependencias externas) ----------

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Lunes (00:00) de la semana que contiene `d`. 0 = lunes. */
function mondayOf(d: Date): Date {
  const out = startOfDay(d);
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// ---------- helpers de aforo ----------

function occupancy(c: GymClass): number {
  return c.capacity > 0 ? Math.round((c.booked / c.capacity) * 100) : 0;
}

function occupancyTone(c: GymClass): Tone {
  const pct = occupancy(c);
  if (c.booked >= c.capacity) return "danger";
  if (pct >= 80) return "warning";
  return "success";
}

const TYPE_LABEL: Record<GymClass["type"], string> = {
  crossfit: "CrossFit",
  spinning: "Spinning",
  yoga: "Yoga",
  funcional: "Funcional",
  boxeo: "Boxeo",
  hiit: "HIIT",
};

// ---------- página ----------

export default function AgendaPage() {
  // TODO(backend): sustituir getClasses() por un hook de datos conectado a GET /api/classes?from=&to=.
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<GymClass | null>(null);
  const [booking, setBooking] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Las clases se generan para la semana del ancla; en mensual recogemos
  // las semanas necesarias para cubrir el mes visible.
  const classes = useMemo(() => {
    if (view === "week") return getClasses(anchor);
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const seen = new Set<string>();
    const out: GymClass[] = [];
    for (let cursor = mondayOf(first); cursor <= last; cursor = addDays(cursor, 7)) {
      for (const c of getClasses(cursor)) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          out.push(c);
        }
      }
    }
    return out;
  }, [view, anchor]);

  // KPIs derivados del mock.
  const stats = useMemo(() => {
    const todays = classes.filter((c) => sameDay(new Date(c.start), today));
    const avgOcc =
      classes.length > 0
        ? Math.round(classes.reduce((s, c) => s + occupancy(c), 0) / classes.length)
        : 0;
    const waiting = classes.reduce((s, c) => s + c.waitlist, 0);
    return { todayCount: todays.length, avgOcc, waiting };
  }, [classes, today]);

  const weekStart = mondayOf(anchor);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const goToday = () => setAnchor(new Date());
  const prev = () => setAnchor(view === "week" ? addDays(anchor, -7) : addMonths(anchor, -1));
  const next = () => setAnchor(view === "week" ? addDays(anchor, 7) : addMonths(anchor, 1));

  const rangeLabel =
    view === "week"
      ? `${weekStart.getDate()} – ${addDays(weekStart, 6).getDate()} ${MONTH_NAMES[addDays(weekStart, 6).getMonth()]} ${addDays(weekStart, 6).getFullYear()}`
      : `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;

  return (
    <>
      <PageHeader
        title="Agenda y Clases"
        description="Calendario interactivo de clases con aforo en tiempo real y reservas."
        actions={<Button icon={CalendarDays}>Nueva clase</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Clases hoy" value={stats.todayCount} icon={CalendarDays} accent="teal" />
        <StatCard label="Ocupación media" value={`${stats.avgOcc}%`} icon={Users} />
        <StatCard label="En lista de espera" value={stats.waiting} icon={Hourglass} />
      </div>

      <Card>
        <CardHeader
          title={<span className="capitalize">{rangeLabel}</span>}
          description={view === "week" ? "Vista semanal" : "Vista mensual"}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-line bg-surface p-0.5">
                <button
                  onClick={() => setView("week")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    view === "week" ? "bg-brand-800 text-white" : "text-content-muted hover:text-content",
                  )}
                >
                  <CalendarRange className="h-4 w-4" /> Semana
                </button>
                <button
                  onClick={() => setView("month")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    view === "month" ? "bg-brand-800 text-white" : "text-content-muted hover:text-content",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" /> Mes
                </button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={prev} aria-label="Anterior" icon={ChevronLeft} />
                <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
                <Button variant="outline" size="icon" onClick={next} aria-label="Siguiente" icon={ChevronRight} />
              </div>
            </div>
          }
        />
        <CardContent className="p-0">
          {view === "week" ? (
            <WeekGrid days={weekDays} today={today} classes={classes} onSelect={setSelected} />
          ) : (
            <MonthGrid anchor={anchor} today={today} classes={classes} onSelect={setSelected} />
          )}
        </CardContent>
      </Card>

      <ClassModal
        cls={selected}
        booking={booking}
        onClose={() => setSelected(null)}
        onBook={() => {
          // TODO(backend): POST /api/classes/:id/book
          setBooking(true);
          window.setTimeout(() => setBooking(false), 800);
        }}
      />
    </>
  );
}

// ---------- vista semanal ----------

function WeekGrid({
  days, today, classes, onSelect,
}: {
  days: Date[];
  today: Date;
  classes: GymClass[];
  onSelect: (c: GymClass) => void;
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[840px]">
        {/* Cabecera de días */}
        <div className="grid border-b border-line" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div className="border-r border-line" />
          {days.map((d, i) => {
            const isToday = sameDay(d, today);
            return (
              <div
                key={i}
                className={cn(
                  "border-r border-line px-2 py-2 text-center last:border-r-0",
                  isToday && "bg-brand-50/60 dark:bg-brand-800/10",
                )}
              >
                <p className="text-xs font-medium text-content-muted">{DAY_NAMES[i]}</p>
                <p className={cn("text-sm font-semibold", isToday ? "text-brand-800 dark:text-brand-300" : "text-content")}>
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Cuerpo: columna de horas + 7 columnas de días */}
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          {/* Eje horario */}
          <div className="border-r border-line">
            {hours.map((h) => (
              <div key={h} className="relative border-b border-line" style={{ height: ROW_PX }}>
                <span className="absolute -top-2 right-1 text-[10px] tabular-nums text-content-subtle">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Columnas por día */}
          {days.map((day, di) => {
            const dayClasses = classes.filter((c) => sameDay(new Date(c.start), day));
            const isToday = sameDay(day, today);
            return (
              <div
                key={di}
                className={cn("relative border-r border-line last:border-r-0", isToday && "bg-brand-50/30 dark:bg-brand-800/5")}
                style={{ height: ROW_PX * hours.length }}
              >
                {/* líneas de franja */}
                {hours.map((h) => (
                  <div key={h} className="border-b border-line" style={{ height: ROW_PX }} />
                ))}
                {/* tarjetas posicionadas */}
                {dayClasses.map((c) => {
                  const start = new Date(c.start);
                  const end = new Date(c.end);
                  const minutesFromTop = (start.getHours() - HOUR_START) * 60 + start.getMinutes();
                  const durationMin = (end.getTime() - start.getTime()) / 60_000;
                  const top = (minutesFromTop / SLOT_MIN) * ROW_PX;
                  const height = Math.max(28, (durationMin / SLOT_MIN) * ROW_PX - 4);
                  return (
                    <WeekCard key={c.id} cls={c} top={top} height={height} onSelect={onSelect} />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekCard({
  cls, top, height, onSelect,
}: {
  cls: GymClass;
  top: number;
  height: number;
  onSelect: (c: GymClass) => void;
}) {
  const tone = occupancyTone(cls);
  const full = cls.booked >= cls.capacity;
  const accent: Record<Tone, string> = {
    neutral: "border-l-content-subtle",
    brand: "border-l-brand-700",
    success: "border-l-teal-600",
    warning: "border-l-amber-500",
    danger: "border-l-red-500",
    info: "border-l-sky-500",
  };
  return (
    <button
      onClick={() => onSelect(cls)}
      style={{ top, height }}
      className={cn(
        "absolute left-1 right-1 flex flex-col gap-0.5 overflow-hidden rounded-md border border-l-4 border-line bg-surface-elevated px-2 py-1 text-left shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-brand-500",
        accent[tone],
      )}
    >
      <p className="truncate text-xs font-semibold text-content">{cls.title}</p>
      <p className="truncate text-[10px] text-content-muted">
        {fmtHour(cls.start)} · {cls.coach}
      </p>
      {height > 48 && (
        <>
          <p className="text-[10px] font-medium text-content-subtle">
            {cls.booked}/{cls.capacity} cupos
          </p>
          <Progress value={occupancy(cls)} tone={tone} className="h-1" />
        </>
      )}
      {full && cls.waitlist > 0 && (
        <Badge tone="danger" className="mt-0.5 px-1.5 py-0 text-[9px]">
          Espera ({cls.waitlist})
        </Badge>
      )}
    </button>
  );
}

// ---------- vista mensual ----------

function MonthGrid({
  anchor, today, classes, onSelect,
}: {
  anchor: Date;
  today: Date;
  classes: GymClass[];
  onSelect: (c: GymClass) => void;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = mondayOf(first);
  // 6 semanas cubren cualquier configuración de mes.
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {DAY_NAMES.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-content-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = sameDay(day, today);
          const dayClasses = classes
            .filter((c) => sameDay(new Date(c.start), day))
            .sort((a, b) => +new Date(a.start) - +new Date(b.start));
          return (
            <div
              key={i}
              className={cn(
                "min-h-[112px] border-b border-r border-line p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-surface-muted/40",
                isToday && "bg-brand-50/50 dark:bg-brand-800/10",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday
                      ? "bg-brand-800 text-white"
                      : inMonth ? "text-content" : "text-content-subtle",
                  )}
                >
                  {day.getDate()}
                </span>
                {dayClasses.length > 0 && (
                  <Badge tone="neutral" className="px-1.5 py-0 text-[9px]">
                    {dayClasses.length}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {dayClasses.slice(0, 3).map((c) => {
                  const tone = occupancyTone(c);
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelect(c)}
                      className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] text-content-muted transition hover:bg-surface-muted"
                    >
                      <Badge tone={tone} dot className="border-0 bg-transparent p-0 ring-0" />
                      <span className="truncate">{fmtHour(c.start)} {c.title}</span>
                    </button>
                  );
                })}
                {dayClasses.length > 3 && (
                  <p className="px-1 text-[10px] text-content-subtle">+{dayClasses.length - 3} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- modal de detalle ----------

function ClassModal({
  cls, booking, onClose, onBook,
}: {
  cls: GymClass | null;
  booking: boolean;
  onClose: () => void;
  onBook: () => void;
}) {
  const attendees = useMemo(() => (cls ? getAttendees(cls) : []), [cls]);
  if (!cls) return null;

  const tone = occupancyTone(cls);
  const full = cls.booked >= cls.capacity;
  const start = new Date(cls.start);
  const dayIdx = (start.getDay() + 6) % 7;

  return (
    <Modal
      open={!!cls}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          {cls.title}
          <Badge tone="brand">{TYPE_LABEL[cls.type]}</Badge>
        </span>
      }
      description={`${DAY_NAMES_LONG[dayIdx]} · ${start.getDate()} ${MONTH_NAMES[start.getMonth()]}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button
            variant={full ? "outline" : "success"}
            loading={booking}
            onClick={onBook}
          >
            {full ? "Unirse a lista de espera" : "Reservar"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-content-muted">
            <Clock className="h-4 w-4 text-content-subtle" />
            {fmtHour(cls.start)} – {fmtHour(cls.end)}
          </div>
          <div className="flex items-center gap-2 text-content-muted">
            <MapPin className="h-4 w-4 text-content-subtle" />
            {cls.room}
          </div>
          <div className="flex items-center gap-2 text-content-muted">
            <Users className="h-4 w-4 text-content-subtle" />
            Coach {cls.coach}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface-muted/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-content">Aforo</span>
            <span className="text-sm font-semibold text-content">{cls.booked}/{cls.capacity} cupos</span>
          </div>
          <Progress value={occupancy(cls)} tone={tone} />
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={tone} dot>{occupancy(cls)}% ocupado</Badge>
            {full && cls.waitlist > 0 && (
              <Badge tone="danger">Lista de espera ({cls.waitlist})</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-content">Inscritos ({attendees.length})</p>
        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {attendees.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-surface-muted">
              <Avatar name={a.name} src={a.avatarUrl} size="sm" />
              <span className="flex-1 truncate text-sm text-content">{a.name}</span>
              {a.waitlisted && <Badge tone="warning" className="text-[10px]">En espera</Badge>}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
