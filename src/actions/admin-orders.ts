"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminPermission } from "@/actions/admin-shared";

async function requireAdminReviewer() {
  const auth = await requireAdminPermission("orders");
  if ("error" in auth) {
    throw new Error("Unauthorized");
  }
  return auth.admin;
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
