import Link from "next/link";
import { CATEGORIES, EQUIPMENT, MUSCLES, searchExercises } from "@/lib/exercises";
import { requireUser } from "@/lib/auth";
import { injuryConflicts, injuryLabel, parseLimitations } from "@/lib/injuries";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ActionButton } from "@/components/ActionButton";
import { addExercise } from "@/app/actions/workout";
import { addPlanExercise, swapPlanExercise } from "@/app/actions/plan";

const PAGE = 30;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Search = { q?: string; muscle?: string; equipment?: string; category?: string; page?: string; add?: string; planDay?: string; replace?: string };

/** The library doubles as a picker: for a workout (`add`), a plan day (`planDay`) or a plan swap (`planDay` + `replace`). */
function pickerMode(sp: Search) {
  if (sp.add) {
    const id = sp.add;
    return { title: "Add an exercise", back: `/workout/${id}`, backLabel: "Back to workout", label: "Add", action: (ex: string) => addExercise.bind(null, id, ex) };
  }
  const d = Number(sp.planDay);
  if (sp.planDay == null || !Number.isInteger(d) || d < 0) return null;
  const r = Number(sp.replace);
  if (sp.replace != null && Number.isInteger(r) && r >= 0) {
    return { title: "Swap exercise", back: `/plan/edit/${d}/${r}`, backLabel: "Back", label: "Use", action: (ex: string) => swapPlanExercise.bind(null, d, r, ex) };
  }
  return { title: `Add to day ${d + 1}`, back: `/plan#day-${d}`, backLabel: "Back to plan", label: "Add", action: (ex: string) => addPlanExercise.bind(null, d, ex) };
}

export default async function ExercisesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const picker = pickerMode(sp);
  const { profile } = await requireUser();
  const injured = parseLimitations(profile.limitations);
  const describedAvoid = new Set(profile.injuryAvoid.split(",").filter(Boolean));
  const results = searchExercises(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const shown = results.slice(0, page * PAGE);
  const moreHref = `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => v)), page: String(page + 1) })}`;

  return (
    <div className="space-y-4">
      {picker ? (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{picker.title}</h1>
          <Link href={picker.back} className="text-sm muted underline">{picker.backLabel}</Link>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">Exercise library</h1>
          <p className="text-sm muted">{results.length} exercises with step-by-step instructions, photos and video demos.</p>
        </div>
      )}

      <form className="space-y-2">
        {(["add", "planDay", "replace"] as const).map((k) => sp[k] && <input key={k} type="hidden" name={k} value={sp[k]} />)}
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
                <p className="mt-1 flex flex-wrap gap-1 text-xs">
                  <span className="chip">{cap(e.level)}</span>
                  {injuryConflicts(e, injured).map((l) => (
                    <span key={l} className="chip bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">⚠️ {injuryLabel(l)}</span>
                  ))}
                  {describedAvoid.has(e.id) && injuryConflicts(e, injured).length === 0 && (
                    <span className="chip bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">⚠️ Your injury</span>
                  )}
                </p>
              </div>
            </Link>
            {picker && <ActionButton action={picker.action(e.id)}>{picker.label}</ActionButton>}
          </li>
        ))}
      </ul>
      {results.length === 0 && <p className="card text-center muted">No exercises match. Try fewer filters.</p>}
      {shown.length < results.length && <Link href={moreHref} scroll={false} className="btn-ghost w-full">Show more</Link>}
    </div>
  );
}
