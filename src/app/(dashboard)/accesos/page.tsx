"use client";

import { useEffect, useRef, useState } from "react";
import { DoorOpen, ShieldX, Users, Pause, Play, CheckCircle2, XCircle } from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, Button, Avatar,
} from "@/components/ui";
import { cn, formatDateTime } from "@/lib/utils";
import {
  accessEventsMock, accessStatsMock, generateMockAccessEvent,
} from "@/lib/api/access";
import { QrAccessCard } from "@/components/modules/access/QrAccessCard";
import type { AccessEvent, AccessStatus } from "@/types/access";
import type { Tone } from "@/types/shared";

const statusMeta: Record<AccessStatus, { label: string; tone: Tone }> = {
  approved: { label: "Aprobado", tone: "success" },
  denied: { label: "Denegado", tone: "danger" },
};

/** Máximo de eventos visibles en el feed para no crecer indefinidamente. */
const MAX_FEED = 40;
/** Intervalo de simulación del feed en tiempo real (ms). */
const FEED_INTERVAL_MS = 4000;

export default function AccesosPage() {
  // TODO(backend): sustituir el mock por la suscripción al WebSocket/SSE /api/access/stream.
  const [events, setEvents] = useState<AccessEvent[]>(accessEventsMock);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState(accessStatsMock);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    if (paused) return;

    const intervalId = window.setInterval(() => {
      const next = generateMockAccessEvent();
      setEvents((prev) => [next, ...prev].slice(0, MAX_FEED));
      setStats((prev) => ({
        ...prev,
        approvedToday: prev.approvedToday + (next.status === "approved" ? 1 : 0),
        deniedToday: prev.deniedToday + (next.status === "denied" ? 1 : 0),
        currentOccupancy:
          next.status === "approved"
            ? Math.min(prev.maxOccupancy, prev.currentOccupancy + 1)
            : prev.currentOccupancy,
      }));
    }, FEED_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [paused]);

  return (
    <>
      <PageHeader
        title="Control de accesos"
        description="Monitoreo en tiempo real de entradas y salidas en las instalaciones."
        actions={
          <Button
            variant={paused ? "primary" : "outline"}
            icon={paused ? Play : Pause}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "Reanudar feed" : "Pausar feed"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Accesos hoy" value={stats.approvedToday} icon={DoorOpen} accent="teal" />
        <StatCard label="Denegados hoy" value={stats.deniedToday} icon={ShieldX} />
        <StatCard
          label="Aforo actual"
          value={`${stats.currentOccupancy} / ${stats.maxOccupancy}`}
          icon={Users}
          accent="teal"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Live feed"
            description="El acceso más reciente aparece arriba."
            action={
              <Badge tone={paused ? "neutral" : "success"} dot>
                {paused ? "En pausa" : "En vivo"}
              </Badge>
            }
          />
          <CardContent className="p-0">
            <ul className="divide-y divide-line">
              {events.map((event) => {
                const meta = statusMeta[event.status];
                const approved = event.status === "approved";
                return (
                  <li
                    key={event.id}
                    className={cn(
                      "flex items-center gap-4 p-4 transition-colors",
                      approved ? "hover:bg-teal-50/40" : "bg-red-50/30 hover:bg-red-50/50",
                    )}
                  >
                    <Avatar name={event.memberName} src={event.photoUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-content">{event.memberName}</p>
                      <p className="truncate text-xs text-content-subtle">
                        {event.gate} · {formatDateTime(event.time)}
                      </p>
                      {event.reason && (
                        <p className="mt-0.5 truncate text-xs text-red-600">{event.reason}</p>
                      )}
                    </div>
                    <Badge tone={meta.tone} className="shrink-0">
                      {approved ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {meta.label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <QrAccessCard />
        </div>
      </div>
    </>
  );
}
