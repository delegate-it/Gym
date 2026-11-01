import "server-only";
import { db } from "./db";
import { generatePlan, parsePlan, type EquipmentAccess, type Experience, type Goal, type Limitation, type PlannerInput, type SplitId, type TrainingPlan } from "./planner";

type ProfileFields = { goal: string; experience: string; daysPerWeek: number; sessionMin: number; equipment: string; limitations: string };

export function plannerInput(p: ProfileFields): PlannerInput {
  return {
    goal: p.goal as Goal,
    experience: p.experience as Experience,
    daysPerWeek: p.daysPerWeek,
    sessionMin: p.sessionMin,
    equipment: p.equipment as EquipmentAccess,
    limitations: p.limitations.split(",").filter(Boolean) as Limitation[],
  };
}

/** Builds a new plan and makes it the active one. Older plans (and their workouts) are kept. */
export async function createPlan(userId: string, profile: ProfileFields, options: { splitId?: SplitId; variant?: number } = {}) {
  const plan = generatePlan({ ...plannerInput(profile), ...options });
  await db.$transaction([
    db.plan.updateMany({ where: { userId, active: true }, data: { active: false } }),
    db.plan.create({ data: { userId, name: plan.name, data: JSON.stringify(plan) } }),
  ]);
  return plan;
}

export async function getActivePlanRecord(userId: string) {
  const record = await db.plan.findFirst({ where: { userId, active: true }, orderBy: { createdAt: "desc" } });
  return record ? { id: record.id, plan: parsePlan(record.data) } : null;
}

export async function savePlan(id: string, plan: TrainingPlan) {
  await db.plan.update({ where: { id }, data: { data: JSON.stringify({ ...plan, edited: true }) } });
}
