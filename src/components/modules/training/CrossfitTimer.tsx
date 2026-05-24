"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { Button, Card, CardContent, CardHeader, Field, Select, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { TimerMode } from "@/types/training";

/** Configuración de cada modo de cronómetro. */
interface TimerConfig {
  rounds: number;
  workSec: number;
  restSec: number;
}

const modeLabels: Record<TimerMode, string> = {
  amrap: "AMRAP",
  emom: "EMOM",
  tabata: "TABATA",
  fortime: "For Time",
};

/** Valores por defecto recomendados por modo. */
const defaults: Record<TimerMode, TimerConfig> = {
  amrap: { rounds: 1, workSec: 600, restSec: 0 },
  emom: { rounds: 10, workSec: 60, restSec: 0 },
  tabata: { rounds: 8, workSec: 20, restSec: 10 },
  fortime: { rounds: 1, workSec: 900, restSec: 0 },
};

type Phase = "work" | "rest";

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CrossfitTimer() {
  const [mode, setMode] = useState<TimerMode>("tabata");
  const [config, setConfig] = useState<TimerConfig>(defaults.tabata);

  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("work");
  const [remaining, setRemaining] = useState(defaults.tabata.workSec);
  const [finished, setFinished] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Detiene y limpia el intervalo activo. */
  const clearTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  /** Reinicia el cronómetro al estado inicial del modo/config actual. */
  const reset = (cfg: TimerConfig = config) => {
    clearTimer();
    setRunning(false);
    setFinished(false);
    setRound(1);
    setPhase("work");
    setRemaining(cfg.workSec);
  };

  /** Cambia de modo aplicando su configuración por defecto. */
  const handleModeChange = (next: TimerMode) => {
    setMode(next);
    setConfig(defaults[next]);
    reset(defaults[next]);
  };

  /** Actualiza un campo de configuración (solo con el cronómetro detenido). */
  const updateConfig = (key: keyof TimerConfig, value: number) => {
    const next = { ...config, [key]: Math.max(0, value) };
    setConfig(next);
    reset(next);
  };

  // Cuenta regresiva real: un tick por segundo mientras esté en marcha.
  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) return prev - 1;

        // Fin del intervalo actual -> avanzar fase/ronda.
        const hasRest = config.restSec > 0;
        if (phase === "work" && hasRest) {
          setPhase("rest");
          return config.restSec;
        }

        // Cerrar la ronda (tras descanso, o si no hay descanso).
        if (round < config.rounds) {
          setRound((r) => r + 1);
          setPhase("work");
          return config.workSec;
        }

        // Última ronda completada.
        setRunning(false);
        setFinished(true);
        return 0;
      });
    }, 1000);

    return () => clearTimer();
  }, [running, phase, round, config]);

  // Limpieza defensiva al desmontar.
  useEffect(() => clearTimer, []);

  const totalForPhase = phase === "work" ? config.workSec : config.restSec;
  const progressPct = totalForPhase > 0 ? ((totalForPhase - remaining) / totalForPhase) * 100 : 0;

  const start = () => {
    if (finished) reset();
    setRunning(true);
  };

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5 text-teal-700" />
            Cronómetro CrossFit
          </span>
        }
        description="Configura el modo, las rondas y arranca la cuenta regresiva."
        action={<Badge tone="brand">{modeLabels[mode]}</Badge>}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Modo" htmlFor="timer-mode">
            <Select
              id="timer-mode"
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as TimerMode)}
            >
              {(Object.keys(modeLabels) as TimerMode[]).map((m) => (
                <option key={m} value={m}>
                  {modeLabels[m]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rondas" htmlFor="timer-rounds">
            <Input
              id="timer-rounds"
              type="number"
              min={1}
              value={config.rounds}
              disabled={running}
              onChange={(e) => updateConfig("rounds", Number(e.target.value))}
            />
          </Field>
          <Field label="Trabajo (seg)" htmlFor="timer-work">
            <Input
              id="timer-work"
              type="number"
              min={1}
              value={config.workSec}
              disabled={running}
              onChange={(e) => updateConfig("workSec", Number(e.target.value))}
            />
          </Field>
          <Field label="Descanso (seg)" htmlFor="timer-rest">
            <Input
              id="timer-rest"
              type="number"
              min={0}
              value={config.restSec}
              disabled={running}
              onChange={(e) => updateConfig("restSec", Number(e.target.value))}
            />
          </Field>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-line p-6 text-center transition-colors",
            phase === "work" ? "bg-surface-muted" : "bg-teal-700/10",
          )}
        >
          <p className="text-sm font-medium uppercase tracking-wide text-content-muted">
            {finished ? "¡Completado!" : phase === "work" ? "Trabajo" : "Descanso"}
            {" · "}
            Ronda {Math.min(round, config.rounds)}/{config.rounds}
          </p>
          <p className="my-3 font-mono text-6xl font-bold tabular-nums text-content sm:text-7xl">
            {mmss(remaining)}
          </p>
          <div className="mx-auto max-w-md">
            {/* Progress nativo del bloque de diseño para el avance del intervalo. */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300 ease-linear",
                  phase === "work" ? "bg-brand-700" : "bg-teal-600",
                )}
                style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {running ? (
            <Button variant="outline" icon={Pause} onClick={() => setRunning(false)}>
              Pausar
            </Button>
          ) : (
            <Button variant="success" icon={Play} onClick={start}>
              {finished ? "Reiniciar y arrancar" : "Iniciar"}
            </Button>
          )}
          <Button variant="ghost" icon={RotateCcw} onClick={() => reset()}>
            Reiniciar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
