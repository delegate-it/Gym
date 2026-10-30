import type { Goal } from "./planner";

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "active" | "very_active";
export type Diet = "none" | "vegetarian" | "vegan";

export type NutritionInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  daysPerWeek: number;
  goal: Goal;
  diet: Diet;
  mealsPerDay: number;
};

type Macros = { kcal: number; protein: number; carbs: number; fat: number };
export type MealItem = { food: string; grams: number; unit?: string };
export type Meal = { name: string; items: MealItem[]; totals: Macros };
export type NutritionPlan = {
  bmr: number;
  tdee: number;
  targets: Macros & { fiber: number; waterL: number };
  explanation: string[];
  meals: Meal[];
  tips: string[];
};

const ACTIVITY_FACTOR: Record<Activity, number> = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 };

// Calories adjustment by goal, as a fraction of maintenance.
const GOAL_ADJUST: Record<Goal, number> = { fat_loss: -0.2, muscle: 0.1, strength: 0.05, fitness: 0 };
// Protein in g per kg of (reference) body weight — within ISSN recommendations of 1.4–2.2 g/kg.
const PROTEIN_PER_KG: Record<Goal, number> = { fat_loss: 2.0, muscle: 1.8, strength: 1.8, fitness: 1.6 };

export function calculateNutrition(input: NutritionInput): NutritionPlan {
  // Mifflin-St Jeor equation.
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + (input.sex === "male" ? 5 : -161);
  const factor = Math.min(1.9, ACTIVITY_FACTOR[input.activity] + input.daysPerWeek * 0.025);
  const tdee = bmr * factor;

  const floor = input.sex === "male" ? 1500 : 1200;
  const kcal = Math.max(floor, Math.round((tdee * (1 + GOAL_ADJUST[input.goal])) / 10) * 10);

  // For higher body fat, base protein on a healthy reference weight (BMI 25) instead.
  const heightM = input.heightCm / 100;
  const bmi = input.weightKg / (heightM * heightM);
  const refWeight = bmi > 30 ? 25 * heightM * heightM : input.weightKg;
  const protein = Math.round(refWeight * PROTEIN_PER_KG[input.goal]);
  const fat = Math.round(Math.max((kcal * 0.27) / 9, input.weightKg * 0.6));
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = Math.round((kcal / 1000) * 14);
  const waterL = Math.round(input.weightKg * 0.035 * 10) / 10 + 0.5;

  const targets = { kcal, protein, carbs, fat, fiber, waterL };
  const adj = GOAL_ADJUST[input.goal];

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targets,
    explanation: [
      `Your body burns about ${Math.round(bmr)} kcal at rest (Mifflin-St Jeor equation) and about ${Math.round(tdee)} kcal per day with your activity and training.`,
      adj < 0
        ? `For fat loss you eat ${Math.abs(adj * 100)}% below that — roughly 0.5–1% of body weight lost per week.`
        : adj > 0
          ? `To ${input.goal === "muscle" ? "build muscle" : "get stronger"} you eat a small surplus (+${adj * 100}%) to fuel growth while limiting fat gain.`
          : "You eat at maintenance to fuel training while keeping your weight stable.",
      `Protein at ${PROTEIN_PER_KG[input.goal]} g per kg${refWeight !== input.weightKg ? " of a healthy reference weight" : " of body weight"} protects and builds muscle.`,
      "Adjust after 2–3 weeks: if your weight isn't moving the way you want, change calories by about 150–200 kcal.",
    ],
    meals: buildMeals(input, { kcal, protein, carbs, fat }),
    tips: [
      "Hit your protein and calories first — the rest is fine-tuning.",
      "Fill half your plate with vegetables or salad at lunch and dinner.",
      `Drink about ${waterL} L of water a day, more on hot or training days.`,
      "Eat a meal with protein and carbs 1–3 hours before training.",
      "Sleep 7–9 hours. It matters as much as the training.",
      ...(input.diet === "vegan" ? ["Vegans: consider supplementing vitamin B12 and vitamin D, and mix protein sources (soy, legumes, grains)."] : []),
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Sample day of eating, with portions solved to hit the targets.      */
/* ------------------------------------------------------------------ */

type Food = { name: string; p: number; c: number; f: number; unit?: [string, number] }; // per 100 g; unit = [name, grams]

const F = {
  eggs: { name: "Eggs", p: 13, c: 1, f: 10, unit: ["egg", 50] },
  greekYogurt: { name: "Greek yogurt (low fat)", p: 10, c: 4, f: 2 },
  soyYogurt: { name: "Soy yogurt", p: 4, c: 3, f: 2 },
  tofu: { name: "Firm tofu", p: 15, c: 2, f: 8 },
  tempeh: { name: "Tempeh", p: 19, c: 9, f: 11 },
  chicken: { name: "Chicken breast (cooked)", p: 31, c: 0, f: 4 },
  salmon: { name: "Salmon (cooked)", p: 25, c: 0, f: 12 },
  beef: { name: "Lean beef mince (cooked)", p: 26, c: 0, f: 10 },
  cottage: { name: "Cottage cheese", p: 11, c: 3, f: 4 },
  lentils: { name: "Lentils (cooked)", p: 9, c: 20, f: 0.4 },
  whey: { name: "Whey protein", p: 80, c: 8, f: 6, unit: ["scoop", 30] },
  peaProtein: { name: "Plant protein powder", p: 75, c: 5, f: 7, unit: ["scoop", 30] },
  oats: { name: "Rolled oats", p: 13, c: 60, f: 7 },
  rice: { name: "Rice (cooked)", p: 2.7, c: 28, f: 0.3 },
  potato: { name: "Potatoes (cooked)", p: 2, c: 17, f: 0.1 },
  quinoa: { name: "Quinoa (cooked)", p: 4.4, c: 21, f: 1.9 },
  pasta: { name: "Wholewheat pasta (cooked)", p: 5, c: 27, f: 1 },
  bread: { name: "Wholegrain bread", p: 10, c: 43, f: 3.5, unit: ["slice", 35] },
  banana: { name: "Banana", p: 1.1, c: 23, f: 0.3, unit: ["banana", 120] },
  berries: { name: "Berries", p: 1, c: 12, f: 0.4 },
  veg: { name: "Mixed vegetables / salad", p: 2, c: 6, f: 0.3 },
  oliveOil: { name: "Olive oil", p: 0, c: 0, f: 100, unit: ["tbsp", 13] },
  peanutButter: { name: "Peanut butter", p: 25, c: 20, f: 50, unit: ["tbsp", 16] },
  nuts: { name: "Almonds / mixed nuts", p: 21, c: 22, f: 50 },
  avocado: { name: "Avocado", p: 2, c: 9, f: 15 },
} satisfies Record<string, Food>;

type MealTemplate = { name: string; share: number; protein: Food; carb: Food; fat: Food; fixed?: [Food, number][] };

function templates(diet: Diet): Record<"breakfast" | "lunch" | "dinner" | "snack", MealTemplate> {
  const meat = diet === "none";
  const vegan = diet === "vegan";
  return {
    breakfast: {
      name: "Breakfast", share: 0.25,
      protein: vegan ? F.tofu : meat ? F.eggs : F.greekYogurt,
      carb: F.oats, fat: vegan ? F.nuts : F.peanutButter,
      fixed: [[F.berries, 100]],
    },
    lunch: {
      name: "Lunch", share: 0.3,
      protein: vegan ? F.tempeh : meat ? F.chicken : F.eggs,
      carb: vegan ? F.quinoa : F.rice, fat: F.oliveOil,
      fixed: [[F.veg, 150]],
    },
    dinner: {
      name: "Dinner", share: 0.3,
      protein: vegan ? F.tofu : meat ? F.salmon : F.cottage,
      carb: vegan ? F.lentils : meat ? F.potato : F.pasta, fat: vegan ? F.avocado : F.oliveOil,
      fixed: [[F.veg, 200]],
    },
    snack: {
      name: "Snack", share: 0.15,
      protein: vegan ? F.peaProtein : F.whey,
      carb: F.banana, fat: vegan ? F.nuts : F.peanutButter,
    },
  };
}

const MEAL_ORDER: Record<number, ("breakfast" | "lunch" | "dinner" | "snack")[]> = {
  2: ["breakfast", "dinner"],
  3: ["breakfast", "lunch", "dinner"],
  4: ["breakfast", "lunch", "snack", "dinner"],
  5: ["breakfast", "snack", "lunch", "snack", "dinner"],
  6: ["breakfast", "snack", "lunch", "snack", "dinner", "snack"],
};

const round5 = (g: number) => Math.max(0, Math.round(g / 5) * 5);
const macrosOf = (food: Food, g: number): Macros => ({
  protein: (food.p * g) / 100,
  carbs: (food.c * g) / 100,
  fat: (food.f * g) / 100,
  kcal: ((food.p * 4 + food.c * 4 + food.f * 9) * g) / 100,
});

function buildMeals(input: NutritionInput, t: Macros): Meal[] {
  const order = MEAL_ORDER[Math.min(6, Math.max(2, input.mealsPerDay))];
  const tpl = templates(input.diet);
  const totalShare = order.reduce((s, k) => s + tpl[k].share, 0);

  return order.map((key) => {
    const m = tpl[key];
    const share = m.share / totalShare;
    const goal = { protein: t.protein * share, carbs: t.carbs * share, fat: t.fat * share };
    const parts: [Food, number][] = [...(m.fixed ?? [])];

    // Solve portions for the protein, carb and fat sources. Each food also carries
    // some of the other macros, so iterate a few times until the amounts settle.
    let gp = 0, gc = 0, gf = 0;
    for (let i = 0; i < 5; i++) {
      const base = (skip: Food) => [...(m.fixed ?? []), [m.protein, gp], [m.carb, gc], [m.fat, gf]]
        .filter(([f]) => f !== skip)
        .reduce((a, [f, g]) => {
          const x = macrosOf(f as Food, g as number);
          return { protein: a.protein + x.protein, carbs: a.carbs + x.carbs, fat: a.fat + x.fat };
        }, { protein: 0, carbs: 0, fat: 0 });
      gp = Math.max(0, ((goal.protein - base(m.protein).protein) / m.protein.p) * 100);
      gc = Math.max(0, ((goal.carbs - base(m.carb).carbs) / m.carb.c) * 100);
      gf = Math.max(0, ((goal.fat - base(m.fat).fat) / m.fat.f) * 100);
    }
    parts.push([m.protein, round5(gp)], [m.carb, round5(gc)], [m.fat, round5(gf)]);

    const items = parts.filter(([, g]) => g > 0).map(([f, g]) => toItem(f, g));
    const totals = parts.reduce((a, [f, g]) => {
      const x = macrosOf(f, g);
      return { kcal: a.kcal + x.kcal, protein: a.protein + x.protein, carbs: a.carbs + x.carbs, fat: a.fat + x.fat };
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      name: m.name,
      items,
      totals: { kcal: Math.round(totals.kcal), protein: Math.round(totals.protein), carbs: Math.round(totals.carbs), fat: Math.round(totals.fat) },
    };
  });
}

function toItem(food: Food, grams: number): MealItem {
  if (food.unit) {
    const [unit, size] = food.unit;
    // Whole items (eggs, bananas, slices) round to whole numbers; scoops and spoons to halves.
    const whole = !["scoop", "tbsp"].includes(unit);
    const count = whole ? Math.max(1, Math.round(grams / size)) : Math.max(0.5, Math.round((grams / size) * 2) / 2);
    return { food: food.name, grams: whole ? count * size : grams, unit: `${count} ${unit}${count > 1 ? "s" : ""}` };
  }
  return { food: food.name, grams };
}
