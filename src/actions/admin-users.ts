"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { type AdminActionState, requireAdminPermission } from "@/actions/admin-shared";

export async function updateUserRole(userId: string, role: "OPC" | "BIZ_OPC"): Promise<AdminActionState> {
  const auth = await requireAdminPermission("users");
  if ("error" in auth) return { error: auth.error };
  if (role !== "OPC" && role !== "BIZ_OPC") return { error: "invalid_role" };

  await db.user.update({
    where: { id: userId },
    data: { role: role as Role },
  });

  revalidatePath("/admin");
  revalidatePath(`/profile/${userId}`);
  return { success: true };
}

export async function toggleUserBanned(userId: string): Promise<AdminActionState> {
  const auth = await requireAdminPermission("users");
  if ("error" in auth) return { error: auth.error };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, banned: true },
  });
  if (!user) return { error: "user_not_found" };

  await db.user.update({
    where: { id: userId },
    data: { banned: !user.banned },
  });

  revalidatePath("/admin");
  return { success: true };
}
