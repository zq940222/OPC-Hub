import type { AdminRole } from "@prisma/client";

export type AdminPermissions = {
  users: boolean;
  orders: boolean;
  content: boolean;
  tools: boolean;
  announcements: boolean;
};

export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
  users: true,
  orders: true,
  content: true,
  tools: true,
  announcements: true,
};

export function hasAdminPermission(
  role: AdminRole,
  rawPermissions: unknown,
  key: keyof AdminPermissions,
) {
  if (role === "ADMIN") return true;
  const permissions = rawPermissions as Partial<AdminPermissions> | null;
  return permissions?.[key] === true;
}
