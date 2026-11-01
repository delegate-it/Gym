"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseLimitations } from "@/lib/injuries";
import { analyzeInjury, ANALYSIS_VERSION, MAX_DESCRIPTION, parseInjuryInfo } from "@/lib/injury-analysis";
import { adaptPlanToInjuries, type EquipmentAccess, type Experience, type Goal } from "@/lib/planner";
import { createPlan, getActivePlanRecord, plannerInput, savePlan } from "@/lib/plans";

const pickOne = <T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const num = (value: FormDataEntryValue | null, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

export type ProfileState = { error?: string };

export async function saveProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const age = num(form.get("age"), 13, 100);
  const heightCm = num(form.get("heightCm"), 120, 230);
  const weightKg = num(form.get("weightKg"), 30, 300);
  if (!age || !heightCm || !weightKg) return { error: "Please check your age, height and weight." };

  const injuries = await resolveInjuries(form, user.profile, await planExerciseIds(user.id));
  const data = {
    name: String(form.get("name") || "").trim().slice(0, 60) || null,
    sex: pickOne(form.get("sex"), ["male", "female"] as const, "male"),
    age: Math.round(age),
    heightCm,
    weightKg,
    goal: pickOne<Goal>(form.get("goal"), ["muscle", "strength", "fat_loss", "fitness"], "fitness"),
    experience: pickOne<Experience>(form.get("experience"), ["beginner", "intermediate", "advanced"], "beginner"),
    daysPerWeek: num(form.get("daysPerWeek"), 2, 6) ?? 3,
    sessionMin: num(form.get("sessionMin"), 20, 120) ?? 60,
    equipment: pickOne<EquipmentAccess>(form.get("equipment"), ["gym", "dumbbells", "bodyweight"], "gym"),
    ...injuries,
    activity: pickOne(form.get("activity"), ["sedentary", "light", "active", "very_active"] as const, "light"),
    diet: pickOne(form.get("diet"), ["none", "vegetarian", "vegan"] as const, "none"),
    mealsPerDay: num(form.get("mealsPerDay"), 2, 6) ?? 3,
    units: pickOne(form.get("units"), ["kg", "lb"] as const, "kg"),
  };

  const isNew = !user.profile;
  const weightChanged = user.profile?.weightKg !== weightKg;
  await db.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  if (weightChanged) await db.bodyWeight.create({ data: { userId: user.id, weightKg } });

  // Only rebuild the plan when something that affects training changed.
  const planKeys = ["goal", "experience", "daysPerWeek", "sessionMin", "equipment", "limitations", "injuryAvoid"] as const;
  const changed = planKeys.filter((k) => String(user.profile?.[k]) !== String(data[k]));
  if (!isNew && changed.length && changed.every((k) => k === "limitations" || k === "injuryAvoid")) {
    // Only injuries changed: adapt the current plan instead of rebuilding it.
    await applyInjuries(user.id, data);
  } else if (isNew || changed.length || form.get("regenerate")) {
    // Keep the split the user chose, if it still fits their number of days.
    const current = await getActivePlanRecord(user.id);
    await createPlan(user.id, data, { splitId: current?.plan.splitId });
  }

  redirect(isNew ? "/plan?welcome=1" : "/today");
}

/**
 * Injury fields from a form: the ticked areas plus, if the user described the injury, the areas
 * and exercises the description rules out. A description can only add restrictions. An unchanged
 * description reuses the stored analysis instead of analysing it again.
 */
async function resolveInjuries(form: FormData, previous: { injuryNotes: string; injuryAvoid: string; injuryInfo: string } | null | undefined, planIds: string[]) {
  const ticked = parseLimitations(form.getAll("limitations").map(String));
  const notes = String(form.get("injuryNotes") ?? "").trim().slice(0, MAX_DESCRIPTION);
  if (!notes) return { limitations: ticked.join(","), injuryNotes: "", injuryAvoid: "", injuryInfo: "" };

  const stored = previous?.injuryNotes === notes ? parseInjuryInfo(previous.injuryInfo) : null;
  if (stored && stored.version >= ANALYSIS_VERSION) {
    return { limitations: [...new Set([...ticked, ...stored.areas])].join(","), injuryNotes: notes, injuryAvoid: previous!.injuryAvoid, injuryInfo: previous!.injuryInfo };
  }
  const { avoidIds, ...info } = await analyzeInjury(notes, planIds);
  return {
    limitations: [...new Set([...ticked, ...info.areas])].join(","),
    injuryNotes: notes,
    injuryAvoid: avoidIds.join(","),
    injuryInfo: JSON.stringify(info),
  };
}

/** Every exercise in the user's active plan, so an injury description is checked against all of them. */
async function planExerciseIds(userId: string) {
  const current = await getActivePlanRecord(userId);
  return current ? [...new Set(current.plan.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)))] : [];
}

/** Swaps out exercises in the active plan that load an injured area. */
async function applyInjuries(userId: string, profile: Parameters<typeof plannerInput>[0]) {
  const current = await getActivePlanRecord(userId);
  if (!current) return;
  const { plan, changes } = adaptPlanToInjuries(current.plan, plannerInput(profile));
  await savePlan(current.id, { ...plan, injuryChanges: changes }, { byUser: false });
}

/** Saves the user's injured areas and adapts their plan to them. */
export async function updateInjuries(form: FormData) {
  const user = await requireUser();
  const injuries = await resolveInjuries(form, user.profile, await planExerciseIds(user.id));
  await db.profile.update({ where: { userId: user.id }, data: injuries });
  await applyInjuries(user.id, { ...user.profile, ...injuries });
  revalidatePath("/plan");
  revalidatePath("/today");
  redirect("/plan?injuries=1");
}

export async function deleteAccount() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  await db.user.delete({ where: { id: user.id } });
  redirect("/");
}
