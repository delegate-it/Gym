import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { INJURY_AREAS, parseLimitations } from "@/lib/injuries";
import { MAX_DESCRIPTION, parseInjuryInfo } from "@/lib/injury-analysis";
import { updateInjuries } from "@/app/actions/profile";
import { InjuryInfo } from "@/components/InjuryInfo";
import { SubmitButton } from "@/components/SubmitButton";

export default async function InjuriesPage() {
  const user = await requireUser();
  const p = user.profile;
  const current = parseLimitations(p.limitations);
  const info = parseInjuryInfo(p.injuryInfo);
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/plan" className="text-sm muted">‹ Plan</Link>
        <h1 className="text-2xl font-bold">Injured or in pain?</h1>
        <p className="text-sm muted">
          Describe what&apos;s going on and tick the areas that hurt. We&apos;ll swap out exercises in your plan that could make it worse,
          and keep everything else as it is.
        </p>
      </div>

      <form action={updateInjuries} className="space-y-5">
        <div>
          <label className="label" htmlFor="injuryNotes">Describe your injury</label>
          <textarea
            id="injuryNotes"
            name="injuryNotes"
            rows={4}
            maxLength={MAX_DESCRIPTION}
            defaultValue={p.injuryNotes}
            placeholder="e.g. Tennis elbow in my right arm — gripping and curls hurt. Or: knee surgery (meniscus) 3 months ago, deep squats still painful."
            className="input"
          />
          <p className="mt-1 text-xs muted">
            {aiEnabled
              ? "Your description is analysed by Claude, an AI model from Anthropic, to adjust your plan. Don't include your name or other personal details."
              : "We recognise common injury terms (e.g. tennis elbow, ACL, sciatica, rotator cuff). Also tick the areas below."}
          </p>
        </div>

        <div>
          <p className="label">Areas that hurt</p>
          <div className="grid grid-cols-2 gap-2">
            {INJURY_AREAS.map(({ id, label }) => (
              <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-zinc-200 bg-white p-3 font-medium has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:border-zinc-800 dark:bg-zinc-900 dark:has-[:checked]:bg-brand-500/10">
                <input type="checkbox" name="limitations" value={id} defaultChecked={current.includes(id)} className="h-5 w-5 accent-brand-500" />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs muted">Areas found in your description are added automatically.</p>
        </div>

        <SubmitButton pendingText={p.injuryNotes || aiEnabled ? "Analysing and updating your plan…" : "Updating your plan…"}>Update my plan</SubmitButton>
        <p className="text-xs muted">
          Recovered? Clear the description, untick the areas and save. To bring back the full exercise selection afterwards, use <b>Change plan → Fresh exercises</b>.
        </p>
      </form>

      {info && p.injuryNotes && (
        <section className="card">
          <h2 className="mb-2 font-bold">What we understood</h2>
          <InjuryInfo info={info} avoidIds={p.injuryAvoid.split(",").filter(Boolean)} />
        </section>
      )}

      <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        This is general guidance, not medical advice. For a recent, severe or worsening injury, see a physiotherapist or doctor before training,
        and stop any exercise that causes pain.
      </p>
    </div>
  );
}
