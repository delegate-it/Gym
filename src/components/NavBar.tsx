"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/today", label: "Today", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/plan", label: "Plan", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { href: "/exercises", label: "Exercises", icon: "M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" },
  { href: "/nutrition", label: "Food", icon: "M12 21c-4.4 0-8-3.6-8-8 0-3 2-5 4-5 1.5 0 2.5 1 4 1s2.5-1 4-1c2 0 4 2 4 5 0 4.4-3.6 8-8 8zM12 9V5m0 0c0-1 1-2 3-2" },
  { href: "/progress", label: "Progress", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" },
];

export function NavBar() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <ul className="mx-auto flex max-w-2xl">
        {ITEMS.map((item) => {
          const active = path === item.href || path.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1">
              <Link href={item.href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? "text-brand-600 dark:text-brand-400" : "text-zinc-500"}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
