"use server";

import type { AdminPermissions } from "@/lib/permissions";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { hasAdminPermission } from "@/lib/permissions";

export type AdminActionState = {
  success?: boolean;
  error?: string;
};

export async function requireAdminPermission(key: keyof AdminPermissions) {
  const session = await getAdminSession();
  if (!session) return { error: "admin_login_required" } as const;

  const admin = await db.admin.findUnique({
    where: { id: session.id },
    include: { subAccount: true },
  });
  if (!admin) return { error: "admin_not_found" } as const;
  if (!hasAdminPermission(admin.role, admin.subAccount?.permissions ?? null, key)) {
    return { error: "permission_denied" } as const;
  }

  return { admin } as const;
}
