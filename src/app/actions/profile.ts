"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { type EquipmentAccess, type Experience, type Goal, type Limitation } from "@/lib/planner";
import { createPlan, getActivePlanRecord } from "@/lib/plans";

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

  const limitations = form.getAll("limitations").filter((l): l is Limitation => ["knees", "lower_back", "shoulders"].includes(String(l)));
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
    limitations: limitations.join(","),
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
  const planKeys = ["goal", "experience", "daysPerWeek", "sessionMin", "equipment", "limitations"] as const;
  const planChanged = isNew || planKeys.some((k) => String(user.profile?.[k]) !== String(data[k]));
  if (planChanged || form.get("regenerate")) {
    // Keep the split the user chose, if it still fits their number of days.
    const current = await getActivePlanRecord(user.id);
    await createPlan(user.id, data, { splitId: current?.plan.splitId });
  }

  redirect(isNew ? "/plan?welcome=1" : "/today");
}

export async function deleteAccount() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  await db.user.delete({ where: { id: user.id } });
  redirect("/");
}
