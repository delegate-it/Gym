import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfWeek } from "@/lib/data";
import { toDisplay, type Units } from "@/lib/units";
import { logBodyWeight, deleteBodyWeight } from "@/app/actions/progress";
import { WeightChart } from "@/components/WeightChart";

export default async function ProgressPage() {
  const user = await requireUser();
  const units = user.profile.units as Units;
  const [workouts, weights] = await Promise.all([
    db.workout.findMany({
      where: { userId: user.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      include: { sets: { where: { done: true }, select: { weight: true, reps: true, exerciseId: true } } },
    }),
    db.bodyWeight.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
  ]);

  // Consecutive weeks (ending this week or last) with at least one workout.
  const weekKeys = new Set(workouts.map((w) => startOfWeek(w.completedAt!).getTime()));
  let streak = 0;
  const cursor = startOfWeek();
  if (!weekKeys.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7);
  while (weekKeys.has(cursor.getTime())) { streak++; cursor.setDate(cursor.getDate() - 7); }

  const volume = (sets: { weight: number | null; reps: number | null }[]) => sets.reduce((v, s) => v + (s.weight ?? 0) * (s.reps ?? 0), 0);
  const totalVolume = workouts.reduce((v, w) => v + volume(w.sets), 0);
  const thisWeek = workouts.filter((w) => w.completedAt! >= startOfWeek()).length;
  const fmtNum = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : Math.round(n).toLocaleString());

  const stats = [
    ["Workouts", String(workouts.length)],
    ["This week", `${thisWeek}/${user.profile.daysPerWeek}`],
    ["Week streak", `${streak} 🔥`],
    [`Lifted (${units})`, fmtNum(toDisplay(totalVolume, units) ?? 0)],
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Progress</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-3">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs muted">{label}</div>
          </div>
        ))}
      </div>

      <section className="card space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">Body weight</h2>
          {weights.length > 0 && <span className="text-sm muted">Latest {toDisplay(weights[weights.length - 1].weightKg, units)} {units}</span>}
        </div>
        <WeightChart units={units} points={weights.map((w) => ({ date: w.date, value: toDisplay(w.weightKg, units)! }))} />
        <form action={logBodyWeight} className="flex gap-2">
          <input name="weight" inputMode="decimal" placeholder={`Today's weight (${units})`} className="input flex-1 py-2" required />
          <button className="btn-primary py-2">Log</button>
        </form>
        {weights.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer muted">All entries</summary>
            <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
              {[...weights].reverse().map((w) => (
                <li key={w.id} className="flex items-center justify-between py-1.5">
                  <span className="muted">{w.date.toLocaleDateString()}</span>
                  <span className="flex items-center gap-3">
                    {toDisplay(w.weightKg, units)} {units}
                    <form action={deleteBodyWeight.bind(null, w.id)}><button className="text-xs text-red-600">Delete</button></form>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Workout history</h2>
        {workouts.length === 0 && <p className="card text-sm muted">No workouts yet. Your first one is waiting on the <Link href="/today" className="underline">Today</Link> tab.</p>}
        {workouts.slice(0, 50).map((w) => {
          const mins = Math.round((w.completedAt!.getTime() - w.startedAt.getTime()) / 60000);
          return (
            <Link key={w.id} href={`/progress/workout/${w.id}`} className="card flex items-center justify-between p-3">
              <div>
                <p className="font-semibold">{w.title}</p>
                <p className="text-xs muted">
                  {w.completedAt!.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {mins} min · {w.sets.length} sets
                </p>
              </div>
              <span className="text-sm muted">{fmtNum(toDisplay(volume(w.sets), units) ?? 0)} {units} ›</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
