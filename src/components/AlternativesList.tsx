import Link from "next/link";
import type { Exercise } from "@/lib/exercises";
import { ExerciseThumb } from "./ExerciseThumb";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Row({ ex, action }: { ex: Exercise; action: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <Link href={`/exercises/${ex.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <ExerciseThumb id={ex.id} size={48} />
        <div className="min-w-0">
          <p className="truncate font-medium">{ex.name}</p>
          <p className="truncate text-xs muted">{cap(ex.equipment)} · {cap(ex.level)}</p>
        </div>
      </Link>
      {action}
    </li>
  );
}

/** Lists replacement exercises; `actionFor` renders the button that picks one. */
export function AlternativesList({ recommended, sameMuscle, muscle, actionFor, libraryHref, screened }: {
  recommended: Exercise[];
  sameMuscle: Exercise[];
  muscle?: string;
  actionFor: (exerciseId: string) => React.ReactNode;
  libraryHref: string;
  screened: boolean;
}) {
  return (
    <div className="space-y-4">
      {recommended.length > 0 && (
        <section className="card">
          <h2 className="font-bold">Recommended swaps</h2>
          <p className="text-xs muted">Same movement, suited to your equipment{screened ? " and problem areas" : ""}.</p>
          <ul className="mt-1 divide-y divide-zinc-100 dark:divide-zinc-800">
            {recommended.map((ex) => <Row key={ex.id} ex={ex} action={actionFor(ex.id)} />)}
          </ul>
        </section>
      )}
      {sameMuscle.length > 0 && (
        <section className="card">
          <h2 className="font-bold">More {muscle ? `${muscle} ` : ""}exercises</h2>
          {screened && <p className="text-xs muted">Not screened for your problem areas — stop if anything hurts.</p>}
          <ul className="mt-1 divide-y divide-zinc-100 dark:divide-zinc-800">
            {sameMuscle.map((ex) => <Row key={ex.id} ex={ex} action={actionFor(ex.id)} />)}
          </ul>
        </section>
      )}
      <Link href={libraryHref} className="btn-ghost w-full">Search the full exercise library</Link>
    </div>
  );
}
