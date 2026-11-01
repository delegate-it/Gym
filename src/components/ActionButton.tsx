"use client";

import { useTransition } from "react";

/** Runs a (bound) server action on click, with a pending state and optional confirmation. */
export function ActionButton({ action, children, className = "btn-primary px-3 py-2 text-sm", confirmText }: {
  action: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  confirmText?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        start(() => action());
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
