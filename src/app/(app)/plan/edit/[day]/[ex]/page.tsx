import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getExercise } from "@/lib/exercises";
import { alternativesFor } from "@/lib/planner";
import { getActivePlanRecord, plannerInput } from "@/lib/plans";
import { movePlanExercise, removePlanExercise, swapPlanExercise, updatePlanExercise } from "@/app/actions/plan";
import { ActionButton } from "@/components/ActionButton";
import { AlternativesList } from "@/components/AlternativesList";
import { ExerciseThumb } from "@/components/ExerciseThumb";

const REST_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240];

export default async function EditPlanExercise({ params }: { params: Promise<{ day: string; ex: string }> }) {
  const p = await params;
  const [d, i] = [Number(p.day), Number(p.ex)];
  const user = await requireUser();
  const record = await getActivePlanRecord(user.id);
  const day = record?.plan.days[d];
  const item = day?.exercises[i];
  if (!day || !item) redirect("/plan");

  const ex = getExercise(item.exerciseId);
  const input = plannerInput(user.profile);
  const { recommended, sameMuscle } = alternativesFor(item.exerciseId, input);
  const rest = REST_OPTIONS.includes(item.restSec) ? REST_OPTIONS : [...REST_OPTIONS, item.restSec].sort((a, b) => a - b);

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/plan#day-${d}`} className="text-sm muted">‹ Plan</Link>
        <p className="mt-1 text-sm muted">Day {d + 1} · {day.name} · exercise {i + 1} of {day.exercises.length}</p>
        <h1 className="text-2xl font-bold">Edit exercise</h1>
      </div>

      <section className="card space-y-4">
        <div className="flex items-center gap-3">
          <ExerciseThumb id={item.exerciseId} size={64} />
          <div className="min-w-0">
            <p className="font-semibold">{ex?.name ?? item.exerciseId}</p>
            <Link href={`/exercises/${item.exerciseId}`} className="text-sm text-brand-600 underline dark:text-brand-400">How to do it</Link>
          </div>
        </div>

        <form action={updatePlanExercise.bind(null, d, i)} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label" htmlFor="sets">Sets</label>
              <input id="sets" name="sets" type="number" min={1} max={10} defaultValue={item.sets} className="input py-2 text-center" />
            </div>
            <div>
              <label className="label" htmlFor="reps">Reps</label>
              <input id="reps" name="reps" defaultValue={item.reps} maxLength={12} className="input py-2 text-center" />
            </div>
            <div>
              <label className="label" htmlFor="restSec">Rest</label>
              <select id="restSec" name="restSec" defaultValue={item.restSec} className="input px-2 py-2">
                {rest.map((s) => <option key={s} value={s}>{s < 60 ? `${s}s` : `${s / 60} min`}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary w-full py-2">Save</button>
        </form>

        <div className="grid grid-cols-3 gap-2">
          {i > 0 ? <ActionButton action={movePlanExercise.bind(null, d, i, -1)} className="btn-ghost py-2 text-sm">↑ Move up</ActionButton> : <span />}
          {i < day.exercises.length - 1 ? <ActionButton action={movePlanExercise.bind(null, d, i, 1)} className="btn-ghost py-2 text-sm">↓ Move down</ActionButton> : <span />}
          <ActionButton action={removePlanExercise.bind(null, d, i)} confirmText={`Remove ${ex?.name ?? "this exercise"} from ${day.name}?`} className="btn py-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40">
            Remove
          </ActionButton>
        </div>
      </section>

      <div>
        <h2 className="text-lg font-bold">Swap for another exercise</h2>
        <p className="text-sm muted">Keeps your sets and rest; the rep target adjusts to the new exercise.</p>
      </div>
      <AlternativesList
        recommended={recommended}
        sameMuscle={sameMuscle}
        muscle={ex?.primary[0]}
        screened={input.limitations.length > 0}
        libraryHref={`/exercises?planDay=${d}&replace=${i}`}
        actionFor={(id) => <ActionButton action={swapPlanExercise.bind(null, d, i, id)}>Use</ActionButton>}
      />
    </div>
  );
}
