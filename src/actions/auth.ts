"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const MIN_PASSWORD_LENGTH = 6;

export async function register({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "请输入有效邮箱" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: "密码至少 6 位" };
  }

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { error: "该邮箱已注册" };
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      name: normalizedName || normalizedEmail,
      role: "OPC",
    },
  });

  return { success: true };
}
