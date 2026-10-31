import "server-only";
import { db } from "./db";
import { parsePlan } from "./planner";

export async function getActivePlan(userId: string) {
  const plan = await db.plan.findFirst({ where: { userId, active: true }, orderBy: { createdAt: "desc" } });
  return plan ? { id: plan.id, createdAt: plan.createdAt, ...parsePlan(plan.data) } : null;
}

/** The next day to train: the one after the last completed workout of this plan. */
export async function getNextDayIndex(userId: string, planId: string, dayCount: number) {
  const last = await db.workout.findFirst({
    where: { userId, planId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
  });
  return last?.dayIndex == null ? 0 : (last.dayIndex + 1) % dayCount;
}

/** Most recent completed sets for each exercise, e.g. to show "last time". */
export async function getLastSets(userId: string, exerciseIds: string[]) {
  const sets = await db.workoutSet.findMany({
    where: { exerciseId: { in: exerciseIds }, done: true, workout: { userId, completedAt: { not: null } } },
    orderBy: [{ workout: { completedAt: "desc" } }, { setNumber: "asc" }],
    include: { workout: { select: { id: true } } },
    take: 400,
  });
  const result = new Map<string, { weight: number | null; reps: number | null }[]>();
  const workoutFor = new Map<string, string>();
  for (const s of sets) {
    const wid = workoutFor.get(s.exerciseId) ?? s.workout.id;
    workoutFor.set(s.exerciseId, wid);
    if (s.workout.id !== wid) continue;
    result.set(s.exerciseId, [...(result.get(s.exerciseId) ?? []), { weight: s.weight, reps: s.reps }]);
  }
  return result;
}

export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
