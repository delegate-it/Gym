import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const initial = (user.profile.name || user.email).charAt(0).toUpperCase();
  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/today" className="flex items-center gap-2 font-bold"><span className="text-xl">🏋️</span> GymWise</Link>
          <Link href="/profile" aria-label="Profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 font-semibold text-white dark:text-zinc-950">{initial}</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>
      <NavBar />
    </div>
  );
}
