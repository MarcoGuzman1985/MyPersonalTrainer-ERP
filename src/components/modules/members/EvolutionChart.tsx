"use client";

import { useMemo } from "react";
import { cn, formatDate } from "@/lib/utils";
import type { AnthropometricEntry } from "@/types/members";

interface SeriesDef {
  /** Clave numérica a extraer de cada medición. */
  accessor: (e: AnthropometricEntry) => number;
  label: string;
  unit: string;
  /** Color del trazo (clase de stroke de Tailwind o color literal). */
  color: string;
}

interface EvolutionChartProps {
  entries: AnthropometricEntry[];
  className?: string;
}

/** Coordenadas internas del viewBox (responsive vía viewBox + preserveAspectRatio). */
const VIEW_W = 600;
const VIEW_H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

/**
 * Gráfico de líneas SVG puro (sin librerías externas) con doble serie:
 * peso (kg) y % de grasa. Cada serie se normaliza de forma independiente
 * a sus propios min/max para aprovechar todo el alto disponible.
 */
export function EvolutionChart({ entries, className }: EvolutionChartProps) {
  const series = useMemo<SeriesDef[]>(
    () => [
      { accessor: (e) => e.weightKg, label: "Peso", unit: "kg", color: "#334155" /* brand-800 */ },
      { accessor: (e) => e.bodyFatPct, label: "% Grasa", unit: "%", color: "#0f766e" /* teal-700 */ },
    ],
    [],
  );

  const plotW = VIEW_W - PAD.left - PAD.right;
  const plotH = VIEW_H - PAD.top - PAD.bottom;

  // Escala X compartida: índice temporal repartido uniformemente.
  const n = entries.length;
  const xAt = (i: number) => (n <= 1 ? PAD.left + plotW / 2 : PAD.left + (i / (n - 1)) * plotW);

  // Calcula, por serie, los puntos {x,y} normalizando su rango propio.
  const computed = useMemo(() => {
    return series.map((s) => {
      const values = entries.map(s.accessor);
      const min = values.length ? Math.min(...values) : 0;
      const max = values.length ? Math.max(...values) : 1;
      // Evita división por cero cuando todos los valores son iguales.
      const span = max - min || 1;
      const points = entries.map((e, i) => {
        const v = s.accessor(e);
        // Y invertido: mayor valor -> más arriba (menor y).
        const y = PAD.top + plotH - ((v - min) / span) * plotH;
        return { x: xAt(i), y, value: v };
      });
      const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      return { ...s, points, path, min, max };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, series]);

  if (entries.length === 0) {
    return (
      <div className={cn("flex h-44 items-center justify-center rounded-xl border border-dashed border-line text-sm text-content-subtle", className)}>
        Sin mediciones registradas todavía.
      </div>
    );
  }

  // Líneas de referencia horizontales (3 divisiones).
  const gridLines = [0, 0.5, 1].map((t) => PAD.top + t * plotH);

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="h-48 w-full"
        role="img"
        aria-label="Evolución de peso y porcentaje de grasa"
      >
        {/* Rejilla */}
        {gridLines.map((y, i) => (
          <line
            key={`grid-${i}`}
            x1={PAD.left}
            x2={VIEW_W - PAD.right}
            y1={y}
            y2={y}
            stroke="currentColor"
            className="text-line"
            strokeWidth={1}
          />
        ))}

        {/* Eje X: fechas (primera, central, última) */}
        {entries.length > 0 &&
          [0, Math.floor((n - 1) / 2), n - 1]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((idx) => (
              <text
                key={`xlbl-${idx}`}
                x={xAt(idx)}
                y={VIEW_H - 8}
                textAnchor={idx === 0 ? "start" : idx === n - 1 ? "end" : "middle"}
                className="fill-content-subtle"
                fontSize={11}
              >
                {formatDate(entries[idx]!.date)}
              </text>
            ))}

        {/* Series */}
        {computed.map((s) => (
          <g key={s.label}>
            <path d={s.path} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {s.points.map((p, i) => (
              <circle key={`${s.label}-${i}`} cx={p.x} cy={p.y} r={3} fill={s.color}>
                <title>{`${s.label}: ${p.value} ${s.unit}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>

      {/* Leyenda */}
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
        {computed.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-content-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
            <span className="text-content-subtle">
              ({s.min}–{s.max} {s.unit})
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
