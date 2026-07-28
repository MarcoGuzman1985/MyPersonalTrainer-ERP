"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Users, Hourglass,
  CalendarRange, LayoutGrid, CalendarClock, Settings, Search, FileDown, X,
} from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, Button, Progress,
  Avatar, Modal, Select, Input,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { getClasses, getAttendees, bookClass } from "@/lib/api/schedule";
import { getRooms } from "@/lib/api/rooms";
import { getCoaches } from "@/lib/api/coaches";
import { getMembers } from "@/lib/api/members";
import { ApiError } from "@/lib/api/client";
import { RoomManagerModal } from "@/components/modules/schedule/RoomManagerModal";
import { CoachManagerModal } from "@/components/modules/schedule/CoachManagerModal";
import { NewClassModal } from "@/components/modules/schedule/NewClassModal";
import type { ClassAttendee, Coach, GymClass, Room } from "@/types/schedule";
import type { Member } from "@/types/members";
import type { Tone } from "@/types/shared";

type CalendarView = "day" | "week" | "month";

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAY_NAMES_LONG = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const HOUR_START = 6;
const HOUR_END = 22;
const SLOT_MIN = 60;
const ROW_PX = 56;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function fmtHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

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
  crossfit: "CrossFit", spinning: "Spinning", yoga: "Yoga",
  funcional: "Funcional", boxeo: "Boxeo", hiit: "HIIT",
};

export default function AgendaPage() {
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<GymClass | null>(null);
  const [newClassOpen, setNewClassOpen] = useState(false);
  const [roomManagerOpen, setRoomManagerOpen] = useState(false);
  const [coachManagerOpen, setCoachManagerOpen] = useState(false);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);

  const [roomFilter, setRoomFilter] = useState("");
  const [coachFilter, setCoachFilter] = useState("");
  const [memberFilter, setMemberFilter] = useState<{ id: string; name: string } | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<Member[]>([]);

  const today = useMemo(() => startOfDay(new Date()), []);

  function refreshCoaches() {
    return getCoaches().then(setCoaches).catch(() => setCoaches([]));
  }

  useEffect(() => {
    getRooms().then(setRooms).catch(() => setRooms([]));
    refreshCoaches();
  }, []);

  const { rangeFrom, rangeTo } = useMemo(() => {
    if (view === "day") {
      return { rangeFrom: startOfDay(anchor), rangeTo: addDays(startOfDay(anchor), 1) };
    }
    if (view === "week") {
      const start = mondayOf(anchor);
      return { rangeFrom: start, rangeTo: addDays(start, 7) };
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = mondayOf(first);
    return { rangeFrom: gridStart, rangeTo: addDays(gridStart, 42) };
  }, [view, anchor]);

  function refreshClasses() {
    setLoading(true);
    return getClasses({
      from: rangeFrom.toISOString(),
      to: rangeTo.toISOString(),
      roomId: roomFilter || null,
      coachId: coachFilter || null,
      memberId: memberFilter?.id ?? null,
    })
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeFrom.getTime(), rangeTo.getTime(), roomFilter, coachFilter, memberFilter]);

  useEffect(() => {
    const q = memberQuery.trim();
    if (q.length < 2) {
      setMemberResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      getMembers({ search: q, pageSize: 6 }).then((res) => setMemberResults(res.data)).catch(() => setMemberResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [memberQuery]);

  const stats = useMemo(() => {
    const todays = classes.filter((c) => sameDay(new Date(c.start), today));
    const avgOcc = classes.length > 0 ? Math.round(classes.reduce((s, c) => s + occupancy(c), 0) / classes.length) : 0;
    const waiting = classes.reduce((s, c) => s + c.waitlist, 0);
    return { todayCount: todays.length, avgOcc, waiting };
  }, [classes, today]);

  const weekStart = mondayOf(anchor);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const goToday = () => setAnchor(new Date());
  const prev = () => setAnchor(view === "day" ? addDays(anchor, -1) : view === "week" ? addDays(anchor, -7) : addMonths(anchor, -1));
  const next = () => setAnchor(view === "day" ? addDays(anchor, 1) : view === "week" ? addDays(anchor, 7) : addMonths(anchor, 1));

  const rangeLabel =
    view === "day"
      ? `${DAY_NAMES_LONG[(anchor.getDay() + 6) % 7]} ${anchor.getDate()} ${MONTH_NAMES[anchor.getMonth()]}`
      : view === "week"
        ? `${weekStart.getDate()} – ${addDays(weekStart, 6).getDate()} ${MONTH_NAMES[addDays(weekStart, 6).getMonth()]} ${addDays(weekStart, 6).getFullYear()}`
        : `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;

  return (
    <>
      <PageHeader
        title="Agenda y Clases"
        description="Calendario interactivo de clases con aforo en tiempo real y reservas."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={Settings} onClick={() => setRoomManagerOpen(true)}>Administrar salas</Button>
            <Button variant="outline" icon={Users} onClick={() => setCoachManagerOpen(true)}>Administrar coaches</Button>
            <Button icon={CalendarDays} onClick={() => setNewClassOpen(true)}>Nueva clase</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Clases hoy" value={stats.todayCount} icon={CalendarDays} accent="teal" />
        <StatCard label="Ocupación media" value={`${stats.avgOcc}%`} icon={Users} />
        <StatCard label="En lista de espera" value={stats.waiting} icon={Hourglass} />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-content-muted">Sala</label>
            <Select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
              <option value="">Todas las salas</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-content-muted">Coach</label>
            <Select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)}>
              <option value="">Todos los coaches</option>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="relative w-64">
            <label className="mb-1 block text-xs font-medium text-content-muted">Socio</label>
            {memberFilter ? (
              <div className="flex h-10 items-center justify-between rounded-lg border border-line bg-surface-muted px-3 text-sm">
                <span className="truncate text-content">{memberFilter.name}</span>
                <button onClick={() => setMemberFilter(null)} aria-label="Quitar filtro de socio">
                  <X className="h-4 w-4 text-content-subtle" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
                  <Input
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Buscar socio…"
                    className="pl-9"
                  />
                </div>
                {memberResults.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-surface-elevated shadow-lg">
                    {memberResults.map((m) => (
                      <li key={m.id}>
                        <button
                          className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-surface-muted"
                          onClick={() => {
                            setMemberFilter({ id: m.id, name: m.name });
                            setMemberQuery("");
                            setMemberResults([]);
                          }}
                        >
                          {m.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {memberFilter && (
            <Button
              variant="outline"
              icon={FileDown}
              onClick={() => window.open(`/print/agenda/${memberFilter.id}`, "_blank", "noopener,noreferrer")}
            >
              Exportar Agenda
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={<span className="capitalize">{rangeLabel}</span>}
          description={view === "day" ? "Vista diaria" : view === "week" ? "Vista semanal" : "Vista mensual"}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-line bg-surface p-0.5">
                <ViewButton icon={CalendarClock} label="Día" active={view === "day"} onClick={() => setView("day")} />
                <ViewButton icon={CalendarRange} label="Semana" active={view === "week"} onClick={() => setView("week")} />
                <ViewButton icon={LayoutGrid} label="Mes" active={view === "month"} onClick={() => setView("month")} />
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
          {view === "day" ? (
            <DayGrid day={anchor} classes={classes} onSelect={setSelected} />
          ) : view === "week" ? (
            <WeekGrid days={weekDays} today={today} classes={classes} onSelect={setSelected} />
          ) : (
            <MonthGrid anchor={anchor} today={today} classes={classes} onSelect={setSelected} loading={loading} />
          )}
        </CardContent>
      </Card>

      <ClassModal
        cls={selected}
        onClose={() => setSelected(null)}
        onBooked={() => {
          refreshClasses();
        }}
        defaultMember={memberFilter}
      />

      <NewClassModal
        open={newClassOpen}
        onClose={() => setNewClassOpen(false)}
        rooms={rooms}
        coaches={coaches}
        onCreated={() => refreshClasses()}
      />

      <RoomManagerModal
        open={roomManagerOpen}
        onClose={() => setRoomManagerOpen(false)}
        rooms={rooms}
        onChanged={() => getRooms().then(setRooms).catch(() => {})}
      />

      <CoachManagerModal
        open={coachManagerOpen}
        onClose={() => setCoachManagerOpen(false)}
        coaches={coaches}
        onChanged={refreshCoaches}
      />
    </>
  );
}

function ViewButton({ icon: Icon, label, active, onClick }: { icon: typeof CalendarClock; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-brand-800 text-white" : "text-content-muted hover:text-content",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

// ---------- vista diaria ----------

function DayGrid({ day, classes, onSelect }: { day: Date; classes: GymClass[]; onSelect: (c: GymClass) => void }) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const dayClasses = classes.filter((c) => sameDay(new Date(c.start), day));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        <div className="grid" style={{ gridTemplateColumns: "56px 1fr" }}>
          <div className="border-r border-line">
            {hours.map((h) => (
              <div key={h} className="relative border-b border-line" style={{ height: ROW_PX }}>
                <span className="absolute -top-2 right-1 text-[10px] tabular-nums text-content-subtle">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>
          <div className="relative" style={{ height: ROW_PX * hours.length }}>
            {hours.map((h) => <div key={h} className="border-b border-line" style={{ height: ROW_PX }} />)}
            {dayClasses.map((c) => {
              const start = new Date(c.start);
              const end = new Date(c.end);
              const minutesFromTop = (start.getHours() - HOUR_START) * 60 + start.getMinutes();
              const durationMin = (end.getTime() - start.getTime()) / 60_000;
              const top = (minutesFromTop / SLOT_MIN) * ROW_PX;
              const height = Math.max(32, (durationMin / SLOT_MIN) * ROW_PX - 4);
              const tone = occupancyTone(c);
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  style={{ top, height }}
                  className="absolute left-2 right-2 flex flex-col justify-center gap-0.5 overflow-hidden rounded-md border border-l-4 border-line bg-surface-elevated px-3 py-1 text-left shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-brand-500"
                >
                  <p className="truncate text-sm font-semibold text-content">{c.title}</p>
                  <p className="truncate text-xs text-content-muted">
                    {fmtHour(c.start)} – {fmtHour(c.end)} · {c.room} · {c.coach}
                  </p>
                  <Badge tone={tone} className="mt-0.5 w-fit text-[10px]">{c.booked}/{c.capacity}</Badge>
                </button>
              );
            })}
            {dayClasses.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-content-subtle">
                Sin clases este día.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- vista semanal ----------

function WeekGrid({ days, today, classes, onSelect }: { days: Date[]; today: Date; classes: GymClass[]; onSelect: (c: GymClass) => void }) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[840px]">
        <div className="grid border-b border-line" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div className="border-r border-line" />
          {days.map((d, i) => {
            const isToday = sameDay(d, today);
            return (
              <div key={i} className={cn("border-r border-line px-2 py-2 text-center last:border-r-0", isToday && "bg-brand-50/60 dark:bg-brand-800/10")}>
                <p className="text-xs font-medium text-content-muted">{DAY_NAMES[i]}</p>
                <p className={cn("text-sm font-semibold", isToday ? "text-brand-800 dark:text-brand-300" : "text-content")}>{d.getDate()}</p>
              </div>
            );
          })}
        </div>

        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div className="border-r border-line">
            {hours.map((h) => (
              <div key={h} className="relative border-b border-line" style={{ height: ROW_PX }}>
                <span className="absolute -top-2 right-1 text-[10px] tabular-nums text-content-subtle">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {days.map((day, di) => {
            const dayClasses = classes.filter((c) => sameDay(new Date(c.start), day));
            const isToday = sameDay(day, today);
            return (
              <div key={di} className={cn("relative border-r border-line last:border-r-0", isToday && "bg-brand-50/30 dark:bg-brand-800/5")} style={{ height: ROW_PX * hours.length }}>
                {hours.map((h) => <div key={h} className="border-b border-line" style={{ height: ROW_PX }} />)}
                {dayClasses.map((c) => {
                  const start = new Date(c.start);
                  const end = new Date(c.end);
                  const minutesFromTop = (start.getHours() - HOUR_START) * 60 + start.getMinutes();
                  const durationMin = (end.getTime() - start.getTime()) / 60_000;
                  const top = (minutesFromTop / SLOT_MIN) * ROW_PX;
                  const height = Math.max(28, (durationMin / SLOT_MIN) * ROW_PX - 4);
                  return <WeekCard key={c.id} cls={c} top={top} height={height} onSelect={onSelect} />;
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekCard({ cls, top, height, onSelect }: { cls: GymClass; top: number; height: number; onSelect: (c: GymClass) => void }) {
  const tone = occupancyTone(cls);
  const full = cls.booked >= cls.capacity;
  const accent: Record<Tone, string> = {
    neutral: "border-l-content-subtle", brand: "border-l-brand-700", success: "border-l-teal-600",
    warning: "border-l-amber-500", danger: "border-l-red-500", info: "border-l-sky-500",
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
      <p className="truncate text-[10px] text-content-muted">{fmtHour(cls.start)} · {cls.coach}</p>
      {height > 48 && (
        <>
          <p className="text-[10px] font-medium text-content-subtle">{cls.booked}/{cls.capacity} cupos</p>
          <Progress value={occupancy(cls)} tone={tone} className="h-1" />
        </>
      )}
      {full && cls.waitlist > 0 && <Badge tone="danger" className="mt-0.5 px-1.5 py-0 text-[9px]">Espera ({cls.waitlist})</Badge>}
    </button>
  );
}

// ---------- vista mensual ----------

function MonthGrid({ anchor, today, classes, onSelect, loading }: { anchor: Date; today: Date; classes: GymClass[]; onSelect: (c: GymClass) => void; loading: boolean }) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = mondayOf(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {DAY_NAMES.map((d) => <div key={d} className="px-2 py-2 text-center text-xs font-medium text-content-muted">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = sameDay(day, today);
          const dayClasses = classes.filter((c) => sameDay(new Date(c.start), day)).sort((a, b) => +new Date(a.start) - +new Date(b.start));
          return (
            <div key={i} className={cn("min-h-[112px] border-b border-r border-line p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0", !inMonth && "bg-surface-muted/40", isToday && "bg-brand-50/50 dark:bg-brand-800/10")}>
              <div className="mb-1 flex items-center justify-between">
                <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium", isToday ? "bg-brand-800 text-white" : inMonth ? "text-content" : "text-content-subtle")}>
                  {day.getDate()}
                </span>
                {dayClasses.length > 0 && <Badge tone="neutral" className="px-1.5 py-0 text-[9px]">{dayClasses.length}</Badge>}
              </div>
              {!loading && (
                <div className="space-y-1">
                  {dayClasses.slice(0, 3).map((c) => {
                    const tone = occupancyTone(c);
                    return (
                      <button key={c.id} onClick={() => onSelect(c)} className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] text-content-muted transition hover:bg-surface-muted">
                        <Badge tone={tone} dot className="border-0 bg-transparent p-0 ring-0" />
                        <span className="truncate">{fmtHour(c.start)} {c.title}</span>
                      </button>
                    );
                  })}
                  {dayClasses.length > 3 && <p className="px-1 text-[10px] text-content-subtle">+{dayClasses.length - 3} más</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- modal de detalle + reserva ----------

function ClassModal({
  cls, onClose, onBooked, defaultMember,
}: {
  cls: GymClass | null;
  onClose: () => void;
  onBooked: () => void;
  defaultMember: { id: string; name: string } | null;
}) {
  const [attendees, setAttendees] = useState<ClassAttendee[]>([]);
  const [bookMember, setBookMember] = useState<{ id: string; name: string } | null>(defaultMember);
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<Member[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookSuccess, setBookSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!cls) return;
    setBookMember(defaultMember);
    setBookQuery("");
    setBookResults([]);
    setBookError(null);
    setBookSuccess(null);
    getAttendees(cls.id).then(setAttendees).catch(() => setAttendees([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls?.id]);

  useEffect(() => {
    const q = bookQuery.trim();
    if (q.length < 2) {
      setBookResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      getMembers({ search: q, pageSize: 6 }).then((res) => setBookResults(res.data)).catch(() => setBookResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [bookQuery]);

  if (!cls) return null;

  const tone = occupancyTone(cls);
  const full = cls.booked >= cls.capacity;
  const start = new Date(cls.start);
  const dayIdx = (start.getDay() + 6) % 7;

  async function handleBook() {
    if (!cls || !bookMember) return;
    setBooking(true);
    setBookError(null);
    setBookSuccess(null);
    try {
      const result = await bookClass(cls.id, bookMember.id);
      setBookSuccess(result.status === "waitlisted" ? "Agregado a lista de espera." : "Reserva confirmada.");
      getAttendees(cls.id).then(setAttendees).catch(() => {});
      onBooked();
    } catch (err) {
      setBookError(err instanceof ApiError ? err.message : "No se pudo reservar.");
    } finally {
      setBooking(false);
    }
  }

  return (
    <Modal
      open={!!cls}
      onClose={onClose}
      size="lg"
      title={<span className="flex items-center gap-2">{cls.title}<Badge tone="brand">{TYPE_LABEL[cls.type]}</Badge></span>}
      description={`${DAY_NAMES_LONG[dayIdx]} · ${start.getDate()} ${MONTH_NAMES[start.getMonth()]}`}
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-content-muted"><Clock className="h-4 w-4 text-content-subtle" />{fmtHour(cls.start)} – {fmtHour(cls.end)}</div>
          <div className="flex items-center gap-2 text-content-muted"><MapPin className="h-4 w-4 text-content-subtle" />{cls.room}</div>
          <div className="flex items-center gap-2 text-content-muted"><Users className="h-4 w-4 text-content-subtle" />Coach {cls.coach}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-muted/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-content">Aforo</span>
            <span className="text-sm font-semibold text-content">{cls.booked}/{cls.capacity} cupos</span>
          </div>
          <Progress value={occupancy(cls)} tone={tone} />
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={tone} dot>{occupancy(cls)}% ocupado</Badge>
            {full && cls.waitlist > 0 && <Badge tone="danger">Lista de espera ({cls.waitlist})</Badge>}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line p-3">
        <p className="mb-2 text-sm font-medium text-content">Reservar para un socio</p>
        {bookMember ? (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm">
            <span className="truncate text-content">{bookMember.name}</span>
            <button onClick={() => setBookMember(null)} aria-label="Quitar socio"><X className="h-4 w-4 text-content-subtle" /></button>
          </div>
        ) : (
          <div className="relative">
            <Input value={bookQuery} onChange={(e) => setBookQuery(e.target.value)} placeholder="Buscar socio por nombre, correo o teléfono…" />
            {bookResults.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-surface-elevated shadow-lg">
                {bookResults.map((m) => (
                  <li key={m.id}>
                    <button className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-surface-muted" onClick={() => { setBookMember({ id: m.id, name: m.name }); setBookQuery(""); setBookResults([]); }}>
                      {m.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <Button variant={full ? "outline" : "success"} loading={booking} disabled={!bookMember} onClick={handleBook}>
            {full ? "Unirse a lista de espera" : "Reservar"}
          </Button>
          {bookError && <p className="text-sm text-red-600">{bookError}</p>}
          {bookSuccess && <p className="text-sm text-teal-600">{bookSuccess}</p>}
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
