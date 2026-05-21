"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type MessageState = {
  success?: boolean;
  error?: string;
};

export async function sendMessage(toId: string, _state: MessageState, formData: FormData): Promise<MessageState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "login_required" };
  if (session.user.id === toId) return { error: "self_message_forbidden" };

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "content_required" };

  const target = await db.user.findUnique({
    where: { id: toId },
    select: { id: true },
  });
  if (!target) return { error: "user_not_found" };

  await db.message.create({
    data: {
      fromId: session.user.id,
      toId,
      content,
    },
  });

  revalidatePath("/community/messages");
  revalidatePath(`/community/messages/${toId}`);
  return { success: true };
}
