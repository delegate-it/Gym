import "server-only";
import { db } from "./db";
import { ANALYSIS_VERSION, parseInjuryInfo } from "./injury-analysis";
import type { Exercise } from "./exercises";
import { injuryConflicts, injuryLabel } from "./injuries";
import { generatePlan, injuryBlocked, parsePlan, type EquipmentAccess, type Experience, type Goal, type Limitation, type PlannerInput, type SplitId, type TrainingPlan } from "./planner";

type ProfileFields = { goal: string; experience: string; daysPerWeek: number; sessionMin: number; equipment: string; limitations: string; injuryAvoid?: string; injuryInfo?: string; injuryNotes?: string };

/** True when Claude has reviewed every exercise for the user's described injury (current analysis version). */
function aiReviewed(p: ProfileFields) {
  if (!p.injuryNotes || !p.injuryInfo) return false;
  const info = parseInjuryInfo(p.injuryInfo);
  return info?.source === "ai" && info.version >= ANALYSIS_VERSION;
}

export function plannerInput(p: ProfileFields): PlannerInput {
  return {
    goal: p.goal as Goal,
    experience: p.experience as Experience,
    daysPerWeek: p.daysPerWeek,
    sessionMin: p.sessionMin,
    equipment: p.equipment as EquipmentAccess,
    limitations: p.limitations.split(",").filter(Boolean) as Limitation[],
    avoidIds: (p.injuryAvoid ?? "").split(",").filter(Boolean),
    aiReviewed: aiReviewed(p),
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

/** Saves changes to a plan; hand edits mark it as customised, automatic adjustments don't. */
export async function savePlan(id: string, plan: TrainingPlan, { byUser = true } = {}) {
  await db.plan.update({ where: { id }, data: { data: JSON.stringify({ ...plan, edited: plan.edited || byUser }) } });
}

/** Why an exercise is risky for the user's injuries, or null when it's fine. */
export function injuryWarning(ex: Pick<Exercise, "id" | "name" | "primary">, profile: ProfileFields) {
  const input = plannerInput(profile);
  if (!injuryBlocked(ex.id, input)) return null;
  const reason = profile.injuryInfo ? parseInjuryInfo(profile.injuryInfo)?.avoidReasons[ex.id] : undefined;
  if (reason) return `Based on your injury: ${reason}`;
  const areas = injuryConflicts(ex, input.limitations);
  return areas.length
    ? `This exercise can load your ${areas.map((l) => injuryLabel(l).toLowerCase()).join(" and ")}. Consider a safer alternative, or keep it light and stop if it hurts.`
    : "Based on the injury you described, this exercise is best avoided for now.";
}
