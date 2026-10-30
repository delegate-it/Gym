"use server";

import { redirect } from "next/navigation";
import { createLoginCode, isValidEmail, normalizeEmail, signOut, verifyLoginCode } from "@/lib/auth";
import { mailConfigured, sendLoginCode } from "@/lib/mail";

export type LoginState = { step: "email" | "code"; email?: string; error?: string; devCode?: string };

export async function requestCode(_: LoginState, form: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(form.get("email") || ""));
  if (!isValidEmail(email)) return { step: "email", error: "Please enter a valid email address." };

  const code = await createLoginCode(email);
  if (!code) return { step: "email", email, error: "Too many attempts. Please wait a few minutes and try again." };

  try {
    await sendLoginCode(email, code);
  } catch (err) {
    console.error(err);
    return { step: "email", email, error: "We couldn't send the email. Please try again shortly." };
  }
  const showCode = !mailConfigured() && process.env.NODE_ENV !== "production";
  return { step: "code", email, devCode: showCode ? code : undefined };
}

export async function submitCode(_: LoginState, form: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(form.get("email") || ""));
  const code = String(form.get("code") || "").replace(/\D/g, "");
  if (code.length !== 6) return { step: "code", email, error: "Enter the 6-digit code from the email." };

  const ok = await verifyLoginCode(email, code);
  if (!ok) return { step: "code", email, error: "That code is wrong or has expired." };
  redirect("/today");
}

export async function logout() {
  await signOut();
  redirect("/");
}
