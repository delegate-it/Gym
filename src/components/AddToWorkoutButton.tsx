"use client";

import { useTransition } from "react";
import { addExercise } from "@/app/actions/workout";

export function AddToWorkoutButton({ workoutId, exerciseId }: { workoutId: string; exerciseId: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="btn-primary px-3 py-2 text-sm" disabled={pending} onClick={() => start(() => addExercise(workoutId, exerciseId))}>
      {pending ? "…" : "Add"}
    </button>
  );
}
