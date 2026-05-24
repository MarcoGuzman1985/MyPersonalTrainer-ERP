"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QrCode, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent, Badge, Progress, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Segundos de vida de cada token antes de regenerarse. */
const TOKEN_TTL_SECONDS = 10;
/** Dimensión del lado de la matriz del QR (estilo QR clásico de 21x21). */
const GRID_SIZE = 21;

/** Hash determinista (variante FNV-1a de 32 bits) sobre un string. */
function hashToken(token: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Genera un token corto pseudoaleatorio para el acceso. */
function makeToken(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const stamp = Date.now().toString(36).slice(-4);
  return `${rand}${stamp}`.toUpperCase();
}

/**
 * Construye una matriz determinista de celdas negras/blancas a partir del token.
 * No es un QR escaneable real: es una representación visual estable para la demo.
 * TODO(backend): firmar el token en el servidor y usar una librería de QR real.
 */
function buildMatrix(token: string): boolean[] {
  const cells = GRID_SIZE * GRID_SIZE;
  const matrix = new Array<boolean>(cells).fill(false);

  for (let i = 0; i < cells; i += 1) {
    const row = Math.floor(i / GRID_SIZE);
    const col = i % GRID_SIZE;
    // Patrón derivado de la posición y el hash del token, espejado para simetría visual.
    const seed = hashToken(`${token}:${Math.min(col, GRID_SIZE - 1 - col)}:${row}`);
    matrix[i] = ((seed >>> (row % 13)) & 1) === 1;
  }

  // Patrones de detección de posición (finder patterns) en tres esquinas.
  const corners: Array<[number, number]> = [
    [0, 0],
    [0, GRID_SIZE - 7],
    [GRID_SIZE - 7, 0],
  ];
  for (const [r0, c0] of corners) {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[(r0 + r) * GRID_SIZE + (c0 + c)] = border || inner;
      }
    }
  }

  return matrix;
}

export function QrAccessCard() {
  const [token, setToken] = useState<string>(() => makeToken());
  const [remaining, setRemaining] = useState<number>(TOKEN_TTL_SECONDS);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setToken(makeToken());
          return TOKEN_TTL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const matrix = useMemo(() => buildMatrix(token), [token]);
  const progress = (remaining / TOKEN_TTL_SECONDS) * 100;

  const regenerate = () => {
    setToken(makeToken());
    setRemaining(TOKEN_TTL_SECONDS);
  };

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-brand-800" />
            Mi código de acceso
          </span>
        }
        description="Muéstralo en el torno. Se renueva automáticamente por seguridad."
        action={<Badge tone="brand" dot>Dinámico</Badge>}
      />
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: "min(60vw, 220px)",
              aspectRatio: "1 / 1",
            }}
            role="img"
            aria-label={`Código QR de acceso ${token}`}
          >
            {matrix.map((filled, idx) => (
              <span
                key={idx}
                className={cn("aspect-square", filled ? "bg-black" : "bg-white")}
              />
            ))}
          </div>
        </div>

        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono font-semibold tracking-widest text-content">{token}</span>
            <span className="text-content-muted">Expira en {remaining}s</span>
          </div>
          <Progress value={progress} tone={remaining <= 3 ? "danger" : "success"} />
        </div>

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={regenerate} className="w-full">
          Regenerar ahora
        </Button>
      </CardContent>
    </Card>
  );
}
