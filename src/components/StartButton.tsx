"use client";

import { useTransition } from "react";
import { startWorkout } from "@/app/actions/workout";

export function StartButton({ dayIndex, label = "Start workout", className = "btn-primary w-full" }: { dayIndex: number; label?: string; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button className={className} disabled={pending} onClick={() => start(() => startWorkout(dayIndex))}>
      {pending ? "Starting…" : label}
    </button>
  );
}
