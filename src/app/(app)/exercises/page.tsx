import Link from "next/link";
import { CATEGORIES, EQUIPMENT, MUSCLES, searchExercises } from "@/lib/exercises";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { AddToWorkoutButton } from "@/components/AddToWorkoutButton";

const PAGE = 30;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Search = { q?: string; muscle?: string; equipment?: string; category?: string; page?: string; add?: string };

export default async function ExercisesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const results = searchExercises(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const shown = results.slice(0, page * PAGE);
  const moreHref = `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => v)), page: String(page + 1) })}`;

  return (
    <div className="space-y-4">
      {sp.add ? (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Add an exercise</h1>
          <Link href={`/workout/${sp.add}`} className="text-sm muted underline">Back to workout</Link>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">Exercise library</h1>
          <p className="text-sm muted">{results.length} exercises with step-by-step instructions, photos and video demos.</p>
        </div>
      )}

      <form className="space-y-2">
        {sp.add && <input type="hidden" name="add" value={sp.add} />}
        <input name="q" defaultValue={sp.q} placeholder="Search e.g. bench press, squat, curl…" className="input" type="search" />
        <div className="grid grid-cols-3 gap-2">
          <select name="muscle" defaultValue={sp.muscle ?? ""} className="input px-2 py-2 text-sm">
            <option value="">All muscles</option>
            {MUSCLES.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
          </select>
          <select name="equipment" defaultValue={sp.equipment ?? ""} className="input px-2 py-2 text-sm">
            <option value="">All equipment</option>
            {EQUIPMENT.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
          </select>
          <select name="category" defaultValue={sp.category ?? ""} className="input px-2 py-2 text-sm">
            <option value="">All types</option>
            {CATEGORIES.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
          </select>
        </div>
        <button className="btn-primary w-full py-2">Search</button>
      </form>

      <ul className="space-y-2">
        {shown.map((e) => (
          <li key={e.id} className="card flex items-center gap-3 p-2.5">
            <Link href={`/exercises/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <ExerciseThumb id={e.id} size={64} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{e.name}</p>
                <p className="truncate text-xs muted">{e.primary.map(cap).join(", ")} · {cap(e.equipment)}</p>
                <p className="mt-1 text-xs"><span className="chip">{cap(e.level)}</span></p>
              </div>
            </Link>
            {sp.add && <AddToWorkoutButton workoutId={sp.add} exerciseId={e.id} />}
          </li>
        ))}
      </ul>
      {results.length === 0 && <p className="card text-center muted">No exercises match. Try fewer filters.</p>}
      {shown.length < results.length && <Link href={moreHref} scroll={false} className="btn-ghost w-full">Show more</Link>}
    </div>
  );
}
