import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getExercise, imageUrl, videoUrl } from "@/lib/exercises";
import { toDisplay, type Units } from "@/lib/units";
import { injuryConflicts, injuryLabel, parseLimitations } from "@/lib/injuries";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function ExerciseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ex = getExercise(decodeURIComponent(id));
  if (!ex) notFound();
  const user = await requireUser();
  const units = user.profile.units as Units;
  const conflicts = injuryConflicts(ex, parseLimitations(user.profile.limitations));
  const describedAvoid = user.profile.injuryAvoid.split(",").includes(ex.id);

  const sets = await db.workoutSet.findMany({
    where: { exerciseId: ex.id, done: true, workout: { userId: user.id, completedAt: { not: null } } },
    include: { workout: { select: { completedAt: true } } },
    orderBy: [{ workout: { completedAt: "desc" } }, { setNumber: "asc" }],
    take: 200,
  });
  const best = sets.reduce<(typeof sets)[number] | null>((b, s) => (s.weight != null && (!b || (s.weight ?? 0) > (b.weight ?? 0)) ? s : b), null);
  const sessions = new Map<string, typeof sets>();
  for (const s of sets) {
    const key = s.workout.completedAt!.toDateString();
    sessions.set(key, [...(sessions.get(key) ?? []), s]);
  }

  return (
    <div className="space-y-5">
      <Link href="/exercises" className="text-sm muted">‹ Library</Link>
      <div>
        <h1 className="text-2xl font-bold">{ex.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="chip">{cap(ex.level)}</span>
          <span className="chip">{cap(ex.equipment)}</span>
          <span className="chip">{cap(ex.category)}</span>
          {ex.mechanic && <span className="chip">{cap(ex.mechanic)}</span>}
        </div>
      </div>

      {conflicts.length > 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          ⚠️ This exercise can load your <b>{conflicts.map((l) => injuryLabel(l).toLowerCase()).join(" and ")}</b>. Consider a safer alternative,
          or keep it light and stop if it hurts.
        </p>
      )}

      {describedAvoid && conflicts.length === 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          ⚠️ Based on the injury you described, this exercise is best avoided for now.
        </p>
      )}

      <ExerciseAnimation images={ex.images.map(imageUrl)} alt={ex.name} />

      <a href={videoUrl(ex)} target="_blank" rel="noopener noreferrer" className="btn w-full bg-red-600 text-white hover:bg-red-700">
        ▶ Watch video demonstrations
      </a>

      <section className="card">
        <h2 className="mb-2 font-bold">Muscles worked</h2>
        <p className="text-sm"><b>Primary:</b> {ex.primary.map(cap).join(", ")}</p>
        {ex.secondary.length > 0 && <p className="text-sm muted"><b>Secondary:</b> {ex.secondary.map(cap).join(", ")}</p>}
      </section>

      <section className="card">
        <h2 className="mb-2 font-bold">How to do it</h2>
        <ol className="space-y-2 text-sm">
          {ex.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white dark:text-zinc-950">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <h2 className="mb-2 font-bold">Your history</h2>
        {sessions.size === 0 ? (
          <p className="text-sm muted">You haven&apos;t logged this exercise yet.</p>
        ) : (
          <>
            {best && <p className="mb-2 text-sm">🏆 Best: <b>{toDisplay(best.weight, units)} {units} × {best.reps}</b></p>}
            <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
              {[...sessions.entries()].slice(0, 8).map(([date, s]) => (
                <li key={date} className="flex justify-between gap-3 py-2">
                  <span className="muted">{new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                  <span className="text-right">{s.map((x) => `${toDisplay(x.weight, units) ?? "–"}×${x.reps ?? "–"}`).join(", ")}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
