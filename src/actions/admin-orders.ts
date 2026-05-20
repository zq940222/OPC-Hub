"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

async function requireAdminReviewer() {
  const session = await getAdminSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUB_ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function approveOrder(formData: FormData) {
  await requireAdminReviewer();

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;

  await db.order.update({
    where: { id: orderId, status: "PENDING_REVIEW" },
    data: {
      status: "RECRUITING",
      rejectReason: null,
    },
  });

  revalidatePath("/admin");
}

export async function rejectOrder(formData: FormData) {
  await requireAdminReviewer();

  const orderId = String(formData.get("orderId") ?? "");
  const rejectReason = String(formData.get("rejectReason") ?? "").trim();
  if (!orderId || !rejectReason) return;

  await db.order.update({
    where: { id: orderId, status: "PENDING_REVIEW" },
    data: {
      status: "REJECTED",
      rejectReason,
    },
  });

  revalidatePath("/admin");
}
