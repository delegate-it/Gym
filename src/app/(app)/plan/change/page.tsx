import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { splitOptions } from "@/lib/planner";
import { getActivePlanRecord } from "@/lib/plans";
import { rebuildPlan } from "@/app/actions/plan";
import { ActionButton } from "@/components/ActionButton";

export default async function ChangePlan() {
  const user = await requireUser();
  const record = await getActivePlanRecord(user.id);
  if (!record) redirect("/profile");
  const { plan } = record;
  const splits = splitOptions(user.profile.daysPerWeek);
  const days = user.profile.daysPerWeek;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/plan" className="text-sm muted">‹ Plan</Link>
        <h1 className="text-2xl font-bold">Change my plan</h1>
        <p className="text-sm muted">Your workout history and personal bests are always kept.</p>
      </div>

      {plan.edited && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          You&apos;ve edited this plan by hand. Building a new plan replaces those edits. To change one exercise instead, go back and tap it.
        </p>
      )}

      <section className="card space-y-3">
        <div>
          <h2 className="font-bold">🔄 Fresh exercises</h2>
          <p className="text-sm muted">Same structure and main lifts, a new selection of supporting exercises. Good when you&apos;re bored or progress has stalled.</p>
        </div>
        <ActionButton action={rebuildPlan.bind(null, "fresh")} className="btn-primary w-full py-2">Give me fresh exercises</ActionButton>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="font-bold">🗓️ A different training split</h2>
          <p className="text-sm muted">How your {days} training days are organised.</p>
        </div>
        <ul className="space-y-2">
          {splits.map((s) => {
            const current = s.id === plan.splitId;
            return (
              <li key={s.id} className={`rounded-xl border-2 p-3 ${current ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-zinc-200 dark:border-zinc-800"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm muted">{s.description}</p>
                    <p className="mt-1 text-xs muted">Based on: {s.basedOn}</p>
                  </div>
                  {current
                    ? <span className="chip shrink-0">Current</span>
                    : <ActionButton action={rebuildPlan.bind(null, s.id)} className="btn-ghost shrink-0 px-3 py-2 text-sm">Switch</ActionButton>}
                </div>
              </li>
            );
          })}
        </ul>
        {splits.length === 1 && <p className="text-xs muted">With {days} days a week this is the best fit. Change your training days to see other splits.</p>}
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="font-bold">✏️ Change my answers</h2>
          <p className="text-sm muted">Different goal, days per week, session length, equipment or problem areas.</p>
        </div>
        <Link href="/profile" className="btn-ghost w-full py-2">Update my answers</Link>
      </section>
    </div>
  );
}
