"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type ApplicationActionState = {
  success?: boolean;
  error?: string;
};

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return { error: "login_required" } as const;
  return { user: session.user } as const;
}

function revalidateApplicationPaths(orderId?: string) {
  revalidatePath("/orders");
  revalidatePath("/dashboard/orders");
  if (orderId) revalidatePath(`/orders/${orderId}`);
}

export async function applyToOrder(
  orderId: string,
  _state: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "reason_required" };
  if (reason.length > 300) return { error: "reason_too_long" };

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      authorId: true,
      status: true,
      applications: {
        where: { applicantId: session.user.id },
        select: { applicantId: true },
      },
    },
  });
  if (!order) return { error: "order_not_found" };
  if (order.authorId === session.user.id) return { error: "own_order" };
  if (order.status !== "RECRUITING") return { error: "order_not_recruiting" };
  if (order.applications.length > 0) return { error: "duplicate_application" };

  await db.orderApplication.create({
    data: {
      orderId,
      applicantId: session.user.id,
      reason,
    },
  });

  revalidateApplicationPaths(orderId);
  return { success: true };
}

export async function acceptApplication(applicationId: string): Promise<ApplicationActionState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const application = await db.orderApplication.findUnique({
    where: { id: applicationId },
    include: {
      order: {
        select: { id: true, authorId: true, status: true },
      },
    },
  });
  if (!application) return { error: "application_not_found" };
  if (application.order.authorId !== session.user.id) return { error: "application_forbidden" };
  if (application.order.status !== "RECRUITING") return { error: "order_not_recruiting" };
  if (application.status !== "PENDING") return { error: "application_already_handled" };

  await db.orderApplication.update({
    where: { id: applicationId },
    data: { status: "ACCEPTED" },
  });
  await db.order.update({
    where: { id: application.order.id },
    data: { status: "IN_PROGRESS" },
  });

  revalidateApplicationPaths(application.order.id);
  return { success: true };
}

export async function rejectApplication(applicationId: string): Promise<ApplicationActionState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const application = await db.orderApplication.findUnique({
    where: { id: applicationId },
    include: {
      order: {
        select: { id: true, authorId: true, status: true },
      },
    },
  });
  if (!application) return { error: "application_not_found" };
  if (application.order.authorId !== session.user.id) return { error: "application_forbidden" };
  if (application.status !== "PENDING") return { error: "application_already_handled" };

  await db.orderApplication.update({
    where: { id: applicationId },
    data: { status: "REJECTED" },
  });

  revalidateApplicationPaths(application.order.id);
  return { success: true };
}
