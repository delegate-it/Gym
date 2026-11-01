import type { Exercise } from "./exercises";

/** Body areas a user can report as injured or painful. */
export type Limitation = "neck" | "shoulders" | "elbows" | "wrists" | "lower_back" | "hips" | "knees" | "ankles";

export const INJURY_AREAS: { id: Limitation; label: string }[] = [
  { id: "neck", label: "Neck" },
  { id: "shoulders", label: "Shoulders" },
  { id: "elbows", label: "Elbows" },
  { id: "wrists", label: "Wrists" },
  { id: "lower_back", label: "Lower back" },
  { id: "hips", label: "Hips" },
  { id: "knees", label: "Knees" },
  { id: "ankles", label: "Ankles" },
];

export const injuryLabel = (id: string) => INJURY_AREAS.find((a) => a.id === id)?.label ?? id;

export function parseLimitations(value: string | string[]): Limitation[] {
  const ids = new Set(INJURY_AREAS.map((a) => a.id as string));
  return (Array.isArray(value) ? value : value.split(",")).filter((v): v is Limitation => ids.has(v));
}

type L = Limitation;
const N: L = "neck", S: L = "shoulders", E: L = "elbows", W: L = "wrists", B: L = "lower_back", H: L = "hips", K: L = "knees", A: L = "ankles";

/**
 * Joints each hand-picked exercise loads significantly, following common strength-coaching and
 * physiotherapy guidance. An exercise listed with no areas is generally well tolerated.
 */
const STRESS: Record<string, L[]> = {
  // Squats, lunges and leg machines
  Barbell_Squat: [K, B, H, S],
  Front_Squat_Clean_Grip: [K, B, H, W, E],
  Hack_Squat: [K, H],
  Leg_Press: [K, H],
  Goblet_Squat: [K, H],
  Bodyweight_Squat: [K],
  Split_Squat_with_Dumbbells: [K, H, A],
  Split_Squats: [K, H, A],
  Dumbbell_Lunges: [K, H, A],
  Dumbbell_Rear_Lunge: [K, H],
  Bodyweight_Walking_Lunge: [K, H, A],
  Dumbbell_Step_Ups: [K, A],
  Leg_Extensions: [K],
  "Single-Leg_Leg_Extension": [K],
  Lying_Leg_Curls: [],
  Seated_Leg_Curl: [],
  // Hinges and glutes
  Barbell_Deadlift: [B, H],
  Trap_Bar_Deadlift: [B, H],
  Sumo_Deadlift: [B, H, K],
  Rack_Pulls: [B],
  Romanian_Deadlift: [B, H],
  "Stiff-Legged_Dumbbell_Deadlift": [B, H],
  Good_Morning: [B, H, S],
  Pull_Through: [],
  Barbell_Hip_Thrust: [],
  Barbell_Glute_Bridge: [],
  Butt_Lift_Bridge: [],
  Single_Leg_Glute_Bridge: [],
  // Calves
  Standing_Calf_Raises: [A],
  Seated_Calf_Raise: [A],
  Smith_Machine_Calf_Raise: [A],
  Calf_Raise_On_A_Dumbbell: [A],
  Standing_Dumbbell_Calf_Raise: [A],
  "Dumbbell_Seated_One-Leg_Calf_Raise": [A],
  // Chest presses and push-ups
  "Barbell_Bench_Press_-_Medium_Grip": [S, W, E],
  Smith_Machine_Bench_Press: [S, W, E],
  Decline_Barbell_Bench_Press: [S, W, E],
  "Barbell_Incline_Bench_Press_-_Medium_Grip": [S, W, E],
  "Close-Grip_Barbell_Bench_Press": [S, W, E],
  Dumbbell_Bench_Press: [S],
  Incline_Dumbbell_Press: [S],
  Hammer_Grip_Incline_DB_Bench_Press: [S],
  Dumbbell_Floor_Press: [],
  Machine_Bench_Press: [],
  Leverage_Chest_Press: [],
  Leverage_Incline_Chest_Press: [],
  Pushups: [S, W],
  "Push-Up_Wide": [S, W],
  "Decline_Push-Up": [S, W],
  "Incline_Push-Up": [W],
  "Push-Ups_-_Close_Triceps_Position": [W, E],
  Bench_Dips: [S, W, E],
  // Chest flyes
  Cable_Crossover: [S],
  Flat_Bench_Cable_Flyes: [S],
  Dumbbell_Flyes: [S],
  Butterfly: [],
  // Shoulders
  Standing_Military_Press: [S, B, W, N],
  Seated_Barbell_Military_Press: [S, W, N],
  Machine_Shoulder_Military_Press: [S, N],
  Seated_Dumbbell_Press: [S, N],
  Arnold_Dumbbell_Press: [S, N],
  "Dumbbell_One-Arm_Shoulder_Press": [S, N],
  Side_Lateral_Raise: [S],
  Cable_Seated_Lateral_Raise: [S],
  "One-Arm_Side_Laterals": [S],
  Face_Pull: [],
  Reverse_Flyes: [],
  Reverse_Machine_Flyes: [],
  Cable_Rear_Delt_Fly: [],
  // Rows and pull-downs
  Bent_Over_Barbell_Row: [B],
  "T-Bar_Row_with_Handle": [B],
  "Reverse_Grip_Bent-Over_Rows": [B, W, E],
  "Bent_Over_Two-Dumbbell_Row": [B],
  "Bent_Over_Two-Dumbbell_Row_With_Palms_In": [B],
  "One-Arm_Dumbbell_Row": [],
  Dumbbell_Incline_Row: [],
  Seated_Cable_Rows: [],
  Leverage_High_Row: [],
  Inverted_Row: [],
  Superman: [B],
  Pullups: [S, E],
  "Chin-Up": [S, E, W],
  "Wide-Grip_Lat_Pulldown": [S],
  "Full_Range-Of-Motion_Lat_Pulldown": [S],
  "Close-Grip_Front_Lat_Pulldown": [],
  "V-Bar_Pulldown": [],
  Underhand_Cable_Pulldowns: [E],
  // Biceps
  Barbell_Curl: [E, W],
  "EZ-Bar_Curl": [E],
  Preacher_Curl: [E],
  Standing_Biceps_Cable_Curl: [E],
  Dumbbell_Bicep_Curl: [E],
  Dumbbell_Alternate_Bicep_Curl: [E],
  Incline_Dumbbell_Curl: [E, S],
  Concentration_Curls: [E],
  Hammer_Curls: [],
  "Cable_Hammer_Curls_-_Rope_Attachment": [],
  // Triceps
  Triceps_Pushdown: [E],
  "Triceps_Pushdown_-_Rope_Attachment": [E],
  Reverse_Grip_Triceps_Pushdown: [E, W],
  Standing_Dumbbell_Triceps_Extension: [E, S],
  Cable_Rope_Overhead_Triceps_Extension: [E, S],
  "EZ-Bar_Skullcrusher": [E],
  Lying_Triceps_Press: [E],
  Tricep_Dumbbell_Kickback: [E],
  // Core
  Plank: [],
  Side_Bridge: [],
  Dead_Bug: [],
  Cable_Crunch: [B, N],
  Decline_Crunch: [B, N],
  "Cross-Body_Crunch": [B, N],
  "Leg_Pull-In": [B, H],
  Hanging_Leg_Raise: [B, S, H],
  Dumbbell_Side_Bend: [B],
};

/** Keyword rules for the rest of the library. Deliberately cautious: when in doubt, flag it. */
const RULES: [RegExp, L[]][] = [
  [/squat|lunge|step[- ]?up|pistol|leg press|leg extension|sissy|wall sit|box jump/i, [K]],
  [/squat|lunge|split|deadlift|good morning|sumo|hip|adduct|abduct|leg raise|knee raise|leg lift/i, [H]],
  [/jump|hop|bound|skip|sprint|run|calf|step[- ]?up|lunge|split|burpee/i, [A]],
  [/deadlift|good morning|bent[- ]?over|hyperextension|back extension|superman|t-bar|snatch|clean|jerk|crunch|sit[- ]?up|v-up|jackknife|toes to bar|leg raise|twist/i, [B]],
  [/overhead|military|shoulder press|press behind|behind the neck|snatch|jerk|handstand|upright row|dip|lateral raise|front raise|pull-?up|chin-?up|muscle[- ]?up|fly|flye|bench press|push-?up/i, [S]],
  [/push-?up|bench press|floor press|dip|front squat|clean|snatch|handstand|wrist|plank.*hand|mountain climber|burpee/i, [W]],
  [/curl|tricep|skull|pushdown|kickback|close[- ]grip|dip|pull-?up|chin-?up|french press|lying.*extension/i, [E]],
  [/neck|shrug|crunch|sit[- ]?up|military|overhead press|behind the neck|headstand/i, [N]],
];

const ARM_MUSCLES = ["biceps", "triceps", "forearms"];

/** The body areas an exercise is likely to load. */
export function stressAreas(ex: Pick<Exercise, "id" | "name" | "primary">): L[] {
  const known = STRESS[ex.id];
  if (known) return known;
  const areas = new Set<L>();
  for (const [pattern, hits] of RULES) if (pattern.test(ex.name)) hits.forEach((a) => areas.add(a));
  // "Leg curl" / "leg extension" are knee work, not elbow work.
  if (areas.has(E) && !ex.primary.some((m) => ARM_MUSCLES.includes(m)) && /leg|hamstring/i.test(ex.name)) areas.delete(E);
  return [...areas];
}

/** The user's injured areas an exercise would load (empty when it's fine). */
export function injuryConflicts(ex: Pick<Exercise, "id" | "name" | "primary"> | undefined, limitations: readonly string[]): L[] {
  if (!ex || !limitations.length) return [];
  return stressAreas(ex).filter((a) => limitations.includes(a));
}
