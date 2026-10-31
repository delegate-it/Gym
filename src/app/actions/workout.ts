"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActivePlan, getLastSets } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import { fromDisplay, type Units } from "@/lib/units";

export async function startWorkout(dayIndex: number) {
  const user = await requireUser();

  const open = await db.workout.findFirst({ where: { userId: user.id, completedAt: null } });
  if (open) redirect(`/workout/${open.id}`);

  const plan = await getActivePlan(user.id);
  const day = plan?.days[dayIndex];
  if (!plan || !day) redirect("/plan");

  const last = await getLastSets(user.id, day.exercises.map((e) => e.exerciseId));
  const workout = await db.workout.create({
    data: {
      userId: user.id,
      planId: plan.id,
      dayIndex,
      title: day.name,
      sets: {
        create: day.exercises.flatMap((e, order) =>
          Array.from({ length: e.sets }, (_, i) => {
            const prev = last.get(e.exerciseId);
            const p = prev?.[i] ?? prev?.[prev.length - 1];
            // setNumber encodes exercise order (×100) so sets come back in plan order.
            return { exerciseId: e.exerciseId, setNumber: order * 100 + i, weight: p?.weight ?? null, reps: null };
          }),
        ),
      },
    },
  });
  redirect(`/workout/${workout.id}`);
}

async function ownSet(setId: string, userId: string) {
  const set = await db.workoutSet.findUnique({ where: { id: setId }, include: { workout: true } });
  if (!set || set.workout.userId !== userId) throw new Error("Not found");
  return set;
}

export async function updateSet(setId: string, values: { weight?: number | null; reps?: number | null; done?: boolean }) {
  const user = await requireUser();
  await ownSet(setId, user.id);
  const units = user.profile.units as Units;
  const clean = (n: number | null | undefined, max: number) => (n == null || !Number.isFinite(n) || n < 0 || n > max ? null : n);
  await db.workoutSet.update({
    where: { id: setId },
    data: {
      ...(values.weight !== undefined && { weight: values.weight == null ? null : clean(fromDisplay(values.weight, units), 1000) }),
      ...(values.reps !== undefined && { reps: clean(values.reps == null ? null : Math.round(values.reps), 1000) }),
      ...(values.done !== undefined && { done: values.done }),
    },
  });
}

export async function addSet(workoutId: string, exerciseId: string) {
  const user = await requireUser();
  const workout = await db.workout.findFirst({ where: { id: workoutId, userId: user.id }, include: { sets: { where: { exerciseId } } } });
  if (!workout || !getExercise(exerciseId)) throw new Error("Not found");
  const lastSet = workout.sets.sort((a, b) => b.setNumber - a.setNumber)[0];
  const created = await db.workoutSet.create({
    data: { workoutId, exerciseId, setNumber: (lastSet?.setNumber ?? 9900) + 1, weight: lastSet?.weight ?? null },
  });
  return { id: created.id, setNumber: created.setNumber };
}

export async function removeSet(setId: string) {
  const user = await requireUser();
  await ownSet(setId, user.id);
  await db.workoutSet.delete({ where: { id: setId } });
}

export async function addExercise(workoutId: string, exerciseId: string) {
  const user = await requireUser();
  const workout = await db.workout.findFirst({ where: { id: workoutId, userId: user.id, completedAt: null }, include: { sets: true } });
  if (!workout || !getExercise(exerciseId)) throw new Error("Not found");
  const nextOrder = Math.floor(Math.max(-100, ...workout.sets.map((s) => s.setNumber)) / 100) + 1;
  await db.workoutSet.createMany({
    data: [0, 1, 2].map((i) => ({ workoutId, exerciseId, setNumber: nextOrder * 100 + i })),
  });
  redirect(`/workout/${workoutId}`);
}

export async function finishWorkout(workoutId: string) {
  const user = await requireUser();
  const workout = await db.workout.findFirst({ where: { id: workoutId, userId: user.id } });
  if (!workout) redirect("/today");
  // Drop sets that were never ticked off so history stays clean.
  await db.workoutSet.deleteMany({ where: { workoutId, done: false } });
  await db.workout.update({ where: { id: workoutId }, data: { completedAt: new Date() } });
  revalidatePath("/", "layout");
  redirect(`/progress/workout/${workoutId}?done=1`);
}

export async function discardWorkout(workoutId: string) {
  const user = await requireUser();
  await db.workout.deleteMany({ where: { id: workoutId, userId: user.id } });
  redirect("/today");
}

export async function deleteWorkout(workoutId: string) {
  const user = await requireUser();
  await db.workout.deleteMany({ where: { id: workoutId, userId: user.id } });
  redirect("/progress");
}
