"use client";

import { useMemo } from "react";
import { Flame, Beef, Wheat, Droplet, FileDown, UtensilsCrossed } from "lucide-react";
import {
  PageHeader, StatCard, Card, CardHeader, CardContent, Badge, Progress, Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { nutritionPlanMock } from "@/lib/api/nutrition";
import type { Meal, MealItem } from "@/types/nutrition";

/** Kcal por gramo de cada macronutriente. */
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

type MacroKey = "protein" | "carbs" | "fat";

interface MacroSlice {
  key: MacroKey;
  label: string;
  grams: number;
  kcal: number;
  /** Porcentaje sobre el total de kcal de macros. */
  pct: number;
  color: string; // color del trazo SVG
  tone: "danger" | "warning" | "info"; // tono de la barra de progreso
  targetG: number;
  icon: typeof Beef;
}

function mealTotals(meal: Meal) {
  return meal.items.reduce(
    (acc, it) => ({
      kcal: acc.kcal + it.kcal,
      proteinG: acc.proteinG + it.proteinG,
      carbsG: acc.carbsG + it.carbsG,
      fatG: acc.fatG + it.fatG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export default function NutricionPage() {
  // TODO(backend): sustituir mock por getPlan(id) en un effect/hook de datos.
  const plan = nutritionPlanMock;

  // Suma de macros consumidos a partir de todas las comidas del plan.
  const consumed = useMemo(() => {
    return plan.meals.reduce(
      (acc, meal) => {
        const t = mealTotals(meal);
        return {
          kcal: acc.kcal + t.kcal,
          proteinG: acc.proteinG + t.proteinG,
          carbsG: acc.carbsG + t.carbsG,
          fatG: acc.fatG + t.fatG,
        };
      },
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
  }, [plan.meals]);

  // Kcal aportadas por cada macro (gramos -> kcal).
  const slices = useMemo<MacroSlice[]>(() => {
    const raw: Omit<MacroSlice, "pct">[] = [
      { key: "protein", label: "Proteínas", grams: consumed.proteinG, kcal: consumed.proteinG * KCAL_PER_G.protein, color: "#dc2626", tone: "danger", targetG: plan.targets.proteinG, icon: Beef },
      { key: "carbs", label: "Carbohidratos", grams: consumed.carbsG, kcal: consumed.carbsG * KCAL_PER_G.carbs, color: "#0ea5e9", tone: "info", targetG: plan.targets.carbsG, icon: Wheat },
      { key: "fat", label: "Grasas", grams: consumed.fatG, kcal: consumed.fatG * KCAL_PER_G.fat, color: "#f59e0b", tone: "warning", targetG: plan.targets.fatG, icon: Droplet },
    ];
    const totalKcal = raw.reduce((s, m) => s + m.kcal, 0) || 1;
    // Reparto que suma exactamente 100: el último macro absorbe el redondeo.
    let acc = 0;
    return raw.map((m, i) => {
      const exact = (m.kcal / totalKcal) * 100;
      const pct = i === raw.length - 1 ? Math.round((100 - acc) * 10) / 10 : Math.round(exact * 10) / 10;
      acc += pct;
      return { ...m, pct };
    });
  }, [consumed, plan.targets]);

  const macroKcal = slices.reduce((s, m) => s + m.kcal, 0);

  // Geometría del donut SVG.
  const radius = 70;
  const stroke = 26;
  const circumference = 2 * Math.PI * radius; // longitud total del trazo
  let offsetAcc = 0; // desplazamiento acumulado por segmento

  const handlePrint = () => {
    // TODO(backend): GET /api/nutrition/plans/:id/pdf para exportación server-side.
    window.print();
  };

  return (
    <>
      <PageHeader
        title="Nutrición"
        description={`Plan dietético de ${plan.memberName} · ${plan.goal}`}
        actions={
          <Button variant="outline" icon={FileDown} onClick={handlePrint}>
            Exportar a PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kcal objetivo" value={`${plan.targets.kcal.toLocaleString("es-ES")} kcal`} icon={Flame} accent="teal" />
        {slices.map((s) => (
          <StatCard key={s.key} label={`% ${s.label}`} value={`${s.pct}%`} icon={s.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Distribución de macronutrientes: donut SVG puro + barras de progreso. */}
        <Card className="xl:col-span-2">
          <CardHeader title="Distribución de macronutrientes" description={`Reparto calórico · ${Math.round(macroKcal).toLocaleString("es-ES")} kcal totales`} />
          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Distribución de macronutrientes">
                  {/* Pista de fondo */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-surface-muted"
                  />
                  {/* Segmentos: cada uno rota -90° para empezar arriba. */}
                  {slices.map((s) => {
                    const dash = (s.pct / 100) * circumference;
                    const seg = (
                      <circle
                        key={s.key}
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={stroke}
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offsetAcc}
                        transform="rotate(-90 90 90)"
                        strokeLinecap="butt"
                      />
                    );
                    offsetAcc += dash;
                    return seg;
                  })}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-content">{Math.round(macroKcal).toLocaleString("es-ES")}</span>
                  <span className="text-xs text-content-subtle">kcal de macros</span>
                </div>
              </div>

              <ul className="w-full space-y-3">
                {slices.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-content">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <span className="text-content-muted">
                      <span className="font-semibold text-content">{s.pct}%</span> · {Math.round(s.grams)} g
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 space-y-4 border-t border-line pt-5">
              {slices.map((s) => {
                const pctTarget = s.targetG > 0 ? Math.round((s.grams / s.targetG) * 100) : 0;
                return (
                  <div key={s.key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-content-muted">{s.label}</span>
                      <span className="font-medium text-content">
                        {Math.round(s.grams)} / {s.targetG} g
                        <span className="ml-2 text-content-subtle">{pctTarget}%</span>
                      </span>
                    </div>
                    <Progress value={pctTarget} tone={s.tone} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Desglose de comidas por bloques. */}
        <div className="space-y-6 xl:col-span-3">
          {plan.meals.map((meal) => {
            const totals = mealTotals(meal);
            return (
              <Card key={meal.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-brand-800" />
                      {meal.block}
                    </span>
                  }
                  action={<Badge tone="brand">{Math.round(totals.kcal).toLocaleString("es-ES")} kcal</Badge>}
                />
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-content-subtle">
                          <th className="px-5 py-2 font-medium">Alimento</th>
                          <th className="px-3 py-2 text-right font-medium">Cant.</th>
                          <th className="px-3 py-2 text-right font-medium">Kcal</th>
                          <th className="px-3 py-2 text-right font-medium">Prot.</th>
                          <th className="px-3 py-2 text-right font-medium">Carb.</th>
                          <th className="px-5 py-2 text-right font-medium">Grasa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meal.items.map((it: MealItem) => (
                          <tr key={it.id} className="border-b border-line/60 last:border-0">
                            <td className="px-5 py-2.5 text-content">{it.name}</td>
                            <td className="px-3 py-2.5 text-right text-content-muted">{it.qtyG} g</td>
                            <td className="px-3 py-2.5 text-right text-content">{it.kcal}</td>
                            <td className="px-3 py-2.5 text-right text-content-muted">{it.proteinG} g</td>
                            <td className="px-3 py-2.5 text-right text-content-muted">{it.carbsG} g</td>
                            <td className="px-5 py-2.5 text-right text-content-muted">{it.fatG} g</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-muted/50 font-medium text-content">
                          <td className="px-5 py-2.5">Subtotal {meal.block}</td>
                          <td className="px-3 py-2.5" />
                          <td className="px-3 py-2.5 text-right">{Math.round(totals.kcal)}</td>
                          <td className="px-3 py-2.5 text-right">{Math.round(totals.proteinG)} g</td>
                          <td className="px-3 py-2.5 text-right">{Math.round(totals.carbsG)} g</td>
                          <td className="px-5 py-2.5 text-right">{Math.round(totals.fatG)} g</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
