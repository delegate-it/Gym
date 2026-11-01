import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { INJURY_AREAS, parseLimitations } from "@/lib/injuries";
import { updateInjuries } from "@/app/actions/profile";

export default async function InjuriesPage() {
  const user = await requireUser();
  const current = parseLimitations(user.profile.limitations);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/plan" className="text-sm muted">‹ Plan</Link>
        <h1 className="text-2xl font-bold">Injured or in pain?</h1>
        <p className="text-sm muted">
          Tap the areas that hurt. We&apos;ll swap out exercises in your plan that load them, and keep everything else as it is.
        </p>
      </div>

      <form action={updateInjuries} className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {INJURY_AREAS.map(({ id, label }) => (
            <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-zinc-200 bg-white p-3 font-medium has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:border-zinc-800 dark:bg-zinc-900 dark:has-[:checked]:bg-brand-500/10">
              <input type="checkbox" name="limitations" value={id} defaultChecked={current.includes(id)} className="h-5 w-5 accent-brand-500" />
              {label}
            </label>
          ))}
        </div>
        <button className="btn-primary w-full">Update my plan</button>
        <p className="text-xs muted">
          Recovered? Untick the area and save. To bring back the full exercise selection afterwards, use <b>Change plan → Fresh exercises</b>.
        </p>
      </form>

      <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        This is general guidance, not medical advice. For a recent, severe or worsening injury, see a physiotherapist or doctor before training,
        and stop any exercise that causes pain.
      </p>
    </div>
  );
}
