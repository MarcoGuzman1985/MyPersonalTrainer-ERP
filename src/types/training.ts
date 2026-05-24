import type { ID } from "@/types/shared";

/**
 * Tipos del módulo Entrenamiento (Bloque 5).
 * Diseñador visual de rutinas + cronómetro de CrossFit.
 */

/** Grupos musculares disponibles para filtrar la biblioteca. */
export type MuscleGroup =
  | "pecho"
  | "espalda"
  | "piernas"
  | "hombros"
  | "brazos"
  | "core"
  | "fullbody"
  | "cardio";

/** Ejercicio de la biblioteca (catálogo maestro). */
export interface Exercise {
  id: ID;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  videoUrl: string;
}

/** Ejercicio ya configurado dentro de un bloque de la rutina. */
export interface RoutineExercise {
  id: ID;
  exerciseId: ID;
  name: string;
  sets: number;
  reps: number;
  rpe: number;
  restSec: number;
  videoUrl?: string;
}

/** Bloque (sección) de la rutina que agrupa ejercicios. */
export interface RoutineBlock {
  id: ID;
  title: string;
  exercises: RoutineExercise[];
}

/** Modos de cronómetro estilo CrossFit. */
export type TimerMode = "amrap" | "emom" | "tabata" | "fortime";
