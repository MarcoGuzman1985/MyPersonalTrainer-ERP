import type { NutritionPlan } from "@/types/nutrition";

/**
 * Capa de datos del módulo Nutrición.
 * MOCK para demo de UI. Para conectar el backend, reemplazar el retorno por:
 *   getPlan(id) -> apiFetch<NutritionPlan>(`/nutrition/plans/${id}`)
 *
 * // TODO(backend): GET /api/nutrition/plans/:id
 * // TODO(backend): GET /api/nutrition/plans/:id/pdf
 */

export const nutritionPlanMock: NutritionPlan = {
  id: "plan_1",
  memberName: "Marco Guzmán",
  goal: "Recomposición corporal · superávit ligero",
  targets: { kcal: 2400, proteinG: 180, carbsG: 270, fatG: 67 },
  meals: [
    {
      id: "meal_breakfast",
      block: "Desayuno",
      items: [
        { id: "it_1", name: "Avena en hojuelas", qtyG: 80, kcal: 304, proteinG: 11, carbsG: 53, fatG: 6 },
        { id: "it_2", name: "Claras de huevo", qtyG: 200, kcal: 104, proteinG: 22, carbsG: 3, fatG: 0 },
        { id: "it_3", name: "Plátano", qtyG: 120, kcal: 107, proteinG: 1, carbsG: 27, fatG: 0 },
        { id: "it_4", name: "Mantequilla de cacahuete", qtyG: 15, kcal: 89, proteinG: 4, carbsG: 3, fatG: 7 },
      ],
    },
    {
      id: "meal_midmorning",
      block: "Media mañana",
      items: [
        { id: "it_5", name: "Yogur griego natural", qtyG: 170, kcal: 100, proteinG: 17, carbsG: 6, fatG: 1 },
        { id: "it_6", name: "Nueces", qtyG: 20, kcal: 131, proteinG: 3, carbsG: 3, fatG: 13 },
        { id: "it_7", name: "Arándanos", qtyG: 80, kcal: 46, proteinG: 1, carbsG: 11, fatG: 0 },
      ],
    },
    {
      id: "meal_lunch",
      block: "Almuerzo",
      items: [
        { id: "it_8", name: "Pechuga de pollo a la plancha", qtyG: 200, kcal: 330, proteinG: 62, carbsG: 0, fatG: 8 },
        { id: "it_9", name: "Arroz integral cocido", qtyG: 200, kcal: 248, proteinG: 5, carbsG: 52, fatG: 2 },
        { id: "it_10", name: "Verduras salteadas", qtyG: 150, kcal: 60, proteinG: 3, carbsG: 10, fatG: 1 },
        { id: "it_11", name: "Aceite de oliva virgen", qtyG: 10, kcal: 88, proteinG: 0, carbsG: 0, fatG: 10 },
      ],
    },
    {
      id: "meal_snack",
      block: "Merienda",
      items: [
        { id: "it_12", name: "Batido de proteína de suero", qtyG: 30, kcal: 116, proteinG: 24, carbsG: 3, fatG: 2 },
        { id: "it_13", name: "Tortitas de arroz", qtyG: 30, kcal: 116, proteinG: 2, carbsG: 25, fatG: 1 },
        { id: "it_14", name: "Manzana", qtyG: 150, kcal: 78, proteinG: 0, carbsG: 21, fatG: 0 },
      ],
    },
    {
      id: "meal_dinner",
      block: "Cena",
      items: [
        { id: "it_15", name: "Salmón al horno", qtyG: 180, kcal: 374, proteinG: 36, carbsG: 0, fatG: 25 },
        { id: "it_16", name: "Patata cocida", qtyG: 200, kcal: 174, proteinG: 4, carbsG: 40, fatG: 0 },
        { id: "it_17", name: "Ensalada mixta", qtyG: 120, kcal: 30, proteinG: 1, carbsG: 5, fatG: 0 },
        { id: "it_18", name: "Aguacate", qtyG: 50, kcal: 80, proteinG: 1, carbsG: 4, fatG: 7 },
      ],
    },
  ],
};

/** Devuelve el plan dietético del socio. */
export async function getPlan(): Promise<NutritionPlan> {
  // TODO(backend): GET /api/nutrition/plans/:id
  return Promise.resolve(nutritionPlanMock);
}
