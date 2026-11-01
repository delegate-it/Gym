"use client";

import { useActionState, useState } from "react";
import { saveProfile } from "@/app/actions/profile";
import { INJURY_AREAS } from "@/lib/injuries";

type Values = {
  name: string; sex: string; age: string; heightCm: string; weightKg: string; units: "kg" | "lb";
  goal: string; experience: string; daysPerWeek: number; sessionMin: number; equipment: string;
  limitations: string[]; injuryNotes: string; activity: string; diet: string; mealsPerDay: number;
};

const DEFAULTS: Values = {
  name: "", sex: "", age: "", heightCm: "", weightKg: "", units: "kg", goal: "", experience: "",
  daysPerWeek: 3, sessionMin: 60, equipment: "", limitations: [], injuryNotes: "", activity: "", diet: "none", mealsPerDay: 3,
};

type Choice = { value: string; label: string; hint?: string; icon?: string };

function Choices({ options, value, onChange, cols = 1 }: { options: Choice[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-1"}`}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl border-2 p-3 text-left transition ${value === o.value ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"}`}
        >
          <div className="font-semibold">{o.icon && <span className="mr-2">{o.icon}</span>}{o.label}</div>
          {o.hint && <div className="mt-0.5 text-sm muted">{o.hint}</div>}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, min, max, step = 1, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      <button type="button" className="btn-ghost h-11 w-11 p-0 text-xl" onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <span className="text-lg font-semibold">{value} {suffix}</span>
      <button type="button" className="btn-ghost h-11 w-11 p-0 text-xl" onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  );
}

const Q = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2"><h3 className="font-semibold">{title}</h3>{children}</div>
);

export function ProfileForm({ initial, isEdit = false, aiEnabled = false }: { initial?: Partial<Values>; isEdit?: boolean; aiEnabled?: boolean }) {
  const [v, setV] = useState<Values>({ ...DEFAULTS, ...initial });
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(saveProfile, {});
  const set = <K extends keyof Values>(k: K) => (val: Values[K]) => setV((p) => ({ ...p, [k]: val }));

  // Imperial helpers: store metric, show imperial.
  const imperial = v.units === "lb";
  const totalIn = v.heightCm ? Math.round(Number(v.heightCm) / 2.54) : 0;
  const [ft, inch] = [Math.floor(totalIn / 12), totalIn % 12];
  const shownWeight = v.weightKg ? (imperial ? Math.round(Number(v.weightKg) * 2.20462) : Number(v.weightKg)) : "";

  const steps = [
    {
      title: "About you",
      valid: v.sex && Number(v.age) > 0 && Number(v.heightCm) > 0 && Number(v.weightKg) > 0,
      body: (
        <div className="space-y-4">
          <div>
            <label className="label">First name (optional)</label>
            <input className="input" value={v.name} onChange={(e) => set("name")(e.target.value)} maxLength={60} />
          </div>
          <Q title="Sex"><Choices cols={2} value={v.sex} onChange={set("sex")} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} /></Q>
          <Q title="Units"><Choices cols={2} value={v.units} onChange={(u) => set("units")(u as "kg" | "lb")} options={[{ value: "kg", label: "Metric (kg, cm)" }, { value: "lb", label: "Imperial (lb, ft)" }]} /></Q>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Age</label>
              <input className="input" inputMode="numeric" value={v.age} onChange={(e) => set("age")(e.target.value.replace(/\D/g, ""))} placeholder="30" />
            </div>
            <div>
              <label className="label">Weight ({v.units})</label>
              <input
                className="input" inputMode="decimal" value={shownWeight} placeholder={imperial ? "170" : "75"}
                onChange={(e) => { const n = Number(e.target.value); set("weightKg")(e.target.value === "" ? "" : String(imperial ? n / 2.20462 : n)); }}
              />
            </div>
          </div>
          {imperial ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Height (ft)</label><input className="input" inputMode="numeric" value={totalIn ? ft : ""} onChange={(e) => set("heightCm")(String((Number(e.target.value) * 12 + inch) * 2.54))} placeholder="5" /></div>
              <div><label className="label">Height (in)</label><input className="input" inputMode="numeric" value={totalIn ? inch : ""} onChange={(e) => set("heightCm")(String((ft * 12 + Number(e.target.value)) * 2.54))} placeholder="10" /></div>
            </div>
          ) : (
            <div><label className="label">Height (cm)</label><input className="input" inputMode="numeric" value={v.heightCm ? Math.round(Number(v.heightCm)) : ""} onChange={(e) => set("heightCm")(e.target.value.replace(/\D/g, ""))} placeholder="175" /></div>
          )}
        </div>
      ),
    },
    {
      title: "What's your main goal?",
      valid: !!v.goal,
      body: (
        <Choices value={v.goal} onChange={set("goal")} options={[
          { value: "muscle", icon: "💪", label: "Build muscle", hint: "Look more muscular and toned" },
          { value: "fat_loss", icon: "🔥", label: "Lose fat", hint: "Drop body fat while keeping muscle" },
          { value: "strength", icon: "🏋️", label: "Get stronger", hint: "Lift heavier on the big lifts" },
          { value: "fitness", icon: "❤️", label: "General fitness", hint: "Feel fit, healthy and energetic" },
        ]} />
      ),
    },
    {
      title: "Your training",
      valid: !!v.experience,
      body: (
        <div className="space-y-5">
          <Q title="How experienced are you?">
            <Choices value={v.experience} onChange={set("experience")} options={[
              { value: "beginner", label: "Beginner", hint: "New, or less than 6 months of consistent training" },
              { value: "intermediate", label: "Intermediate", hint: "6 months to 2 years of regular training" },
              { value: "advanced", label: "Advanced", hint: "2+ years and know the main lifts well" },
            ]} />
          </Q>
          <Q title="Days per week you can train"><Stepper value={v.daysPerWeek} onChange={set("daysPerWeek")} min={2} max={6} suffix="days" /></Q>
          <Q title="Time per session"><Stepper value={v.sessionMin} onChange={set("sessionMin")} min={30} max={90} step={15} suffix="min" /></Q>
        </div>
      ),
    },
    {
      title: "Equipment & injuries",
      valid: !!v.equipment,
      body: (
        <div className="space-y-5">
          <Q title="Where will you train?">
            <Choices value={v.equipment} onChange={set("equipment")} options={[
              { value: "gym", icon: "🏢", label: "Full gym", hint: "Barbells, machines, cables" },
              { value: "dumbbells", icon: "🏠", label: "Home with dumbbells", hint: "Dumbbells and a bench" },
              { value: "bodyweight", icon: "🤸", label: "Bodyweight only", hint: "No equipment" },
            ]} />
          </Q>
          <Q title="Any injuries or pain? (optional)">
            <div className="flex flex-wrap gap-2">
              {INJURY_AREAS.map(({ id, label }) => {
                const on = v.limitations.includes(id);
                return (
                  <button type="button" key={id}
                    onClick={() => set("limitations")(on ? v.limitations.filter((l) => l !== id) : [...v.limitations, id])}
                    className={`rounded-full border-2 px-4 py-2 text-sm font-medium ${on ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-zinc-200 dark:border-zinc-800"}`}>
                    {on ? "✓ " : ""}{label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={v.injuryNotes}
              onChange={(e) => set("injuryNotes")(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Describe it (optional), e.g. “tennis elbow, gripping hurts” or “ACL surgery 6 months ago”"
              className="input text-sm"
            />
            <p className="text-xs muted">We&apos;ll leave out exercises that could make it worse and pick safer ones.{aiEnabled ? " Your description is analysed by AI (Claude)." : ""} You can update this any time.</p>
          </Q>
        </div>
      ),
    },
    {
      title: "Lifestyle & food",
      valid: !!v.activity,
      body: (
        <div className="space-y-5">
          <Q title="Outside the gym, how active are you?">
            <Choices value={v.activity} onChange={set("activity")} options={[
              { value: "sedentary", label: "Mostly sitting", hint: "Desk job, little walking" },
              { value: "light", label: "Lightly active", hint: "Some walking during the day" },
              { value: "active", label: "Active", hint: "On your feet most of the day" },
              { value: "very_active", label: "Very active", hint: "Physical job" },
            ]} />
          </Q>
          <Q title="Diet">
            <Choices cols={3} value={v.diet} onChange={set("diet")} options={[{ value: "none", label: "Anything" }, { value: "vegetarian", label: "Vegetarian" }, { value: "vegan", label: "Vegan" }]} />
          </Q>
          <Q title="Meals per day"><Stepper value={v.mealsPerDay} onChange={set("mealsPerDay")} min={2} max={6} suffix="meals" /></Q>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <form action={action} className="space-y-6">
      {Object.entries(v).map(([k, val]) =>
        Array.isArray(val) ? val.map((x) => <input key={k + x} type="hidden" name={k} value={x} />) : <input key={k} type="hidden" name={k} value={String(val)} />,
      )}

      <div>
        <div className="mb-3 flex gap-1.5">
          {steps.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand-500" : "bg-zinc-200 dark:bg-zinc-800"}`} />)}
        </div>
        <p className="text-sm muted">Step {step + 1} of {steps.length}</p>
        <h2 className="text-2xl font-bold">{current.title}</h2>
      </div>

      {current.body}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-3">
        {step > 0 && <button type="button" className="btn-ghost flex-1" onClick={() => setStep(step - 1)}>Back</button>}
        {last ? (
          <button className="btn-primary flex-[2]" disabled={!current.valid || pending}>
            {pending ? "Building your plan…" : isEdit ? "Save & update plan" : "Build my plan"}
          </button>
        ) : (
          <button type="button" className="btn-primary flex-[2]" disabled={!current.valid} onClick={() => setStep(step + 1)}>Next</button>
        )}
      </div>
    </form>
  );
}
