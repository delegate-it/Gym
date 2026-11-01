"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getExercise } from "@/lib/exercises";
import { addedPrescription, shuffleDay, splitOptions, swapPrescription, type Goal, type Experience, type SplitId } from "@/lib/planner";
import { createPlan, getActivePlanRecord, plannerInput, savePlan } from "@/lib/plans";

/** Loads the user's active plan and the exercise at [day][index], or redirects if it doesn't exist. */
async function loadForEdit(dayIdx: number, exIdx?: number) {
  const user = await requireUser();
  const record = await getActivePlanRecord(user.id);
  const day = record?.plan.days[dayIdx];
  if (!record || !day || (exIdx !== undefined && !day.exercises[exIdx])) redirect("/plan");
  return { user, record, day };
}

function done(dayIdx: number): never {
  revalidatePath("/plan");
  revalidatePath("/today");
  redirect(`/plan#day-${dayIdx}`);
}

export async function swapPlanExercise(dayIdx: number, exIdx: number, newExerciseId: string) {
  const { user, record, day } = await loadForEdit(dayIdx, exIdx);
  if (!getExercise(newExerciseId)) redirect("/plan");
  day.exercises[exIdx] = swapPrescription(day.exercises[exIdx], newExerciseId, user.profile.goal as Goal);
  await savePlan(record.id, record.plan);
  done(dayIdx);
}

export async function updatePlanExercise(dayIdx: number, exIdx: number, form: FormData) {
  const { record, day } = await loadForEdit(dayIdx, exIdx);
  const sets = Math.round(Number(form.get("sets")));
  const restSec = Math.round(Number(form.get("restSec")));
  const reps = String(form.get("reps") || "").trim().slice(0, 12);
  const ex = day.exercises[exIdx];
  if (sets >= 1 && sets <= 10) ex.sets = sets;
  if (restSec >= 0 && restSec <= 600) ex.restSec = restSec;
  if (/^[\d\s\-–a-z]+$/i.test(reps)) ex.reps = reps;
  await savePlan(record.id, record.plan);
  done(dayIdx);
}

export async function removePlanExercise(dayIdx: number, exIdx: number) {
  const { record, day } = await loadForEdit(dayIdx, exIdx);
  day.exercises.splice(exIdx, 1);
  await savePlan(record.id, record.plan);
  done(dayIdx);
}

export async function movePlanExercise(dayIdx: number, exIdx: number, direction: -1 | 1) {
  const { record, day } = await loadForEdit(dayIdx, exIdx);
  const to = exIdx + direction;
  if (to < 0 || to >= day.exercises.length) done(dayIdx);
  [day.exercises[exIdx], day.exercises[to]] = [day.exercises[to], day.exercises[exIdx]];
  await savePlan(record.id, record.plan);
  done(dayIdx);
}

export async function addPlanExercise(dayIdx: number, exerciseId: string) {
  const { user, record, day } = await loadForEdit(dayIdx);
  if (!getExercise(exerciseId)) redirect("/plan");
  if (day.exercises.length >= 15) done(dayIdx);
  day.exercises.push(addedPrescription(exerciseId, user.profile.goal as Goal, user.profile.experience as Experience));
  await savePlan(record.id, record.plan);
  done(dayIdx);
}

/** Replaces every exercise in a day with a similar one (same muscles, sets and rest). */
export async function shufflePlanDay(dayIdx: number, returnTo: "plan" | "today") {
  const { user, record, day } = await loadForEdit(dayIdx);
  record.plan.days[dayIdx] = shuffleDay(day, plannerInput(user.profile));
  await savePlan(record.id, record.plan);
  revalidatePath("/plan");
  revalidatePath("/today");
  redirect(returnTo === "today" ? "/today?shuffled=1" : `/plan?shuffled=${dayIdx}#day-${dayIdx}`);
}

/** Builds a new plan: "fresh" keeps the split and changes the exercise selection; a split id switches split. */
export async function rebuildPlan(choice: "fresh" | SplitId) {
  const user = await requireUser();
  const current = await getActivePlanRecord(user.id);
  if (choice === "fresh") {
    await createPlan(user.id, user.profile, { splitId: current?.plan.splitId, variant: (current?.plan.variant ?? 0) + 1 });
  } else {
    if (!splitOptions(user.profile.daysPerWeek).some((s) => s.id === choice)) redirect("/plan/change");
    await createPlan(user.id, user.profile, { splitId: choice });
  }
  revalidatePath("/today");
  redirect("/plan?rebuilt=1");
}
