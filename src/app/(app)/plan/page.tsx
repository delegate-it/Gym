import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getActivePlan, getNextDayIndex } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { StartButton } from "@/components/StartButton";

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const user = await requireUser();
  const plan = await getActivePlan(user.id);
  if (!plan) {
    return (
      <div className="card">
        <p className="mb-3">No plan yet.</p>
        <Link href="/profile" className="btn-primary w-full">Create my plan</Link>
      </div>
    );
  }
  const nextIdx = await getNextDayIndex(user.id, plan.id, plan.days.length);

  return (
    <div className="space-y-5">
      {welcome && (
        <div className="rounded-2xl bg-brand-500 p-4 text-white dark:text-zinc-950">
          <p className="text-lg font-bold">Your plan is ready 🎉</p>
          <p className="text-sm opacity-90">Have a look below, then start your first workout. Your nutrition targets are under Food.</p>
        </div>
      )}

      <div>
        <p className="text-sm muted">Your training plan</p>
        <h1 className="text-2xl font-bold">{plan.name}</h1>
        <p className="mt-1 text-sm muted">{plan.summary}</p>
        <p className="mt-2 text-xs"><span className="chip">Based on: {plan.basedOn}</span></p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
          const day = plan.days.find((x) => x.weekday === d);
          return (
            <div key={d} className={`min-w-12 flex-1 rounded-xl p-2 text-center text-xs ${day ? "bg-brand-500 text-white dark:text-zinc-950" : "bg-zinc-100 muted dark:bg-zinc-900"}`}>
              <div className="font-semibold">{d}</div>
              <div className="truncate">{day ? day.name.replace(/ \(.+\)/, "").replace("Full Body", "Full") : "Rest"}</div>
            </div>
          );
        })}
      </div>
      <p className="-mt-3 text-xs muted">Suggested schedule — train on any days you like, just keep the order and rest a day between hard sessions when you can.</p>

      {plan.days.map((day, i) => (
        <section key={i} className={`card ${i === nextIdx ? "ring-2 ring-brand-500" : ""}`}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs muted">Day {i + 1} · {day.weekday}{i === nextIdx && " · Up next"}</p>
              <h2 className="text-lg font-bold">{day.name}</h2>
              <p className="text-sm muted">{day.focus}</p>
            </div>
            <StartButton dayIndex={i} label="Start" className={i === nextIdx ? "btn-primary py-2" : "btn-ghost py-2"} />
          </div>
          <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {day.exercises.map((e) => (
              <li key={e.exerciseId}>
                <Link href={`/exercises/${e.exerciseId}`} className="flex items-center gap-3 py-2">
                  <ExerciseThumb id={e.exerciseId} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{getExercise(e.exerciseId)?.name}</p>
                    <p className="text-xs muted">{e.sets} sets × {e.reps} reps · rest {e.restSec}s</p>
                  </div>
                  <span className="muted">›</span>
                </Link>
              </li>
            ))}
          </ol>
          {day.cardio && <p className="mt-2 rounded-lg bg-zinc-100 p-2 text-xs dark:bg-zinc-800">🏃 {day.cardio}</p>}
        </section>
      ))}

      <section className="card space-y-3 text-sm">
        <h2 className="text-lg font-bold">How to use this plan</h2>
        <p><b>Warm-up:</b> {plan.warmup}</p>
        <ul className="list-disc space-y-1.5 pl-5">
          {plan.progression.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <Link href="/profile" className="btn-ghost w-full">Change my answers / rebuild plan</Link>
      </section>
    </div>
  );
}
