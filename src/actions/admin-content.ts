"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { type AdminActionState, requireAdminPermission } from "@/actions/admin-shared";

export async function resolveReport(reportId: string): Promise<AdminActionState> {
  const auth = await requireAdminPermission("content");
  if ("error" in auth) return { error: auth.error };

  await db.report.update({
    where: { id: reportId },
    data: { resolved: true },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteReportedContent(reportId: string): Promise<AdminActionState> {
  const auth = await requireAdminPermission("content");
  if ("error" in auth) return { error: auth.error };

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, targetType: true, targetId: true },
  });
  if (!report) return { error: "report_not_found" };

  if (report.targetType === "POST") {
    await db.post.delete({ where: { id: report.targetId } });
  } else if (report.targetType === "COMMENT") {
    await db.comment.delete({ where: { id: report.targetId } });
  } else {
    return { error: "unsupported_report_target" };
  }

  await db.report.update({
    where: { id: reportId },
    data: { resolved: true },
  });

  revalidatePath("/admin");
  revalidatePath("/community");
  return { success: true };
}
