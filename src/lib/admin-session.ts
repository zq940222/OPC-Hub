import crypto from "crypto";
import { cookies } from "next/headers";
import type { AdminRole } from "@prisma/client";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-constants";

const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  exp: number;
};

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("后台会话需要配置 NEXTAUTH_SECRET。");
  return secret;
}

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createAdminToken(session: Omit<AdminSession, "exp">) {
  const payload = JSON.stringify({
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const encoded = base64url(payload);
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminToken(token: string | undefined): AdminSession | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    if (!session.id || !session.email || !session.name) return null;
    if (session.role !== "ADMIN" && session.role !== "SUB_ADMIN") return null;

    return session;
  } catch {
    return null;
  }
}

export async function setAdminSession(session: Omit<AdminSession, "exp">) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
