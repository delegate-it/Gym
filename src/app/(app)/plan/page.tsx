import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getActivePlan, getNextDayIndex } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import { injuryLabel, parseLimitations } from "@/lib/injuries";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { StartButton } from "@/components/StartButton";
import { ActionButton } from "@/components/ActionButton";
import { shufflePlanDay } from "@/app/actions/plan";

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ welcome?: string; rebuilt?: string; shuffled?: string; injuries?: string }> }) {
  const { welcome, rebuilt, shuffled, injuries } = await searchParams;
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
  const injured = parseLimitations(user.profile.limitations);

  return (
    <div className="space-y-5">
      {welcome && (
        <div className="rounded-2xl bg-brand-500 p-4 text-white dark:text-zinc-950">
          <p className="text-lg font-bold">Your plan is ready 🎉</p>
          <p className="text-sm opacity-90">Have a look below, then start your first workout. Your nutrition targets are under Food.</p>
        </div>
      )}

      {rebuilt && (
        <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          ✅ Your new plan is ready. It starts from Day 1, and your history is kept.
        </div>
      )}

      {injuries && (
        <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {!injured.length ? (
            <p>✅ Injuries cleared. Use <b>Change plan → Fresh exercises</b> to bring back the full exercise selection.</p>
          ) : !plan.injuryChanges?.length ? (
            <p>✅ Your plan already avoids {injured.map((l) => injuryLabel(l).toLowerCase()).join(", ")} — nothing needed to change.</p>
          ) : (
            <>
              <p className="font-semibold">✅ Plan adjusted for your {injured.map((l) => injuryLabel(l).toLowerCase()).join(", ")}:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {plan.injuryChanges.map((c, k) => (
                  <li key={k}>
                    {c.day}: {getExercise(c.from)?.name} → {c.to ? getExercise(c.to)?.name : <i>removed (no safe alternative)</i>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm muted">Your training plan{plan.edited && <span className="chip ml-2">Customised</span>}</p>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
          </div>
          <Link href="/plan/change" className="btn-ghost shrink-0 px-3 py-2 text-sm">Change plan</Link>
        </div>
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

      <Link href="/plan/injuries" className="card flex items-center gap-3 p-3">
        <span className="text-2xl">🩹</span>
        <span className="min-w-0 flex-1 text-sm">
          <b>{injured.length ? "Injuries: " + injured.map(injuryLabel).join(", ") : "Injured or in pain?"}</b>
          <span className="block muted">{injured.length ? "Your plan avoids exercises that load these areas. Tap to update." : "Tell us where, and we'll swap out exercises that load it."}</span>
        </span>
        <span className="muted">›</span>
      </Link>

      {plan.days.map((day, i) => (
        <section key={i} id={`day-${i}`} className={`card scroll-mt-20 ${i === nextIdx ? "ring-2 ring-brand-500" : ""}`}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs muted">Day {i + 1} · {day.weekday}{i === nextIdx && " · Up next"}</p>
              <h2 className="text-lg font-bold">{day.name}</h2>
              <p className="text-sm muted">{day.focus}</p>
            </div>
            <StartButton dayIndex={i} label="Start" className={i === nextIdx ? "btn-primary py-2" : "btn-ghost py-2"} />
          </div>
          <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {day.exercises.map((e, j) => (
              <li key={`${e.exerciseId}-${j}`}>
                <Link href={`/plan/edit/${i}/${j}`} className="flex items-center gap-3 py-2">
                  <ExerciseThumb id={e.exerciseId} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{getExercise(e.exerciseId)?.name}</p>
                    <p className="text-xs muted">{e.sets} sets × {e.reps} reps · rest {e.restSec}s</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs muted" aria-label="Edit">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    Edit
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {shuffled === String(i) && (
            <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              ✅ New exercises for this day. Not quite right? Tap again for another mix, or tap an exercise to pick one yourself.
            </p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ActionButton action={shufflePlanDay.bind(null, i, "plan")} className="btn-ghost py-2 text-sm">🔀 Change all exercises</ActionButton>
            <Link href={`/exercises?planDay=${i}`} className="btn rounded-xl border border-dashed border-zinc-300 py-2 text-sm font-medium muted dark:border-zinc-700">
              + Add exercise
            </Link>
          </div>
          {day.note && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">🩹 {day.note}</p>}
          {day.cardio && <p className="mt-2 rounded-lg bg-zinc-100 p-2 text-xs dark:bg-zinc-800">🏃 {day.cardio}</p>}
        </section>
      ))}

      <section className="card space-y-3 text-sm">
        <h2 className="text-lg font-bold">How to use this plan</h2>
        <p><b>Warm-up:</b> {plan.warmup}</p>
        <ul className="list-disc space-y-1.5 pl-5">
          {plan.progression.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <p className="muted">Tap any exercise to swap it, change its sets and reps, or remove it. Use <b>Change plan</b> for a whole new plan.</p>
      </section>
    </div>
  );
}
