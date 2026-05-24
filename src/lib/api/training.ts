import type { Exercise, MuscleGroup, RoutineBlock } from "@/types/training";

/**
 * Capa de datos del módulo Entrenamiento.
 * MOCK para demo de UI. Para conectar el backend, reemplazar los retornos por:
 * // TODO(backend): GET /api/exercises  -> apiFetch<Exercise[]>("/api/exercises")
 * // TODO(backend): POST /api/routines  -> apiFetch<Routine>("/api/routines", { method: "POST", body })
 */

/** Etiquetas legibles de cada grupo muscular para los filtros. */
export const muscleGroupLabels: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  piernas: "Piernas",
  hombros: "Hombros",
  brazos: "Brazos",
  core: "Core",
  fullbody: "Full body",
  cardio: "Cardio",
};

/** Placeholder de video reutilizable en la demo. */
const DEMO_VIDEO = "https://www.youtube.com/embed/dQw4w9WgXcQ";

export const exercisesMock: Exercise[] = [
  { id: "ex_1", name: "Press de banca", muscleGroup: "pecho", equipment: "Barra", videoUrl: DEMO_VIDEO },
  { id: "ex_2", name: "Aperturas con mancuerna", muscleGroup: "pecho", equipment: "Mancuernas", videoUrl: DEMO_VIDEO },
  { id: "ex_3", name: "Dominadas", muscleGroup: "espalda", equipment: "Barra fija", videoUrl: DEMO_VIDEO },
  { id: "ex_4", name: "Remo con barra", muscleGroup: "espalda", equipment: "Barra", videoUrl: DEMO_VIDEO },
  { id: "ex_5", name: "Sentadilla trasera", muscleGroup: "piernas", equipment: "Barra", videoUrl: DEMO_VIDEO },
  { id: "ex_6", name: "Peso muerto rumano", muscleGroup: "piernas", equipment: "Barra", videoUrl: DEMO_VIDEO },
  { id: "ex_7", name: "Zancadas", muscleGroup: "piernas", equipment: "Mancuernas", videoUrl: DEMO_VIDEO },
  { id: "ex_8", name: "Press militar", muscleGroup: "hombros", equipment: "Barra", videoUrl: DEMO_VIDEO },
  { id: "ex_9", name: "Elevaciones laterales", muscleGroup: "hombros", equipment: "Mancuernas", videoUrl: DEMO_VIDEO },
  { id: "ex_10", name: "Curl de bíceps", muscleGroup: "brazos", equipment: "Mancuernas", videoUrl: DEMO_VIDEO },
  { id: "ex_11", name: "Extensión de tríceps en polea", muscleGroup: "brazos", equipment: "Polea", videoUrl: DEMO_VIDEO },
  { id: "ex_12", name: "Plancha frontal", muscleGroup: "core", equipment: "Peso corporal", videoUrl: DEMO_VIDEO },
  { id: "ex_13", name: "Russian twist", muscleGroup: "core", equipment: "Disco", videoUrl: DEMO_VIDEO },
  { id: "ex_14", name: "Burpees", muscleGroup: "fullbody", equipment: "Peso corporal", videoUrl: DEMO_VIDEO },
  { id: "ex_15", name: "Thruster", muscleGroup: "fullbody", equipment: "Barra", videoUrl: DEMO_VIDEO },
  { id: "ex_16", name: "Remo en máquina", muscleGroup: "cardio", equipment: "Rower", videoUrl: DEMO_VIDEO },
  { id: "ex_17", name: "Salto a cajón", muscleGroup: "cardio", equipment: "Cajón pliométrico", videoUrl: DEMO_VIDEO },
];

/** Rutina de ejemplo precargada en el constructor. */
export const sampleRoutineMock: RoutineBlock[] = [
  {
    id: "blk_1",
    title: "Calentamiento",
    exercises: [
      { id: "re_1", exerciseId: "ex_16", name: "Remo en máquina", sets: 1, reps: 1, rpe: 5, restSec: 30, videoUrl: DEMO_VIDEO },
      { id: "re_2", exerciseId: "ex_12", name: "Plancha frontal", sets: 3, reps: 1, rpe: 6, restSec: 30, videoUrl: DEMO_VIDEO },
    ],
  },
  {
    id: "blk_2",
    title: "Fuerza principal",
    exercises: [
      { id: "re_3", exerciseId: "ex_5", name: "Sentadilla trasera", sets: 5, reps: 5, rpe: 8, restSec: 120, videoUrl: DEMO_VIDEO },
      { id: "re_4", exerciseId: "ex_1", name: "Press de banca", sets: 5, reps: 5, rpe: 8, restSec: 120, videoUrl: DEMO_VIDEO },
    ],
  },
  {
    id: "blk_3",
    title: "Metcon",
    exercises: [
      { id: "re_5", exerciseId: "ex_15", name: "Thruster", sets: 4, reps: 12, rpe: 9, restSec: 60, videoUrl: DEMO_VIDEO },
      { id: "re_6", exerciseId: "ex_14", name: "Burpees", sets: 4, reps: 15, rpe: 9, restSec: 60, videoUrl: DEMO_VIDEO },
    ],
  },
];
