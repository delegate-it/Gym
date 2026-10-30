"use client";

import { useActionState } from "react";
import { requestCode, submitCode, type LoginState } from "@/app/actions/auth";

export function LoginForm() {
  const [emailState, sendAction, sending] = useActionState(requestCode, { step: "email" } as LoginState);
  const [codeState, verifyAction, verifying] = useActionState(submitCode, { step: "code" } as LoginState);

  if (emailState.step === "code") {
    const error = codeState.email === emailState.email ? codeState.error : undefined;
    return (
      <form action={verifyAction} className="space-y-3">
        <input type="hidden" name="email" value={emailState.email} />
        <p className="text-sm muted">
          We sent a 6-digit code to <span className="font-medium text-zinc-900 dark:text-zinc-100">{emailState.email}</span>.
        </p>
        {emailState.devCode && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Development mode (no email server set up): your code is <b className="tracking-widest">{emailState.devCode}</b>
          </p>
        )}
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          className="input text-center text-2xl tracking-[0.5em]"
          autoFocus
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={verifying}>{verifying ? "Checking…" : "Sign in"}</button>
        <button type="button" className="w-full text-sm muted underline" onClick={() => location.reload()}>
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form action={sendAction} className="space-y-3">
      <label className="label" htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="input" defaultValue={emailState.email} required />
      {emailState.error && <p className="text-sm text-red-600">{emailState.error}</p>}
      <button className="btn-primary w-full" disabled={sending}>{sending ? "Sending…" : "Continue with email"}</button>
      <p className="text-center text-xs muted">No password needed — we email you a sign-in code.</p>
    </form>
  );
}
