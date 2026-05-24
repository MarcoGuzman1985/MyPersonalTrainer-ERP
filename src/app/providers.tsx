"use client";

import type { ReactNode } from "react";

/**
 * Punto único para envolver providers globales del lado cliente
 * (sesión, tema, react-query, etc.). Los stores Zustand no requieren
 * provider, pero este wrapper queda listo para futuros contextos.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
