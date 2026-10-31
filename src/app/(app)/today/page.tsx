import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActivePlan, getNextDayIndex, startOfWeek } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import { calculateNutrition, type NutritionInput } from "@/lib/nutrition";
import type { Goal } from "@/lib/planner";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { StartButton } from "@/components/StartButton";

const TIPS = [
  "Consistency beats intensity. Showing up is the win.",
  "Log every set. What gets measured gets improved.",
  "Aim for 7–9 hours of sleep — that's when muscle is built.",
  "Add a little weight or one more rep than last time. That's progress.",
  "Protein at every meal makes hitting your target easy.",
  "A 10-minute walk after meals helps recovery and digestion.",
];

export default async function Today() {
  const user = await requireUser();
  const p = user.profile;
  const plan = await getActivePlan(user.id);
  const [open, weekCount] = await Promise.all([
    db.workout.findFirst({ where: { userId: user.id, completedAt: null } }),
    db.workout.count({ where: { userId: user.id, completedAt: { gte: startOfWeek() } } }),
  ]);
  const nextIdx = plan ? await getNextDayIndex(user.id, plan.id, plan.days.length) : 0;
  const next = plan?.days[nextIdx];
  const nutrition = calculateNutrition({ ...p, goal: p.goal as Goal } as NutritionInput);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5">
      <div>
        <p className="muted">{greeting}{p.name ? `, ${p.name}` : ""} 👋</p>
        <h1 className="text-2xl font-bold">Let&apos;s get to work</h1>
      </div>

      <div className="card">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">This week</span>
          <span className="muted">{weekCount} of {p.daysPerWeek} workouts</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: p.daysPerWeek }, (_, i) => (
            <div key={i} className={`h-2.5 flex-1 rounded-full ${i < weekCount ? "bg-brand-500" : "bg-zinc-200 dark:bg-zinc-800"}`} />
          ))}
        </div>
      </div>

      {open ? (
        <div className="card border-2 border-brand-500">
          <p className="text-sm muted">You have a workout in progress</p>
          <h2 className="mb-3 text-xl font-bold">{open.title}</h2>
          <Link href={`/workout/${open.id}`} className="btn-primary w-full">Continue workout</Link>
        </div>
      ) : next ? (
        <div className="card">
          <p className="text-sm muted">Next workout · Day {nextIdx + 1} of {plan!.days.length}</p>
          <h2 className="text-xl font-bold">{next.name}</h2>
          <p className="mb-3 text-sm muted">{next.focus}</p>
          <ul className="mb-4 space-y-2">
            {next.exercises.map((e) => (
              <li key={e.exerciseId} className="flex items-center gap-3">
                <ExerciseThumb id={e.exerciseId} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{getExercise(e.exerciseId)?.name}</p>
                  <p className="text-xs muted">{e.sets} × {e.reps}</p>
                </div>
              </li>
            ))}
          </ul>
          <StartButton dayIndex={nextIdx} />
          <Link href="/plan" className="mt-2 block text-center text-sm muted underline">Pick a different day</Link>
        </div>
      ) : (
        <div className="card">
          <p className="mb-3">You don&apos;t have a plan yet.</p>
          <Link href="/profile" className="btn-primary w-full">Create my plan</Link>
        </div>
      )}

      <Link href="/nutrition" className="card block">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium">Daily nutrition targets</span>
          <span className="text-sm muted">See meal plan →</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ["kcal", nutrition.targets.kcal],
            ["Protein", `${nutrition.targets.protein}g`],
            ["Carbs", `${nutrition.targets.carbs}g`],
            ["Fat", `${nutrition.targets.fat}g`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
              <div className="font-bold">{value}</div>
              <div className="text-xs muted">{label}</div>
            </div>
          ))}
        </div>
      </Link>

      <p className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
        💡 {TIPS[new Date().getDate() % TIPS.length]}
      </p>
    </div>
  );
}
