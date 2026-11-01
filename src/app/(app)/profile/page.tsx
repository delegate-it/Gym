import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import Link from "next/link";
import { deleteAccount } from "@/app/actions/profile";
import { ProfileForm } from "@/components/ProfileForm";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function ProfilePage() {
  const user = await requireUser();
  const p = user.profile;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="text-sm muted">{user.email}</p>
      </div>

      <div className="card">
        <ProfileForm
          isEdit
          initial={{
            name: p.name ?? "", sex: p.sex, age: String(p.age), heightCm: String(p.heightCm), weightKg: String(p.weightKg),
            units: p.units as "kg" | "lb", goal: p.goal, experience: p.experience, daysPerWeek: p.daysPerWeek, sessionMin: p.sessionMin,
            equipment: p.equipment, limitations: p.limitations.split(",").filter(Boolean), activity: p.activity, diet: p.diet, mealsPerDay: p.mealsPerDay,
          }}
        />
      </div>

      <div className="space-y-2">
        <Link href="/plan/change" className="btn-ghost w-full">Change my plan (fresh exercises or a different split)</Link>
        <form action={logout}><button className="btn-ghost w-full">Sign out</button></form>
        <form action={deleteAccount}>
          <ConfirmButton message="Delete your account and all your data? This can't be undone." className="w-full py-3 text-sm text-red-600">
            Delete my account
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
