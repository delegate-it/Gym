"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { addSet, discardWorkout, finishWorkout, removeSet, updateSet } from "@/app/actions/workout";

type LoggerSet = { id: string; weight: number | null; reps: number | null; done: boolean };
export type LoggerExercise = {
  exerciseId: string;
  name: string;
  image: string | null;
  target: string | null;
  restSec: number;
  note: string | null;
  last: string | null;
  sets: LoggerSet[];
};

const parse = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

function useElapsed(since: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function WorkoutLogger({ workoutId, title, startedAt, units, exercises: initial, cardio }: {
  workoutId: string; title: string; startedAt: string; units: string; exercises: LoggerExercise[]; cardio: string | null;
}) {
  const [exercises, setExercises] = useState(initial);
  const [rest, setRest] = useState<{ until: number; total: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finishing, startFinish] = useTransition();
  const elapsed = useElapsed(startedAt);

  useEffect(() => {
    if (!rest) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= rest.until) {
        setRest(null);
        if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
      }
    }, 250);
    return () => clearInterval(t);
  }, [rest]);

  const patchSet = (exIdx: number, setId: string, patch: Partial<LoggerSet>) =>
    setExercises((prev) => prev.map((e, i) => (i !== exIdx ? e : { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) })));

  const toggleDone = (exIdx: number, set: LoggerSet) => {
    const done = !set.done;
    patchSet(exIdx, set.id, { done });
    updateSet(set.id, { weight: set.weight, reps: set.reps, done });
    if (done) {
      const total = exercises[exIdx].restSec;
      setNow(Date.now());
      setRest({ until: Date.now() + total * 1000, total });
    }
  };

  const doneCount = exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const totalCount = exercises.reduce((n, e) => n + e.sets.length, 0);
  const remaining = rest ? Math.max(0, Math.ceil((rest.until - now) / 1000)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm muted">Workout in progress · {elapsed}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <p className="text-sm font-medium">{doneCount}/{totalCount} sets</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }} />
      </div>

      {exercises.map((ex, exIdx) => (
        <section key={ex.exerciseId} className="card space-y-3">
          <div className="flex gap-3">
            {ex.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ex.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
            )}
            <div className="min-w-0 flex-1">
              <Link href={`/exercises/${ex.exerciseId}`} className="font-semibold hover:underline">{ex.name}</Link>
              <p className="text-sm muted">
                {ex.target && <>Target {ex.target} · </>}Rest {ex.restSec}s
              </p>
              {ex.last && <p className="text-xs muted">Last time: {ex.last} ({units})</p>}
            </div>
          </div>
          {ex.note && <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">{ex.note}</p>}

          <div className="space-y-2">
            <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-1 text-xs font-medium muted">
              <span>Set</span><span>{units}</span><span>Reps</span><span />
            </div>
            {ex.sets.map((set, i) => (
              <div key={set.id} className={`grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 rounded-xl p-1 ${set.done ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}>
                <button
                  type="button"
                  className="text-center text-sm font-semibold muted"
                  title="Remove set"
                  onClick={() => {
                    if (!confirm("Remove this set?")) return;
                    setExercises((prev) => prev.map((e, j) => (j !== exIdx ? e : { ...e, sets: e.sets.filter((s) => s.id !== set.id) })));
                    removeSet(set.id);
                  }}
                >
                  {i + 1}
                </button>
                <input
                  className="input py-2 text-center" inputMode="decimal" placeholder="0" aria-label="Weight"
                  defaultValue={set.weight ?? ""}
                  onBlur={(e) => { const weight = parse(e.target.value); patchSet(exIdx, set.id, { weight }); updateSet(set.id, { weight }); }}
                />
                <input
                  className="input py-2 text-center" inputMode="numeric" placeholder="0" aria-label="Reps"
                  defaultValue={set.reps ?? ""}
                  onBlur={(e) => { const reps = parse(e.target.value); patchSet(exIdx, set.id, { reps }); updateSet(set.id, { reps }); }}
                />
                <button
                  type="button"
                  aria-label={set.done ? "Mark set not done" : "Mark set done"}
                  onClick={() => toggleDone(exIdx, set)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold transition ${set.done ? "bg-brand-500 text-white dark:text-zinc-950" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full rounded-xl border border-dashed border-zinc-300 py-2 text-sm font-medium muted dark:border-zinc-700"
            onClick={async () => {
              const created = await addSet(workoutId, ex.exerciseId);
              const prev = ex.sets[ex.sets.length - 1];
              setExercises((p) => p.map((e, j) => (j !== exIdx ? e : { ...e, sets: [...e.sets, { id: created.id, weight: prev?.weight ?? null, reps: null, done: false }] })));
            }}
          >
            + Add set
          </button>
        </section>
      ))}

      {cardio && <div className="card text-sm"><b>Cardio finisher:</b> {cardio}</div>}

      <Link href={`/exercises?add=${workoutId}`} className="btn-ghost w-full">+ Add an exercise</Link>

      <button
        className="btn-primary w-full py-4 text-lg"
        disabled={finishing}
        onClick={() => {
          if (doneCount === 0 && !confirm("No sets are ticked off yet. Finish anyway?")) return;
          startFinish(() => finishWorkout(workoutId));
        }}
      >
        {finishing ? "Saving…" : "Finish workout"}
      </button>
      <button
        className="w-full text-sm text-red-600"
        onClick={() => confirm("Discard this workout? Nothing will be saved.") && discardWorkout(workoutId)}
      >
        Discard workout
      </button>

      {rest && (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-md px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-3 text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900">
            <div className="flex-1">
              <p className="text-xs opacity-70">Rest</p>
              <p className="text-2xl font-bold tabular-nums">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20 dark:bg-zinc-900/20">
                <div className="h-full bg-brand-400" style={{ width: `${(remaining / rest.total) * 100}%` }} />
              </div>
            </div>
            <button className="rounded-lg bg-white/10 px-3 py-2 text-sm dark:bg-zinc-900/10" onClick={() => setRest({ ...rest, until: rest.until + 30_000, total: rest.total + 30 })}>+30s</button>
            <button className="rounded-lg bg-white/10 px-3 py-2 text-sm dark:bg-zinc-900/10" onClick={() => setRest(null)}>Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}
