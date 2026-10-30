import { getExercise } from "./exercises";

export type Goal = "muscle" | "strength" | "fat_loss" | "fitness";
export type Experience = "beginner" | "intermediate" | "advanced";
export type EquipmentAccess = "gym" | "dumbbells" | "bodyweight";
export type Limitation = "knees" | "lower_back" | "shoulders";

export type PlannerInput = {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  sessionMin: number;
  equipment: EquipmentAccess;
  limitations: Limitation[];
};

export type PlanExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  restSec: number;
  note?: string;
};

export type PlanDay = {
  name: string;
  focus: string;
  weekday: string;
  exercises: PlanExercise[];
  cardio?: string;
};

export type TrainingPlan = {
  name: string;
  basedOn: string;
  summary: string;
  days: PlanDay[];
  progression: string[];
  warmup: string;
};

/* ------------------------------------------------------------------ */
/* Movement patterns. Each lists exercise options from best to safest. */
/* `eq` is the minimum equipment needed; `avoid` lists joint issues.    */
/* ------------------------------------------------------------------ */

type Option = { id: string; eq: EquipmentAccess; avoid?: Limitation[] };
type Pattern =
  | "squat" | "squat_alt" | "lunge" | "hinge" | "hinge_alt" | "glutes" | "leg_curl" | "leg_ext" | "calves"
  | "h_push" | "incline_push" | "v_push" | "h_pull" | "v_pull" | "chest_fly" | "lateral" | "rear_delt"
  | "biceps" | "biceps_alt" | "triceps" | "triceps_alt" | "core" | "core_alt";

const PATTERNS: Record<Pattern, Option[]> = {
  squat: [
    { id: "Barbell_Squat", eq: "gym", avoid: ["knees", "lower_back"] },
    { id: "Leg_Press", eq: "gym", avoid: ["knees"] },
    { id: "Goblet_Squat", eq: "dumbbells", avoid: ["knees"] },
    { id: "Bodyweight_Squat", eq: "bodyweight", avoid: ["knees"] },
    { id: "Barbell_Glute_Bridge", eq: "gym" },
    { id: "Butt_Lift_Bridge", eq: "bodyweight" },
  ],
  squat_alt: [
    { id: "Leg_Press", eq: "gym", avoid: ["knees"] },
    { id: "Front_Squat_Clean_Grip", eq: "gym", avoid: ["knees", "lower_back"] },
    { id: "Goblet_Squat", eq: "dumbbells", avoid: ["knees"] },
    { id: "Bodyweight_Squat", eq: "bodyweight", avoid: ["knees"] },
    { id: "Butt_Lift_Bridge", eq: "bodyweight" },
  ],
  lunge: [
    { id: "Split_Squat_with_Dumbbells", eq: "dumbbells", avoid: ["knees"] },
    { id: "Dumbbell_Lunges", eq: "dumbbells", avoid: ["knees"] },
    { id: "Split_Squats", eq: "bodyweight", avoid: ["knees"] },
    { id: "Single_Leg_Glute_Bridge", eq: "bodyweight" },
  ],
  hinge: [
    { id: "Barbell_Deadlift", eq: "gym", avoid: ["lower_back"] },
    { id: "Stiff-Legged_Dumbbell_Deadlift", eq: "dumbbells", avoid: ["lower_back"] },
    { id: "Barbell_Hip_Thrust", eq: "gym" },
    { id: "Single_Leg_Glute_Bridge", eq: "bodyweight" },
  ],
  hinge_alt: [
    { id: "Romanian_Deadlift", eq: "gym", avoid: ["lower_back"] },
    { id: "Stiff-Legged_Dumbbell_Deadlift", eq: "dumbbells", avoid: ["lower_back"] },
    { id: "Barbell_Hip_Thrust", eq: "gym" },
    { id: "Single_Leg_Glute_Bridge", eq: "bodyweight" },
  ],
  glutes: [
    { id: "Barbell_Hip_Thrust", eq: "gym" },
    { id: "Single_Leg_Glute_Bridge", eq: "bodyweight" },
  ],
  leg_curl: [
    { id: "Lying_Leg_Curls", eq: "gym" },
    { id: "Stiff-Legged_Dumbbell_Deadlift", eq: "dumbbells", avoid: ["lower_back"] },
    { id: "Single_Leg_Glute_Bridge", eq: "bodyweight" },
  ],
  leg_ext: [
    { id: "Leg_Extensions", eq: "gym", avoid: ["knees"] },
    { id: "Dumbbell_Step_Ups", eq: "dumbbells", avoid: ["knees"] },
    { id: "Split_Squats", eq: "bodyweight", avoid: ["knees"] },
  ],
  calves: [
    { id: "Standing_Calf_Raises", eq: "gym" },
    { id: "Calf_Raise_On_A_Dumbbell", eq: "dumbbells" },
    { id: "Standing_Dumbbell_Calf_Raise", eq: "dumbbells" },
  ],
  h_push: [
    { id: "Barbell_Bench_Press_-_Medium_Grip", eq: "gym", avoid: ["shoulders"] },
    { id: "Dumbbell_Bench_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Pushups", eq: "bodyweight", avoid: ["shoulders"] },
    { id: "Dumbbell_Floor_Press", eq: "dumbbells" },
    { id: "Incline_Push-Up", eq: "bodyweight" },
  ],
  incline_push: [
    { id: "Incline_Dumbbell_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Decline_Push-Up", eq: "bodyweight", avoid: ["shoulders"] },
    { id: "Machine_Bench_Press", eq: "gym" },
    { id: "Incline_Push-Up", eq: "bodyweight" },
  ],
  v_push: [
    { id: "Standing_Military_Press", eq: "gym", avoid: ["shoulders", "lower_back"] },
    { id: "Seated_Dumbbell_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Decline_Push-Up", eq: "bodyweight", avoid: ["shoulders"] },
    { id: "Side_Lateral_Raise", eq: "dumbbells" },
    { id: "Incline_Push-Up", eq: "bodyweight" },
  ],
  h_pull: [
    { id: "Bent_Over_Barbell_Row", eq: "gym", avoid: ["lower_back"] },
    { id: "Seated_Cable_Rows", eq: "gym" },
    { id: "One-Arm_Dumbbell_Row", eq: "dumbbells" },
    { id: "Inverted_Row", eq: "bodyweight" },
  ],
  v_pull: [
    { id: "Pullups", eq: "gym" },
    { id: "Wide-Grip_Lat_Pulldown", eq: "gym" },
    { id: "Bent_Over_Two-Dumbbell_Row", eq: "dumbbells", avoid: ["lower_back"] },
    { id: "Dumbbell_Incline_Row", eq: "dumbbells" },
    { id: "Inverted_Row", eq: "bodyweight" },
  ],
  chest_fly: [
    { id: "Cable_Crossover", eq: "gym", avoid: ["shoulders"] },
    { id: "Dumbbell_Flyes", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Butterfly", eq: "gym" },
    { id: "Push-Up_Wide", eq: "bodyweight", avoid: ["shoulders"] },
  ],
  lateral: [
    { id: "Side_Lateral_Raise", eq: "dumbbells" },
  ],
  rear_delt: [
    { id: "Face_Pull", eq: "gym" },
    { id: "Reverse_Flyes", eq: "dumbbells" },
    { id: "Superman", eq: "bodyweight" },
  ],
  biceps: [
    { id: "Barbell_Curl", eq: "gym" },
    { id: "Dumbbell_Bicep_Curl", eq: "dumbbells" },
    { id: "Chin-Up", eq: "bodyweight" },
  ],
  biceps_alt: [
    { id: "Hammer_Curls", eq: "dumbbells" },
    { id: "Incline_Dumbbell_Curl", eq: "dumbbells" },
  ],
  triceps: [
    { id: "Triceps_Pushdown", eq: "gym" },
    { id: "Standing_Dumbbell_Triceps_Extension", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Tricep_Dumbbell_Kickback", eq: "dumbbells" },
    { id: "Bench_Dips", eq: "bodyweight", avoid: ["shoulders"] },
    { id: "Push-Ups_-_Close_Triceps_Position", eq: "bodyweight" },
  ],
  triceps_alt: [
    { id: "Cable_Rope_Overhead_Triceps_Extension", eq: "gym", avoid: ["shoulders"] },
    { id: "Tricep_Dumbbell_Kickback", eq: "dumbbells" },
    { id: "Push-Ups_-_Close_Triceps_Position", eq: "bodyweight" },
  ],
  core: [
    { id: "Cable_Crunch", eq: "gym", avoid: ["lower_back"] },
    { id: "Plank", eq: "bodyweight" },
  ],
  core_alt: [
    { id: "Dead_Bug", eq: "bodyweight" },
    { id: "Side_Bridge", eq: "bodyweight" },
  ],
};

const EQ_RANK: Record<EquipmentAccess, number> = { bodyweight: 0, dumbbells: 1, gym: 2 };

function pick(pattern: Pattern, role: Role, input: PlannerInput, usedToday: Set<string>, usedInPlan: Set<string>): string | null {
  const allowed = PATTERNS[pattern].filter((o) => EQ_RANK[o.eq] <= EQ_RANK[input.equipment]);
  const safe = allowed.filter((o) => !o.avoid?.some((l) => input.limitations.includes(l)));
  // Main lifts stay the best option; other slots prefer variety across the week.
  // Never repeat an exercise within the same workout.
  const fresh = safe.filter((o) => !usedToday.has(o.id));
  // Variety only among options for the same equipment, so a gym user isn't given a home substitute.
  const top = fresh[0];
  const choice = top && (role === "main" ? top : fresh.find((o) => o.eq === top.eq && !usedInPlan.has(o.id)) ?? top);
  return choice && getExercise(choice.id) ? choice.id : null;
}

/* ------------------------------------------------------------------ */
/* Splits, based on well-established programs.                         */
/* ------------------------------------------------------------------ */

type Role = "main" | "secondary" | "accessory";
type Slot = [Pattern, Role];
type DayTemplate = { name: string; focus: string; slots: Slot[] };
type Split = { name: string; basedOn: string; days: DayTemplate[] };

const FULL_A: DayTemplate = {
  name: "Full Body A", focus: "Squat · Bench · Row",
  slots: [["squat", "main"], ["h_push", "main"], ["h_pull", "secondary"], ["hinge_alt", "accessory"], ["lateral", "accessory"], ["core", "accessory"], ["biceps", "accessory"]],
};
const FULL_B: DayTemplate = {
  name: "Full Body B", focus: "Deadlift · Press · Pull-up",
  slots: [["hinge", "main"], ["v_push", "main"], ["v_pull", "secondary"], ["lunge", "accessory"], ["triceps", "accessory"], ["core_alt", "accessory"], ["calves", "accessory"]],
};
const FULL_C: DayTemplate = {
  name: "Full Body C", focus: "Legs · Incline · Row",
  slots: [["squat_alt", "main"], ["incline_push", "main"], ["h_pull", "secondary"], ["leg_curl", "accessory"], ["rear_delt", "accessory"], ["biceps_alt", "accessory"], ["core", "accessory"]],
};

const UPPER_STRENGTH: DayTemplate = {
  name: "Upper (Strength)", focus: "Chest · Back · Shoulders",
  slots: [["h_push", "main"], ["h_pull", "main"], ["v_push", "secondary"], ["v_pull", "secondary"], ["biceps", "accessory"], ["triceps", "accessory"], ["rear_delt", "accessory"]],
};
const LOWER_STRENGTH: DayTemplate = {
  name: "Lower (Strength)", focus: "Squat · Deadlift",
  slots: [["squat", "main"], ["hinge", "main"], ["lunge", "secondary"], ["leg_curl", "accessory"], ["calves", "accessory"], ["core", "accessory"]],
};
const UPPER_VOLUME: DayTemplate = {
  name: "Upper (Volume)", focus: "Chest · Back · Arms",
  slots: [["incline_push", "secondary"], ["v_pull", "secondary"], ["h_pull", "secondary"], ["chest_fly", "accessory"], ["lateral", "accessory"], ["biceps_alt", "accessory"], ["triceps_alt", "accessory"]],
};
const LOWER_VOLUME: DayTemplate = {
  name: "Lower (Volume)", focus: "Legs · Glutes",
  slots: [["squat_alt", "secondary"], ["hinge_alt", "secondary"], ["leg_ext", "accessory"], ["leg_curl", "accessory"], ["glutes", "accessory"], ["calves", "accessory"], ["core_alt", "accessory"]],
};

const PUSH_A: DayTemplate = {
  name: "Push", focus: "Chest · Shoulders · Triceps",
  slots: [["h_push", "main"], ["v_push", "secondary"], ["incline_push", "secondary"], ["lateral", "accessory"], ["triceps", "accessory"], ["chest_fly", "accessory"], ["triceps_alt", "accessory"]],
};
const PULL_A: DayTemplate = {
  name: "Pull", focus: "Back · Biceps",
  slots: [["hinge", "main"], ["v_pull", "secondary"], ["h_pull", "secondary"], ["rear_delt", "accessory"], ["biceps", "accessory"], ["biceps_alt", "accessory"]],
};
const LEGS_A: DayTemplate = {
  name: "Legs", focus: "Quads · Hamstrings · Glutes",
  slots: [["squat", "main"], ["hinge_alt", "secondary"], ["squat_alt", "secondary"], ["leg_curl", "accessory"], ["leg_ext", "accessory"], ["calves", "accessory"], ["core", "accessory"]],
};
const PUSH_B: DayTemplate = {
  name: "Push B", focus: "Shoulders · Chest · Triceps",
  slots: [["v_push", "main"], ["incline_push", "secondary"], ["h_push", "secondary"], ["lateral", "accessory"], ["chest_fly", "accessory"], ["triceps_alt", "accessory"]],
};
const PULL_B: DayTemplate = {
  name: "Pull B", focus: "Back · Rear delts · Biceps",
  slots: [["h_pull", "main"], ["v_pull", "secondary"], ["hinge_alt", "secondary"], ["rear_delt", "accessory"], ["biceps_alt", "accessory"], ["biceps", "accessory"]],
};
const LEGS_B: DayTemplate = {
  name: "Legs B", focus: "Hamstrings · Glutes · Quads",
  slots: [["hinge_alt", "main"], ["squat_alt", "secondary"], ["lunge", "secondary"], ["glutes", "accessory"], ["leg_curl", "accessory"], ["calves", "accessory"], ["core_alt", "accessory"]],
};

function chooseSplit(days: number): Split {
  if (days <= 2) {
    return { name: "Full Body (2 days)", basedOn: "Starting Strength / StrongLifts-style A/B full-body training", days: [FULL_A, FULL_B] };
  }
  if (days === 3) {
    return { name: "Full Body (3 days)", basedOn: "Classic 3-day full-body programs (StrongLifts 5×5, GZCLP)", days: [FULL_A, FULL_B, FULL_C] };
  }
  if (days === 4) {
    return { name: "Upper / Lower", basedOn: "PHUL — Power Hypertrophy Upper Lower", days: [UPPER_STRENGTH, LOWER_STRENGTH, UPPER_VOLUME, LOWER_VOLUME] };
  }
  if (days === 5) {
    return {
      name: "Upper / Lower + Push / Pull / Legs",
      basedOn: "PHAT-style hybrid: strength upper/lower days plus a PPL volume block",
      days: [UPPER_STRENGTH, LOWER_STRENGTH, { ...PUSH_A, slots: PUSH_A.slots.map(([p]) => [p, "secondary"] as Slot) }, { ...PULL_B, name: "Pull" }, { ...LEGS_B, name: "Legs" }],
    };
  }
  return { name: "Push / Pull / Legs ×2", basedOn: "The popular 6-day Push/Pull/Legs (Reddit PPL) program", days: [PUSH_A, PULL_A, LEGS_A, PUSH_B, PULL_B, LEGS_B] };
}

const WEEKDAYS: Record<number, string[]> = {
  2: ["Mon", "Thu"],
  3: ["Mon", "Wed", "Fri"],
  4: ["Mon", "Tue", "Thu", "Fri"],
  5: ["Mon", "Tue", "Wed", "Fri", "Sat"],
  6: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

/* ------------------------------------------------------------------ */
/* Sets, reps and rest by goal.                                        */
/* ------------------------------------------------------------------ */

type Scheme = { sets: number; reps: string; restSec: number };

const SCHEMES: Record<Goal, Record<Role, Scheme>> = {
  strength: {
    main: { sets: 5, reps: "5", restSec: 180 },
    secondary: { sets: 3, reps: "6-8", restSec: 120 },
    accessory: { sets: 3, reps: "8-12", restSec: 90 },
  },
  muscle: {
    main: { sets: 4, reps: "6-8", restSec: 120 },
    secondary: { sets: 3, reps: "8-12", restSec: 90 },
    accessory: { sets: 3, reps: "10-15", restSec: 60 },
  },
  fat_loss: {
    main: { sets: 3, reps: "8-10", restSec: 90 },
    secondary: { sets: 3, reps: "10-12", restSec: 60 },
    accessory: { sets: 3, reps: "12-15", restSec: 45 },
  },
  fitness: {
    main: { sets: 3, reps: "8-12", restSec: 90 },
    secondary: { sets: 3, reps: "10-12", restSec: 60 },
    accessory: { sets: 2, reps: "12-15", restSec: 60 },
  },
};

const TIMED = new Set(["Plank", "Side_Bridge"]);
const PULL_UPS = new Set(["Pullups", "Chin-Up", "Inverted_Row"]);

function repsFor(id: string, reps: string, goal: Goal) {
  if (TIMED.has(id)) return "30-45 s";
  if (PULL_UPS.has(id)) return goal === "strength" ? "5-8" : "6-12";
  // Unloaded bodyweight moves need more reps to be challenging.
  const eq = getExercise(id)?.equipment;
  if ((eq === "body only" || eq === "none") && goal !== "strength") return "12-20";
  return reps;
}

function scheme(goal: Goal, role: Role, experience: Experience): Scheme {
  const s = { ...SCHEMES[goal][role] };
  if (experience === "beginner" && role === "main" && goal === "strength") s.sets = 3; // 3×5 like Starting Strength
  if (experience === "beginner" && role !== "accessory" && goal !== "strength") s.sets = Math.min(s.sets, 3);
  if (experience === "advanced" && role !== "accessory") s.sets += 1;
  return s;
}

/** Rough time cost of one exercise, including warm-up sets and rest. */
function minutesFor(s: Scheme) {
  return (s.sets * (35 + s.restSec)) / 60 + 1;
}

const CARDIO: Record<Goal, string | undefined> = {
  fat_loss: "Finish with 10–20 min of intervals: 30 s hard / 60 s easy (bike, rower, brisk incline walk or skipping).",
  fitness: "Finish with 10–20 min of steady cardio at a pace where you can still talk.",
  muscle: undefined,
  strength: undefined,
};

/* ------------------------------------------------------------------ */

export function generatePlan(input: PlannerInput): TrainingPlan {
  const days = Math.min(6, Math.max(2, input.daysPerWeek));
  const split = chooseSplit(days);
  const cardio = CARDIO[input.goal];
  const cardioMin = cardio ? (input.sessionMin <= 45 ? 10 : 15) : 0;
  const budget = input.sessionMin - 7 - cardioMin; // minus warm-up and cardio

  const usedInPlan = new Set<string>();
  const planDays: PlanDay[] = split.days.map((tpl, i) => {
    const used = new Set<string>();
    const exercises: PlanExercise[] = [];
    let minutes = 0;

    for (const [pattern, role] of tpl.slots) {
      const id = pick(pattern, role, input, used, usedInPlan);
      if (!id) continue;
      const s = scheme(input.goal, role, input.experience);
      const cost = minutesFor(s);
      // Always keep at least 4 exercises, then stop when the session is full.
      if (exercises.length >= 4 && minutes + cost > budget) break;
      used.add(id);
      usedInPlan.add(id);
      minutes += cost;
      exercises.push({
        exerciseId: id,
        sets: s.sets,
        reps: repsFor(id, s.reps, input.goal),
        restSec: s.restSec,
        note: role === "main" ? "Main lift — add weight when you hit all reps." : undefined,
      });
    }

    return { name: tpl.name, focus: tpl.focus, weekday: WEEKDAYS[days][i], exercises, cardio };
  });

  const goalText: Record<Goal, string> = {
    muscle: "build muscle",
    strength: "get stronger",
    fat_loss: "lose fat while keeping muscle",
    fitness: "improve overall fitness",
  };

  return {
    name: split.name,
    basedOn: split.basedOn,
    summary: `${days} days per week, about ${input.sessionMin} minutes per session, designed to ${goalText[input.goal]}.`,
    days: planDays,
    warmup: "5 minutes of easy cardio, then 1–2 light warm-up sets of your first exercise.",
    progression: progressionRules(input),
  };
}

function progressionRules(input: PlannerInput): string[] {
  const rules = [
    "Double progression: once you hit the top of the rep range on every set, add weight next session (about 2.5 kg upper body, 5 kg lower body) and start again at the bottom of the range.",
    "Leave 1–2 reps in the tank on most sets. Form first — stop a set when technique breaks down.",
  ];
  if (input.goal === "strength") rules[0] = "Main lifts: if you complete every set of 5, add 2.5 kg (upper) or 5 kg (lower) next time. Fail twice at the same weight? Drop 10% and build back up.";
  if (input.experience === "beginner") rules.push("You're new: the first 2 weeks are about learning the movements. Start light and add weight steadily.");
  else rules.push("Every 6–8 weeks, take a lighter week (about half the sets) to recover.");
  if (input.limitations.length) rules.push("Exercises that commonly aggravate your listed limitations were swapped for safer options. Stop any exercise that causes pain and consult a professional.");
  return rules;
}

export function parsePlan(data: string): TrainingPlan {
  return JSON.parse(data) as TrainingPlan;
}
