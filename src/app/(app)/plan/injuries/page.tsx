import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { injuryLabel, parseLimitations } from "@/lib/injuries";
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
          Describe what&apos;s going on: where it hurts, which movements are painful and how bad it is. We&apos;ll swap out exercises in your plan
          that could make it worse, and keep everything else as it is.
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
              : "We recognise common injury terms (e.g. tennis elbow, ACL, sciatica, rotator cuff) and phrases like “I can't do pulling”."}
          </p>
        </div>

        {current.length > 0 && !p.injuryNotes && (
          <p className="rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
            Currently avoiding exercises that load your <b>{current.map((l) => injuryLabel(l).toLowerCase()).join(", ")}</b> (from your setup).
            Describe your injury above to update this, or save with an empty description to clear it.
          </p>
        )}

        <SubmitButton pendingText={p.injuryNotes || aiEnabled ? "Analysing and updating your plan…" : "Updating your plan…"}>Update my plan</SubmitButton>
        <p className="text-xs muted">
          Recovered? Clear the description and save. To bring back the full exercise selection afterwards, use <b>Change plan → Fresh exercises</b>.
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
