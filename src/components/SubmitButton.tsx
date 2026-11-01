"use client";

import { useFormStatus } from "react-dom";

/** A form submit button that shows a pending label while the server action runs. */
export function SubmitButton({ children, pendingText, className = "btn-primary w-full" }: { children: React.ReactNode; pendingText: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending}>{pending ? pendingText : children}</button>;
}
