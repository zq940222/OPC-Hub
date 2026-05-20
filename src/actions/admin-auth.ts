"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearAdminSession, getAdminSession, setAdminSession } from "@/lib/admin-session";

export type AdminLoginState = {
  error?: string;
};

export type CreateSubAdminState = {
  error?: string;
  success?: string;
};

export async function loginAdmin(
  _state: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "请输入管理员邮箱和密码" };
  }

  const admin = await db.admin.findUnique({ where: { email } });
  if (!admin) {
    return { error: "管理员账号或密码错误" };
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    return { error: "管理员账号或密码错误" };
  }

  await setAdminSession({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createSubAdmin(
  _state: CreateSubAdminState,
  formData: FormData,
): Promise<CreateSubAdminState> {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "只有主管理员可以创建后台子账号" };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "请输入有效的子账号邮箱" };
  }

  if (!name) {
    return { error: "请输入子账号名称" };
  }

  if (password.length < 6) {
    return { error: "密码至少 6 位" };
  }

  const existing = await db.admin.findUnique({ where: { email } });
  if (existing) {
    return { error: "该管理员邮箱已存在" };
  }

  const hashed = await bcrypt.hash(password, 12);
  await db.admin.create({
    data: {
      email,
      name,
      password: hashed,
      role: "SUB_ADMIN",
      subAccount: {
        create: {
          createdById: session.id,
          permissions: {
            modules: ["users", "orders", "content"],
          },
        },
      },
    },
  });

  revalidatePath("/admin");
  return { success: "子账号已创建" };
}
