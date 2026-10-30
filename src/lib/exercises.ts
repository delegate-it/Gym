import data from "../../data/exercises.json";

export type Exercise = {
  id: string;
  name: string;
  level: string;
  category: string;
  equipment: string;
  mechanic: string | null;
  force: string | null;
  primary: string[];
  secondary: string[];
  instructions: string[];
  images: string[];
};

export const exercises = data as Exercise[];
const byId = new Map(exercises.map((e) => [e.id, e]));

export function getExercise(id: string) {
  return byId.get(id);
}

export const MUSCLES = [
  "chest", "shoulders", "triceps", "biceps", "forearms", "lats", "middle back", "lower back", "traps",
  "abdominals", "quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors", "neck",
];

export const EQUIPMENT = [
  "body only", "dumbbell", "barbell", "kettlebells", "cable", "machine", "bands", "e-z curl bar",
  "medicine ball", "exercise ball", "foam roll", "other",
];

export const CATEGORIES = ["strength", "stretching", "cardio", "plyometrics", "powerlifting", "olympic weightlifting", "strongman"];

const IMAGE_BASE =
  process.env.NEXT_PUBLIC_EXERCISE_IMAGE_BASE ||
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export function imageUrl(path: string) {
  return `${IMAGE_BASE}/${path}`;
}

/** Link to video demonstrations of the exercise. */
export function videoUrl(e: Pick<Exercise, "name">) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${e.name} exercise proper form`)}`;
}

export function searchExercises(opts: { q?: string; muscle?: string; equipment?: string; category?: string }) {
  const words = (opts.q || "").toLowerCase().split(/\s+/).filter(Boolean);
  return exercises.filter((e) => {
    if (opts.muscle && !e.primary.includes(opts.muscle)) return false;
    if (opts.equipment && e.equipment !== opts.equipment) return false;
    if (opts.category && e.category !== opts.category) return false;
    if (words.length) {
      const hay = `${e.name} ${e.primary.join(" ")} ${e.equipment}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    }
    return true;
  });
}
