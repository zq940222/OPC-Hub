"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ORDER_TAG_LIMIT, ORDER_TAGS } from "@/lib/constants";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/points";

export type OrderActionState = {
  success?: boolean;
  error?: string;
  orderId?: string;
};

const EDITABLE_STATUSES = ["DRAFT", "PENDING_REVIEW", "REJECTED"] as const;

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseTags(formData: FormData) {
  const knownTags = new Set<string>(ORDER_TAGS);
  const rawTags = formData.getAll("tags").flatMap((tag) =>
    String(tag)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

  return Array.from(new Set(rawTags.filter((tag) => knownTags.has(tag)))).slice(0, ORDER_TAG_LIMIT);
}

function parseDeadline(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function revalidateOrderPaths(orderId?: string) {
  revalidatePath("/orders");
  revalidatePath("/dashboard/orders");
  if (orderId) {
    revalidatePath(`/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}/edit`);
  }
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return { error: "login_required" } as const;
  return { user: session.user } as const;
}

function buildOrderData(formData: FormData) {
  const title = textValue(formData, "title");
  const description = textValue(formData, "description");
  const category = textValue(formData, "category");
  const amount = textValue(formData, "amount");
  const contact = textValue(formData, "contact");
  const deadline = parseDeadline(textValue(formData, "deadline"));
  const tags = parseTags(formData);

  if (!title) return { error: "title_required" } as const;
  if (!description) return { error: "description_required" } as const;
  if (!category) return { error: "category_required" } as const;
  if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return { error: "valid_amount_required" } as const;
  }

  return {
    data: {
      title,
      description,
      amount,
      category,
      tags,
      contact: contact || null,
      deadline,
    },
  } as const;
}

export async function createOrder(_state: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };
  if (session.user.role !== "BIZ_OPC") return { error: "biz_opc_required" };

  const parsed = buildOrderData(formData);
  if ("error" in parsed) return { error: parsed.error };

  const order = await db.order.create({
    data: {
      ...parsed.data,
      status: "PENDING_REVIEW",
      authorId: session.user.id,
    },
  });

  revalidateOrderPaths(order.id);
  return { success: true, orderId: order.id };
}

export async function updateOrder(orderId: string, _state: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, authorId: true, status: true },
  });
  if (!order) return { error: "order_not_found" };
  if (order.authorId !== session.user.id) return { error: "order_forbidden" };
  if (!EDITABLE_STATUSES.includes(order.status as (typeof EDITABLE_STATUSES)[number])) {
    return { error: "order_not_editable" };
  }

  const parsed = buildOrderData(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db.order.update({
    where: { id: orderId },
    data: {
      ...parsed.data,
      status: "PENDING_REVIEW",
      rejectReason: null,
    },
  });

  revalidateOrderPaths(orderId);
  return { success: true, orderId };
}

export async function closeOrder(orderId: string): Promise<OrderActionState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, authorId: true, status: true },
  });
  if (!order) return { error: "order_not_found" };
  if (order.authorId !== session.user.id) return { error: "order_forbidden" };
  if (order.status !== "PENDING_REVIEW" && order.status !== "RECRUITING") {
    return { error: "order_not_closeable" };
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: "CLOSED" },
  });

  revalidateOrderPaths(orderId);
  return { success: true, orderId };
}

export async function completeOrder(orderId: string): Promise<OrderActionState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      authorId: true,
      status: true,
      applications: {
        where: { status: "ACCEPTED" },
        select: { applicantId: true, status: true },
        take: 1,
      },
    },
  });
  if (!order) return { error: "order_not_found" };
  if (order.authorId !== session.user.id) return { error: "order_forbidden" };
  if (order.status !== "IN_PROGRESS") return { error: "order_not_in_progress" };

  const acceptedApplication = order.applications[0];
  if (!acceptedApplication) return { error: "accepted_application_required" };

  await db.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED" },
  });
  await awardPoints(acceptedApplication.applicantId, 100, "complete_order");

  revalidateOrderPaths(orderId);
  revalidatePath(`/profile/${acceptedApplication.applicantId}`);
  return { success: true, orderId };
}
