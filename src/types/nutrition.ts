import type { ID } from "./shared";

/** Bloques horarios estándar de un plan dietético. */
export type MealBlock =
  | "Desayuno"
  | "Media mañana"
  | "Almuerzo"
  | "Merienda"
  | "Cena";

/** Objetivos de macronutrientes diarios del plan. */
export interface MacroTargets {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Alimento concreto dentro de una comida, con su aporte nutricional. */
export interface MealItem {
  id: ID;
  name: string;
  qtyG: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Comida asignada a un bloque horario con sus alimentos. */
export interface Meal {
  id: ID;
  block: MealBlock;
  items: MealItem[];
}

/** Plan dietético completo asignado a un socio. */
export interface NutritionPlan {
  id: ID;
  memberName: string;
  goal: string;
  targets: MacroTargets;
  meals: Meal[];
}
