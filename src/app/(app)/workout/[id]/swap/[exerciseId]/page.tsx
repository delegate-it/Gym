import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getExercise } from "@/lib/exercises";
import { alternativesFor } from "@/lib/planner";
import { plannerInput } from "@/lib/plans";
import { swapWorkoutExercise } from "@/app/actions/workout";
import { ActionButton } from "@/components/ActionButton";
import { AlternativesList } from "@/components/AlternativesList";

export default async function SwapInWorkout({ params, searchParams }: {
  params: Promise<{ id: string; exerciseId: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const [{ id, exerciseId }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const workout = await db.workout.findFirst({ where: { id, userId: user.id, completedAt: null } });
  const ex = getExercise(decodeURIComponent(exerciseId));
  if (!workout || !ex) notFound();

  const alsoPlan = sp.plan === "1";
  const input = plannerInput(user.profile);
  const { recommended, sameMuscle } = alternativesFor(ex.id, input);
  const base = `/workout/${id}/swap/${encodeURIComponent(ex.id)}`;

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/workout/${id}`} className="text-sm muted">‹ Back to workout</Link>
        <h1 className="text-2xl font-bold">Swap {ex.name}</h1>
        <p className="text-sm muted">Equipment busy or something doesn&apos;t feel right? Pick a replacement. Sets you&apos;ve already ticked off stay as they are.</p>
      </div>

      <Link href={alsoPlan ? base : `${base}?plan=1`} replace className="card flex items-center gap-3 p-3">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm font-bold ${alsoPlan ? "border-brand-500 bg-brand-500 text-white dark:text-zinc-950" : "border-zinc-300 dark:border-zinc-600"}`}>
          {alsoPlan ? "✓" : ""}
        </span>
        <span className="text-sm">
          <b>Also change it in my plan</b>
          <span className="block muted">Otherwise it&apos;s just for today.</span>
        </span>
      </Link>

      <AlternativesList
        recommended={recommended}
        sameMuscle={sameMuscle}
        muscle={ex.primary[0]}
        screened={input.limitations.length > 0}
        libraryHref={`/exercises?add=${id}`}
        actionFor={(newId) => <ActionButton action={swapWorkoutExercise.bind(null, id, ex.id, newId, alsoPlan)}>Use</ActionButton>}
      />
    </div>
  );
}
