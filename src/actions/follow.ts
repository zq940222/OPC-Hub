"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type FollowActionState = {
  success?: boolean;
  error?: string;
  following?: boolean;
};

export async function toggleFollow(targetUserId: string): Promise<FollowActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "login_required" };
  if (session.user.id === targetUserId) return { error: "self_follow_forbidden" };

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  if (!target) return { error: "user_not_found" };

  const where = {
    followerId_followingId: {
      followerId: session.user.id,
      followingId: targetUserId,
    },
  };
  const existing = await db.follow.findUnique({ where });

  if (existing) {
    await db.follow.delete({ where });
    revalidatePath(`/profile/${targetUserId}`);
    revalidatePath(`/profile/${session.user.id}`);
    return { success: true, following: false };
  }

  await db.follow.create({
    data: {
      followerId: session.user.id,
      followingId: targetUserId,
    },
  });
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath(`/profile/${session.user.id}`);
  return { success: true, following: true };
}
