import { getExercise } from "@/lib/exercises";
import { injuryLabel } from "@/lib/injuries";
import type { InjuryAnalysis } from "@/lib/injury-analysis";

/** What the app understood from the user's injury description. */
export function InjuryInfo({ info, avoidIds }: { info: Omit<InjuryAnalysis, "avoidIds">; avoidIds: string[] }) {
  return (
    <div className="space-y-2 text-sm">
      {info.seeProfessional && (
        <p className="rounded-lg bg-red-50 p-2 font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
          🩺 From your description, please get this checked by a physiotherapist or doctor before training the affected area.
        </p>
      )}
      {info.summary && <p>{info.summary}</p>}
      {info.areas.length > 0 && (
        <p className="muted">Areas protected: {info.areas.map(injuryLabel).join(", ")}</p>
      )}
      {avoidIds.length > 0 && (
        <p className="muted">Also avoiding: {avoidIds.map((id) => getExercise(id)?.name ?? id).join(", ")}</p>
      )}
      {info.advice.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">{info.advice.map((a) => <li key={a}>{a}</li>)}</ul>
      )}
      <p className="text-xs muted">{info.source === "ai" ? "Analysed by Claude (AI)." : "Matched from common injury terms."}</p>
    </div>
  );
}
