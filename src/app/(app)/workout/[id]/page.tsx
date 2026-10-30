import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActivePlan, getLastSets } from "@/lib/data";
import { getExercise, imageUrl } from "@/lib/exercises";
import { toDisplay, type Units } from "@/lib/units";
import { WorkoutLogger, type LoggerExercise } from "@/components/WorkoutLogger";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const workout = await db.workout.findFirst({ where: { id, userId: user.id }, include: { sets: { orderBy: { setNumber: "asc" } } } });
  if (!workout) notFound();
  if (workout.completedAt) redirect(`/progress/workout/${workout.id}`);

  const units = user.profile.units as Units;
  const plan = await getActivePlan(user.id);
  const day = plan?.id === workout.planId && workout.dayIndex != null ? plan.days[workout.dayIndex] : undefined;
  const ids = [...new Set(workout.sets.map((s) => s.exerciseId))];
  const last = await getLastSets(user.id, ids);

  const exercises: LoggerExercise[] = ids.map((exerciseId) => {
    const ex = getExercise(exerciseId);
    const target = day?.exercises.find((e) => e.exerciseId === exerciseId);
    return {
      exerciseId,
      name: ex?.name ?? exerciseId,
      image: ex?.images[0] ? imageUrl(ex.images[0]) : null,
      target: target ? `${target.sets} × ${target.reps}` : null,
      restSec: target?.restSec ?? 90,
      note: target?.note ?? null,
      last: (last.get(exerciseId) ?? []).map((s) => `${toDisplay(s.weight, units) ?? "–"}×${s.reps ?? "–"}`).join(", ") || null,
      sets: workout.sets
        .filter((s) => s.exerciseId === exerciseId)
        .map((s) => ({ id: s.id, weight: toDisplay(s.weight, units), reps: s.reps, done: s.done })),
    };
  });

  return <WorkoutLogger workoutId={workout.id} title={workout.title} startedAt={workout.startedAt.toISOString()} units={units} exercises={exercises} cardio={day?.cardio ?? null} />;
}
