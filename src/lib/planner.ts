import { exercises as allExercises, getExercise, type Exercise } from "./exercises";
import { injuryConflicts, injuryLabel, type Limitation } from "./injuries";

export type { Limitation };

export type Goal = "muscle" | "strength" | "fat_loss" | "fitness";
export type Experience = "beginner" | "intermediate" | "advanced";
export type EquipmentAccess = "gym" | "dumbbells" | "bodyweight";

export type PlannerInput = {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  sessionMin: number;
  equipment: EquipmentAccess;
  limitations: Limitation[];
  /** Preferred split; ignored if it doesn't fit the number of days. */
  splitId?: SplitId;
  /** Changes the accessory exercise selection ("fresh exercises"). */
  variant?: number;
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
  note?: string;
};

export type TrainingPlan = {
  name: string;
  basedOn: string;
  summary: string;
  days: PlanDay[];
  progression: string[];
  warmup: string;
  splitId?: SplitId;
  variant?: number;
  /** Set once the user has edited the plan by hand. */
  edited?: boolean;
  /** What the last injury update changed, shown once on the Plan page. */
  injuryChanges?: InjuryChange[];
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
    { id: "Hack_Squat", eq: "gym", avoid: ["knees"] },
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
    { id: "Dumbbell_Rear_Lunge", eq: "dumbbells", avoid: ["knees"] },
    { id: "Split_Squats", eq: "bodyweight", avoid: ["knees"] },
    { id: "Bodyweight_Walking_Lunge", eq: "bodyweight", avoid: ["knees"] },
    { id: "Single_Leg_Glute_Bridge", eq: "bodyweight" },
  ],
  hinge: [
    { id: "Barbell_Deadlift", eq: "gym", avoid: ["lower_back"] },
    { id: "Trap_Bar_Deadlift", eq: "gym", avoid: ["lower_back"] },
    { id: "Sumo_Deadlift", eq: "gym", avoid: ["lower_back"] },
    { id: "Rack_Pulls", eq: "gym", avoid: ["lower_back"] },
    { id: "Stiff-Legged_Dumbbell_Deadlift", eq: "dumbbells", avoid: ["lower_back"] },
    { id: "Barbell_Hip_Thrust", eq: "gym" },
    { id: "Single_Leg_Glute_Bridge", eq: "bodyweight" },
  ],
  hinge_alt: [
    { id: "Romanian_Deadlift", eq: "gym", avoid: ["lower_back"] },
    { id: "Good_Morning", eq: "gym", avoid: ["lower_back"] },
    { id: "Pull_Through", eq: "gym" },
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
    { id: "Seated_Leg_Curl", eq: "gym" },
    { id: "Stiff-Legged_Dumbbell_Deadlift", eq: "dumbbells", avoid: ["lower_back"] },
    { id: "Single_Leg_Glute_Bridge", eq: "bodyweight" },
  ],
  leg_ext: [
    { id: "Leg_Extensions", eq: "gym", avoid: ["knees"] },
    { id: "Single-Leg_Leg_Extension", eq: "gym", avoid: ["knees"] },
    { id: "Dumbbell_Step_Ups", eq: "dumbbells", avoid: ["knees"] },
    { id: "Split_Squats", eq: "bodyweight", avoid: ["knees"] },
  ],
  calves: [
    { id: "Standing_Calf_Raises", eq: "gym" },
    { id: "Seated_Calf_Raise", eq: "gym" },
    { id: "Smith_Machine_Calf_Raise", eq: "gym" },
    { id: "Calf_Raise_On_A_Dumbbell", eq: "dumbbells" },
    { id: "Standing_Dumbbell_Calf_Raise", eq: "dumbbells" },
    { id: "Dumbbell_Seated_One-Leg_Calf_Raise", eq: "dumbbells" },
  ],
  h_push: [
    { id: "Barbell_Bench_Press_-_Medium_Grip", eq: "gym", avoid: ["shoulders"] },
    { id: "Smith_Machine_Bench_Press", eq: "gym", avoid: ["shoulders"] },
    { id: "Decline_Barbell_Bench_Press", eq: "gym", avoid: ["shoulders"] },
    { id: "Leverage_Chest_Press", eq: "gym" },
    { id: "Dumbbell_Bench_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Pushups", eq: "bodyweight", avoid: ["shoulders"] },
    { id: "Dumbbell_Floor_Press", eq: "dumbbells" },
    { id: "Incline_Push-Up", eq: "bodyweight" },
  ],
  incline_push: [
    { id: "Incline_Dumbbell_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Decline_Push-Up", eq: "bodyweight", avoid: ["shoulders"] },
    { id: "Machine_Bench_Press", eq: "gym" },
    { id: "Barbell_Incline_Bench_Press_-_Medium_Grip", eq: "gym", avoid: ["shoulders"] },
    { id: "Leverage_Incline_Chest_Press", eq: "gym" },
    { id: "Hammer_Grip_Incline_DB_Bench_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Incline_Push-Up", eq: "bodyweight" },
  ],
  v_push: [
    { id: "Standing_Military_Press", eq: "gym", avoid: ["shoulders", "lower_back"] },
    { id: "Seated_Barbell_Military_Press", eq: "gym", avoid: ["shoulders"] },
    { id: "Machine_Shoulder_Military_Press", eq: "gym", avoid: ["shoulders"] },
    { id: "Seated_Dumbbell_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Arnold_Dumbbell_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Dumbbell_One-Arm_Shoulder_Press", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Decline_Push-Up", eq: "bodyweight", avoid: ["shoulders"] },
    { id: "Side_Lateral_Raise", eq: "dumbbells" },
    { id: "Incline_Push-Up", eq: "bodyweight" },
  ],
  h_pull: [
    { id: "Bent_Over_Barbell_Row", eq: "gym", avoid: ["lower_back"] },
    { id: "Seated_Cable_Rows", eq: "gym" },
    { id: "T-Bar_Row_with_Handle", eq: "gym", avoid: ["lower_back"] },
    { id: "Reverse_Grip_Bent-Over_Rows", eq: "gym", avoid: ["lower_back"] },
    { id: "Leverage_High_Row", eq: "gym" },
    { id: "One-Arm_Dumbbell_Row", eq: "dumbbells" },
    { id: "Bent_Over_Two-Dumbbell_Row_With_Palms_In", eq: "dumbbells", avoid: ["lower_back"] },
    { id: "Inverted_Row", eq: "bodyweight" },
  ],
  v_pull: [
    { id: "Pullups", eq: "gym" },
    { id: "Wide-Grip_Lat_Pulldown", eq: "gym" },
    { id: "Close-Grip_Front_Lat_Pulldown", eq: "gym" },
    { id: "V-Bar_Pulldown", eq: "gym" },
    { id: "Underhand_Cable_Pulldowns", eq: "gym" },
    { id: "Full_Range-Of-Motion_Lat_Pulldown", eq: "gym" },
    { id: "Bent_Over_Two-Dumbbell_Row", eq: "dumbbells", avoid: ["lower_back"] },
    { id: "Dumbbell_Incline_Row", eq: "dumbbells" },
    { id: "Inverted_Row", eq: "bodyweight" },
  ],
  chest_fly: [
    { id: "Cable_Crossover", eq: "gym", avoid: ["shoulders"] },
    { id: "Flat_Bench_Cable_Flyes", eq: "gym", avoid: ["shoulders"] },
    { id: "Dumbbell_Flyes", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Butterfly", eq: "gym" },
    { id: "Push-Up_Wide", eq: "bodyweight", avoid: ["shoulders"] },
  ],
  lateral: [
    { id: "Side_Lateral_Raise", eq: "dumbbells" },
    { id: "Cable_Seated_Lateral_Raise", eq: "gym" },
    { id: "One-Arm_Side_Laterals", eq: "dumbbells" },
  ],
  rear_delt: [
    { id: "Face_Pull", eq: "gym" },
    { id: "Reverse_Machine_Flyes", eq: "gym" },
    { id: "Cable_Rear_Delt_Fly", eq: "gym" },
    { id: "Reverse_Flyes", eq: "dumbbells" },
    { id: "Superman", eq: "bodyweight" },
  ],
  biceps: [
    { id: "Barbell_Curl", eq: "gym" },
    { id: "EZ-Bar_Curl", eq: "gym" },
    { id: "Preacher_Curl", eq: "gym" },
    { id: "Standing_Biceps_Cable_Curl", eq: "gym" },
    { id: "Dumbbell_Bicep_Curl", eq: "dumbbells" },
    { id: "Dumbbell_Alternate_Bicep_Curl", eq: "dumbbells" },
    { id: "Chin-Up", eq: "bodyweight" },
  ],
  biceps_alt: [
    { id: "Hammer_Curls", eq: "dumbbells" },
    { id: "Incline_Dumbbell_Curl", eq: "dumbbells" },
    { id: "Concentration_Curls", eq: "dumbbells" },
    { id: "Cable_Hammer_Curls_-_Rope_Attachment", eq: "gym" },
  ],
  triceps: [
    { id: "Triceps_Pushdown", eq: "gym" },
    { id: "Triceps_Pushdown_-_Rope_Attachment", eq: "gym" },
    { id: "Reverse_Grip_Triceps_Pushdown", eq: "gym" },
    { id: "Standing_Dumbbell_Triceps_Extension", eq: "dumbbells", avoid: ["shoulders"] },
    { id: "Tricep_Dumbbell_Kickback", eq: "dumbbells" },
    { id: "Bench_Dips", eq: "bodyweight", avoid: ["shoulders"] },
    { id: "Push-Ups_-_Close_Triceps_Position", eq: "bodyweight" },
  ],
  triceps_alt: [
    { id: "Cable_Rope_Overhead_Triceps_Extension", eq: "gym", avoid: ["shoulders"] },
    { id: "EZ-Bar_Skullcrusher", eq: "gym" },
    { id: "Lying_Triceps_Press", eq: "gym" },
    { id: "Close-Grip_Barbell_Bench_Press", eq: "gym", avoid: ["shoulders"] },
    { id: "Tricep_Dumbbell_Kickback", eq: "dumbbells" },
    { id: "Push-Ups_-_Close_Triceps_Position", eq: "bodyweight" },
  ],
  core: [
    { id: "Cable_Crunch", eq: "gym", avoid: ["lower_back"] },
    { id: "Plank", eq: "bodyweight" },
    { id: "Leg_Pull-In", eq: "bodyweight", avoid: ["lower_back"] },
    { id: "Decline_Crunch", eq: "gym", avoid: ["lower_back"] },
    { id: "Hanging_Leg_Raise", eq: "bodyweight", avoid: ["lower_back"] },
  ],
  core_alt: [
    { id: "Dead_Bug", eq: "bodyweight" },
    { id: "Side_Bridge", eq: "bodyweight" },
    { id: "Cross-Body_Crunch", eq: "bodyweight", avoid: ["lower_back"] },
    { id: "Dumbbell_Side_Bend", eq: "dumbbells" },
  ],
};

const EQ_RANK: Record<EquipmentAccess, number> = { bodyweight: 0, dumbbells: 1, gym: 2 };

/** True when an option suits the user's equipment and doesn't load any injured area. */
function suits(o: Option, input: Pick<PlannerInput, "equipment" | "limitations">) {
  return EQ_RANK[o.eq] <= EQ_RANK[input.equipment] &&
    !o.avoid?.some((l) => input.limitations.includes(l)) &&
    injuryConflicts(getExercise(o.id), input.limitations).length === 0;
}

function pick(pattern: Pattern, role: Role, input: PlannerInput, usedToday: Set<string>, usedInPlan: Set<string>, variant: number): string | null {
  const safe = PATTERNS[pattern].filter((o) => suits(o, input));
  // Main lifts stay the best option; other slots prefer variety across the week.
  // Never repeat an exercise within the same workout.
  const fresh = safe.filter((o) => !usedToday.has(o.id));
  // Variety only among options for the same equipment, so a gym user isn't given a home substitute.
  const top = fresh[0];
  if (!top || role === "main") return top && getExercise(top.id) ? top.id : null;
  const sameTier = fresh.filter((o) => o.eq === top.eq);
  const unused = sameTier.filter((o) => !usedInPlan.has(o.id));
  const pool = unused.length ? unused : sameTier;
  const choice = pool[variant % pool.length];
  return getExercise(choice.id) ? choice.id : null;
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

export type SplitId = "full_body" | "upper_lower" | "ppl" | "phat" | "ppl_ul";

const SPLITS: Record<SplitId, { name: string; basedOn: string; description: string; days: Partial<Record<number, DayTemplate[]>> }> = {
  full_body: {
    name: "Full Body",
    basedOn: "StrongLifts 5×5, GZCLP and Starting Strength-style full-body training",
    description: "Every session trains your whole body. Great for beginners and busy schedules.",
    days: {
      2: [FULL_A, FULL_B],
      3: [FULL_A, FULL_B, FULL_C],
      4: [{ ...FULL_A, name: "Full Body A1" }, { ...FULL_B, name: "Full Body B1" }, { ...FULL_A, name: "Full Body A2" }, { ...FULL_B, name: "Full Body B2" }],
    },
  },
  upper_lower: {
    name: "Upper / Lower",
    basedOn: "PHUL — Power Hypertrophy Upper Lower",
    description: "Alternates upper-body and lower-body days, with heavy and higher-rep sessions.",
    days: { 2: [UPPER_STRENGTH, LOWER_STRENGTH], 4: [UPPER_STRENGTH, LOWER_STRENGTH, UPPER_VOLUME, LOWER_VOLUME] },
  },
  ppl: {
    name: "Push / Pull / Legs",
    basedOn: "The popular Push/Pull/Legs (Reddit PPL) program",
    description: "Pushing muscles, pulling muscles and legs on separate days. More volume per muscle.",
    days: { 3: [PUSH_A, PULL_A, LEGS_A], 6: [PUSH_A, PULL_A, LEGS_A, PUSH_B, PULL_B, LEGS_B] },
  },
  phat: {
    name: "Upper / Lower + Push / Pull / Legs",
    basedOn: "PHAT-style hybrid: strength upper/lower days plus a PPL volume block",
    description: "Two heavy strength days, then three higher-volume push, pull and leg days.",
    days: { 5: [UPPER_STRENGTH, LOWER_STRENGTH, { ...PUSH_A, slots: PUSH_A.slots.map(([p]) => [p, "secondary"] as Slot) }, { ...PULL_B, name: "Pull" }, { ...LEGS_B, name: "Legs" }] },
  },
  ppl_ul: {
    name: "Push / Pull / Legs + Upper / Lower",
    basedOn: "The 5-day PPL-UL split",
    description: "A full push/pull/legs round, then an upper and a lower day to hit everything twice.",
    days: { 5: [PUSH_A, PULL_A, LEGS_A, { ...UPPER_STRENGTH, name: "Upper" }, { ...LOWER_VOLUME, name: "Lower" }] },
  },
};

const DEFAULT_SPLIT: Record<number, SplitId> = { 2: "full_body", 3: "full_body", 4: "upper_lower", 5: "phat", 6: "ppl" };

/** The splits that fit a number of training days, the default first. */
export function splitOptions(days: number) {
  const d = clampDays(days);
  return (Object.keys(SPLITS) as SplitId[])
    .filter((id) => SPLITS[id].days[d])
    .sort((a, b) => Number(b === DEFAULT_SPLIT[d]) - Number(a === DEFAULT_SPLIT[d]))
    .map((id) => ({ id, name: SPLITS[id].name, basedOn: SPLITS[id].basedOn, description: SPLITS[id].description }));
}

const clampDays = (days: number) => Math.min(6, Math.max(2, days));

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

/** Safe extra work used when injuries leave a day with too few exercises. */
const INJURY_FILLERS: Pattern[] = ["h_pull", "rear_delt", "glutes", "leg_curl", "core", "core_alt", "calves"];

const CARDIO: Record<Goal, string | undefined> = {
  fat_loss: "Finish with 10–20 min of intervals: 30 s hard / 60 s easy (bike, rower, brisk incline walk or skipping).",
  fitness: "Finish with 10–20 min of steady cardio at a pace where you can still talk.",
  muscle: undefined,
  strength: undefined,
};

/* ------------------------------------------------------------------ */

export function generatePlan(input: PlannerInput): TrainingPlan {
  const days = clampDays(input.daysPerWeek);
  const splitId = input.splitId && SPLITS[input.splitId].days[days] ? input.splitId : DEFAULT_SPLIT[days];
  const split = SPLITS[splitId];
  const variant = input.variant ?? 0;
  const cardio = CARDIO[input.goal];
  const cardioMin = cardio ? (input.sessionMin <= 45 ? 10 : 15) : 0;
  const budget = input.sessionMin - 7 - cardioMin; // minus warm-up and cardio

  const usedInPlan = new Set<string>();
  const planDays: PlanDay[] = split.days[days]!.map((tpl, i) => {
    const used = new Set<string>();
    const exercises: PlanExercise[] = [];
    let minutes = 0;

    for (const [pattern, role] of tpl.slots) {
      const id = pick(pattern, role, input, used, usedInPlan, variant);
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

    // Injuries can rule out most of a day (e.g. every push-up for a wrist injury at home).
    // Keep the session worthwhile with safe work for other areas.
    let note: string | undefined;
    if (input.limitations.length && exercises.length < 3) {
      for (const pattern of INJURY_FILLERS) {
        if (exercises.length >= 3) break;
        const id = pick(pattern, "accessory", input, used, usedInPlan, variant);
        if (!id || used.has(id)) continue;
        const s = scheme(input.goal, "accessory", input.experience);
        used.add(id);
        exercises.push({ exerciseId: id, sets: s.sets, reps: repsFor(id, s.reps, input.goal), restSec: s.restSec });
      }
      note = "Adjusted for your injuries: exercises that load the injured area were left out, and safe work for other areas was added.";
    }

    return { name: tpl.name, focus: tpl.focus, weekday: WEEKDAYS[days][i], exercises, cardio, note };
  });

  const goalText: Record<Goal, string> = {
    muscle: "build muscle",
    strength: "get stronger",
    fat_loss: "lose fat while keeping muscle",
    fitness: "improve overall fitness",
  };

  return {
    name: `${split.name} (${days} days)`,
    basedOn: split.basedOn,
    splitId,
    variant,
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
  if (input.limitations.length) {
    const areas = input.limitations.map((l) => injuryLabel(l).toLowerCase()).join(", ");
    rules.push(`Injuries (${areas}): exercises that commonly load these areas were left out or swapped for safer options. Stop any exercise that causes pain, and check with a physiotherapist or doctor if the injury is recent or serious.`);
  }
  return rules;
}

export function parsePlan(data: string): TrainingPlan {
  return JSON.parse(data) as TrainingPlan;
}

/* ------------------------------------------------------------------ */
/* Editing: swaps and additions.                                       */
/* ------------------------------------------------------------------ */

const LIBRARY_EQUIPMENT: Record<EquipmentAccess, string[] | null> = {
  gym: null, // anything
  dumbbells: ["dumbbell", "body only", "none"],
  bodyweight: ["body only", "none"],
};

const LEVEL_RANK: Record<string, number> = { beginner: 0, intermediate: 1, expert: 2 };

/**
 * Exercises that can replace `exerciseId`: first the curated options for the same movement
 * (filtered for the user's equipment and injuries), then other exercises for the same muscle.
 */
export function alternativesFor(exerciseId: string, input: Pick<PlannerInput, "equipment" | "limitations" | "experience">) {
  const current = getExercise(exerciseId);
  const fits = (o: Option) => suits(o, input);

  const recommended: Exercise[] = [];
  for (const options of Object.values(PATTERNS)) {
    if (!options.some((o) => o.id === exerciseId)) continue;
    for (const o of options) {
      const ex = getExercise(o.id);
      if (ex && o.id !== exerciseId && fits(o) && !recommended.includes(ex)) recommended.push(ex);
    }
  }

  const allowedEq = LIBRARY_EQUIPMENT[input.equipment];
  const muscle = current?.primary[0];
  const maxLevel = input.experience === "beginner" ? 1 : 2;
  const sameMuscle = !muscle ? [] : allExercises
    .filter((e) =>
      e.id !== exerciseId &&
      e.category === "strength" &&
      e.primary.includes(muscle) &&
      (!allowedEq || allowedEq.includes(e.equipment)) &&
      (LEVEL_RANK[e.level] ?? 0) <= maxLevel &&
      injuryConflicts(e, input.limitations).length === 0 &&
      !recommended.includes(e))
    .sort((a, b) =>
      Number(b.mechanic === current?.mechanic) - Number(a.mechanic === current?.mechanic) ||
      (LEVEL_RANK[a.level] ?? 0) - (LEVEL_RANK[b.level] ?? 0) ||
      a.name.localeCompare(b.name))
    .slice(0, 15);

  return { recommended, sameMuscle };
}

/** Keeps sets and rest when swapping, and adapts the rep target to the new exercise. */
export function swapPrescription(old: PlanExercise, newId: string, goal: Goal): PlanExercise {
  const special = TIMED.has(old.exerciseId) || PULL_UPS.has(old.exerciseId) || old.reps === "12-20";
  const baseReps = special ? SCHEMES[goal].secondary.reps : old.reps;
  return { ...old, exerciseId: newId, reps: repsFor(newId, baseReps, goal) };
}

/** Prescription for an exercise the user adds to a day themselves. */
export function addedPrescription(exerciseId: string, goal: Goal, experience: Experience): PlanExercise {
  const s = scheme(goal, "accessory", experience);
  return { exerciseId, sets: s.sets, reps: repsFor(exerciseId, s.reps, goal), restSec: s.restSec };
}

/** Every hand-picked exercise once, with the equipment level it needs. */
const CURATED: Option[] = [...new Map(Object.values(PATTERNS).flat().map((o) => [o.id, o] as const)).values()];

function libraryTier(equipment?: string): EquipmentAccess {
  if (!equipment || equipment === "body only" || equipment === "none") return "bodyweight";
  return equipment === "dumbbell" ? "dumbbells" : "gym";
}

type ReplaceInput = Pick<PlannerInput, "equipment" | "limitations" | "experience" | "goal">;

/**
 * A similar hand-picked exercise to replace `item` with: same main muscle, trained the same way
 * (compound/isolation, push/pull), safe for the user's equipment and injuries, and not already in
 * the day. Prefers the same movement on the same equipment. Returns null when nothing fits.
 */
function findReplacement(item: PlanExercise, day: PlanDay, input: ReplaceInput, used: Set<string>, random: () => number, relaxed = false) {
  const pickRandom = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const taken = (id: string) => id === item.exerciseId || used.has(id) || day.exercises.some((e) => e.exerciseId === id && e !== item);
  const patterns = Object.values(PATTERNS).filter((options) => options.some((o) => o.id === item.exerciseId));
  const currentEq = patterns.flat().find((o) => o.id === item.exerciseId)?.eq;
  const current = getExercise(item.exerciseId);
  // Same main muscle trained the same way, so a squat isn't replaced by a glute bridge or a
  // bench press by a neck press.
  const similar = (o: Option) => {
    const ex = getExercise(o.id);
    return !!ex && suits(o, input) && !taken(o.id) && ex.primary[0] === current?.primary[0] &&
      (!current?.mechanic || ex.mechanic === current.mechanic) && (!current?.force || ex.force === current.force);
  };
  const samePattern = patterns.flat().filter(similar);
  const anyPattern = CURATED.filter(similar);
  const tier = currentEq ?? libraryTier(current?.equipment);

  // Best first: same movement on the same equipment, then any similar exercise on the same
  // equipment, then the same movement at another equipment level, then anything similar.
  return (
    pickRandom(samePattern.filter((o) => o.eq === tier).map((o) => o.id)) ??
    pickRandom(anyPattern.filter((o) => o.eq === tier).map((o) => o.id)) ??
    pickRandom(samePattern.map((o) => o.id)) ??
    pickRandom(anyPattern.map((o) => o.id)) ??
    // For injuries: the movement's safe fallback even if it trains a neighbouring muscle
    // (e.g. a glute bridge in place of a squat for bad knees), in the planner's own order.
    (relaxed ? patterns.flat().find((o) => suits(o, input) && !taken(o.id) && getExercise(o.id))?.id : undefined) ??
    null
  );
}

/**
 * Replaces every exercise in a day with a different, similar one, keeping sets and rest. Picks at
 * random so each call gives a new mix; an exercise with no suitable alternative stays.
 */
export function shuffleDay(day: PlanDay, input: ReplaceInput, random = Math.random): PlanDay {
  const used = new Set<string>();
  const exercises = day.exercises.map((item) => {
    const newId = findReplacement(item, day, input, used, random);
    if (!newId) return item;
    used.add(newId);
    return swapPrescription(item, newId, input.goal);
  });
  return { ...day, exercises };
}

export type InjuryChange = { day: string; from: string; to: string | null };

/**
 * Makes an existing plan safe for the user's injuries without rebuilding it, so their own edits
 * survive: each exercise that loads an injured area is swapped for the closest safe alternative,
 * or removed when there is none.
 */
export function adaptPlanToInjuries(plan: TrainingPlan, input: ReplaceInput): { plan: TrainingPlan; changes: InjuryChange[] } {
  const changes: InjuryChange[] = [];
  const days = plan.days.map((day) => {
    const used = new Set<string>();
    const exercises: PlanExercise[] = [];
    for (const item of day.exercises) {
      if (injuryConflicts(getExercise(item.exerciseId), input.limitations).length === 0) {
        exercises.push(item);
        continue;
      }
      const newId = findReplacement(item, day, input, used, () => 0, true);
      changes.push({ day: day.name, from: item.exerciseId, to: newId });
      if (newId) {
        used.add(newId);
        exercises.push(swapPrescription(item, newId, input.goal));
      }
    }
    return { ...day, exercises };
  });
  return { plan: { ...plan, days, progression: progressionRules(input as PlannerInput) }, changes };
}
