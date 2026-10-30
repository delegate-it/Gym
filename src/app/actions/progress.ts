"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fromDisplay, type Units } from "@/lib/units";

export async function logBodyWeight(form: FormData) {
  const user = await requireUser();
  const value = Number(String(form.get("weight") || "").replace(",", "."));
  const kg = fromDisplay(value, user.profile.units as Units);
  if (!Number.isFinite(kg) || kg < 30 || kg > 300) return;
  await db.$transaction([
    db.bodyWeight.create({ data: { userId: user.id, weightKg: kg } }),
    db.profile.update({ where: { userId: user.id }, data: { weightKg: kg } }),
  ]);
  revalidatePath("/progress");
}

export async function deleteBodyWeight(id: string) {
  const user = await requireUser();
  await db.bodyWeight.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/progress");
}
