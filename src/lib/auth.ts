import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

const SESSION_COOKIE = "gym_session";
const SESSION_DAYS = 60;
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_WINDOW = 5;

function hash(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret || "dev-secret").update(value).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Creates a 6-digit login code. Returns null when the email is rate limited. */
export async function createLoginCode(email: string) {
  const windowStart = new Date(Date.now() - 15 * 60 * 1000);
  const recent = await db.loginCode.count({ where: { email, createdAt: { gte: windowStart } } });
  if (recent >= MAX_CODES_PER_WINDOW) return null;

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.loginCode.create({
    data: { email, codeHash: hash(`${email}:${code}`), expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000) },
  });
  return code;
}

/** Checks a login code and, if valid, signs the user in. */
export async function verifyLoginCode(email: string, code: string) {
  const entry = await db.loginCode.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!entry || entry.attempts >= MAX_ATTEMPTS) return false;

  const expected = Buffer.from(entry.codeHash, "hex");
  const actual = Buffer.from(hash(`${email}:${code.trim()}`), "hex");
  if (!timingSafeEqual(expected, actual)) {
    await db.loginCode.update({ where: { id: entry.id }, data: { attempts: { increment: 1 } } });
    return false;
  }

  await db.loginCode.deleteMany({ where: { email } });
  const user = await db.user.upsert({ where: { email }, update: {}, create: { email } });

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: hash(token), userId: user.id, expiresAt } });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return true;
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: { include: { profile: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

/** For pages and actions that need a signed-in user with a finished profile. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!user.profile) redirect("/onboarding");
  return { ...user, profile: user.profile };
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(SESSION_COOKIE);
}
