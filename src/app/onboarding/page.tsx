import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";

export default async function Onboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.profile) redirect("/today");

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <p className="mb-6 text-sm muted">Let&apos;s build your plan. It takes about a minute.</p>
      <ProfileForm />
    </main>
  );
}
