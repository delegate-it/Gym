import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { calculateNutrition, type NutritionInput } from "@/lib/nutrition";

export default async function NutritionPage() {
  const user = await requireUser();
  const n = calculateNutrition(user.profile as unknown as NutritionInput);
  const t = n.targets;
  const kcalFrom = { protein: t.protein * 4, carbs: t.carbs * 4, fat: t.fat * 9 };
  const sum = kcalFrom.protein + kcalFrom.carbs + kcalFrom.fat;
  const macros = [
    { key: "Protein", g: t.protein, pct: kcalFrom.protein / sum, color: "bg-sky-500" },
    { key: "Carbs", g: t.carbs, pct: kcalFrom.carbs / sum, color: "bg-amber-500" },
    { key: "Fat", g: t.fat, pct: kcalFrom.fat / sum, color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm muted">Your nutrition plan</p>
        <h1 className="text-2xl font-bold">{t.kcal.toLocaleString()} kcal per day</h1>
      </div>

      <section className="card space-y-3">
        <div className="flex h-3 overflow-hidden rounded-full">
          {macros.map((m) => <div key={m.key} className={m.color} style={{ width: `${m.pct * 100}%` }} />)}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {macros.map((m) => (
            <div key={m.key}>
              <div className="flex items-center justify-center gap-1.5 text-xs muted"><span className={`h-2 w-2 rounded-full ${m.color}`} />{m.key}</div>
              <div className="text-xl font-bold">{m.g}g</div>
              <div className="text-xs muted">{Math.round(m.pct * 100)}%</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">🥦 Fiber <b>{t.fiber}g+</b></div>
          <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">💧 Water <b>{t.waterL} L</b></div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Example day of eating</h2>
        {n.meals.map((meal, i) => (
          <div key={i} className="card">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="font-semibold">{meal.name}</h3>
              <span className="text-xs muted">{meal.totals.kcal} kcal · P {meal.totals.protein} · C {meal.totals.carbs} · F {meal.totals.fat}</span>
            </div>
            <ul className="space-y-1 text-sm">
              {meal.items.map((item) => (
                <li key={item.food} className="flex justify-between gap-3">
                  <span>{item.food}</span>
                  <span className="shrink-0 muted">{item.unit ? `${item.unit} (${item.grams} g)` : `${item.grams} g`}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="text-xs muted">Swap foods freely for ones you like with similar protein, carbs and fat. Weights are cooked weights unless stated.</p>
      </section>

      <section className="card space-y-2 text-sm">
        <h2 className="text-lg font-bold">How we worked this out</h2>
        <ul className="list-disc space-y-1.5 pl-5">{n.explanation.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>

      <section className="card space-y-2 text-sm">
        <h2 className="text-lg font-bold">Simple rules</h2>
        <ul className="list-disc space-y-1.5 pl-5">{n.tips.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="pt-2 text-xs muted">General guidance only, not medical advice. If you have a medical condition, are pregnant, or have a history of disordered eating, talk to a doctor or registered dietitian first.</p>
      </section>

      <Link href="/profile" className="btn-ghost w-full">Update weight, diet or goal</Link>
    </div>
  );
}
