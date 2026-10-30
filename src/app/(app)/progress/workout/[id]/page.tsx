import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getExercise } from "@/lib/exercises";
import { toDisplay, type Units } from "@/lib/units";
import { deleteWorkout } from "@/app/actions/workout";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function WorkoutSummary({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string }> }) {
  const [{ id }, { done }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const units = user.profile.units as Units;
  const w = await db.workout.findFirst({ where: { id, userId: user.id }, include: { sets: { orderBy: { setNumber: "asc" } } } });
  if (!w || !w.completedAt) notFound();

  const ids = [...new Set(w.sets.map((s) => s.exerciseId))];
  const mins = Math.round((w.completedAt.getTime() - w.startedAt.getTime()) / 60000);
  const vol = w.sets.reduce((v, s) => v + (s.weight ?? 0) * (s.reps ?? 0), 0);

  return (
    <div className="space-y-5">
      {done && (
        <div className="rounded-2xl bg-brand-500 p-5 text-center text-white dark:text-zinc-950">
          <div className="text-4xl">🎉</div>
          <p className="text-xl font-bold">Workout complete!</p>
          <p className="text-sm opacity-90">Great work. Recover well and eat your protein.</p>
        </div>
      )}
      <div>
        <Link href="/progress" className="text-sm muted">‹ Progress</Link>
        <h1 className="text-2xl font-bold">{w.title}</h1>
        <p className="text-sm muted">{w.completedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card p-3"><div className="text-xl font-bold">{mins}</div><div className="text-xs muted">minutes</div></div>
        <div className="card p-3"><div className="text-xl font-bold">{w.sets.length}</div><div className="text-xs muted">sets</div></div>
        <div className="card p-3"><div className="text-xl font-bold">{Math.round(toDisplay(vol, units) ?? 0).toLocaleString()}</div><div className="text-xs muted">{units} lifted</div></div>
      </div>
      {ids.map((exId) => (
        <section key={exId} className="card flex gap-3">
          <ExerciseThumb id={exId} size={48} />
          <div className="flex-1">
            <Link href={`/exercises/${exId}`} className="font-semibold hover:underline">{getExercise(exId)?.name ?? exId}</Link>
            <p className="text-sm muted">
              {w.sets.filter((s) => s.exerciseId === exId).map((s) => `${toDisplay(s.weight, units) ?? "–"} ${units} × ${s.reps ?? "–"}`).join(" · ")}
            </p>
          </div>
        </section>
      ))}
      {done ? (
        <Link href="/today" className="btn-primary w-full">Done</Link>
      ) : (
        <form action={deleteWorkout.bind(null, w.id)}>
          <ConfirmButton message="Delete this workout from your history?" className="w-full text-sm text-red-600">Delete this workout</ConfirmButton>
        </form>
      )}
    </div>
  );
}
