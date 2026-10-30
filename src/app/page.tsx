import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.profile ? "/today" : "/onboarding");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-2xl">🏋️</div>
        <h1 className="text-3xl font-bold tracking-tight">Train smarter.<br />Keep it simple.</h1>
        <p className="mt-3 muted">
          Answer a few questions and get a training plan built on proven programs, nutrition targets that fit your goal,
          and an easy way to log every workout.
        </p>
      </div>
      <div className="card p-5">
        <LoginForm />
      </div>
      <ul className="mt-8 grid grid-cols-3 gap-3 text-center text-xs muted">
        <li className="card p-3"><div className="text-xl">📋</div>Personal plan</li>
        <li className="card p-3"><div className="text-xl">🥗</div>Nutrition</li>
        <li className="card p-3"><div className="text-xl">📈</div>Track progress</li>
      </ul>
    </main>
  );
}
