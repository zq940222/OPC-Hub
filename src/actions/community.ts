"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/points";

export type CommunityState = {
  success?: boolean;
  error?: string;
  postId?: string;
};

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return { error: "login_required" } as const;
  return { user: session.user } as const;
}

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUB_ADMIN")) {
    return { error: "admin_required" } as const;
  }
  return { session } as const;
}

function revalidateCommunity(slug?: string, postId?: string) {
  revalidatePath("/community");
  if (slug) revalidatePath(`/community/${slug}`);
  if (postId) revalidatePath(`/community/post/${postId}`);
}

export async function createPost(_state: CommunityState, formData: FormData): Promise<CommunityState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const boardId = String(formData.get("boardId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title) return { error: "title_required" };
  if (title.length > 80) return { error: "title_too_long" };
  if (!content) return { error: "content_required" };

  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { id: true, slug: true },
  });
  if (!board) return { error: "board_not_found" };

  const post = await db.post.create({
    data: {
      boardId,
      title,
      content,
      authorId: session.user.id,
    },
    include: { board: { select: { slug: true } } },
  });
  await awardPoints(session.user.id, 10, "create_post");

  revalidateCommunity(post.board.slug, post.id);
  revalidatePath(`/profile/${session.user.id}`);
  return { success: true, postId: post.id };
}

export async function createComment(postId: string, _state: CommunityState, formData: FormData): Promise<CommunityState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "content_required" };

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, board: { select: { slug: true } } },
  });
  if (!post) return { error: "post_not_found" };

  await db.comment.create({
    data: {
      postId,
      authorId: session.user.id,
      content,
    },
  });
  await awardPoints(session.user.id, 3, "create_comment");

  revalidateCommunity(post.board.slug, postId);
  return { success: true };
}

export async function likePost(postId: string): Promise<CommunityState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, board: { select: { slug: true } } },
  });
  if (!post) return { error: "post_not_found" };

  const existing = await db.postLike.findUnique({
    where: { userId_postId: { userId: session.user.id, postId } },
  });
  if (existing) return { success: true };

  await db.postLike.create({
    data: { userId: session.user.id, postId },
  });
  await db.post.update({
    where: { id: postId },
    data: { likeCount: { increment: 1 } },
  });
  if (post.authorId !== session.user.id) {
    await awardPoints(post.authorId, 2, "post_liked");
  }

  revalidateCommunity(post.board.slug, postId);
  return { success: true };
}

export async function reportContent(
  targetType: "POST" | "COMMENT",
  targetId: string,
  _state: CommunityState,
  formData: FormData,
): Promise<CommunityState> {
  const session = await requireUser();
  if ("error" in session) return { error: session.error };

  if (targetType !== "POST" && targetType !== "COMMENT") return { error: "invalid_target_type" };
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "reason_required" };

  await db.report.create({
    data: {
      reporterId: session.user.id,
      targetType,
      targetId,
      reason,
    },
  });
  revalidatePath("/admin");
  return { success: true };
}

export async function togglePostPinned(postId: string): Promise<CommunityState> {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, isPinned: true, board: { select: { slug: true } } },
  });
  if (!post) return { error: "post_not_found" };

  await db.post.update({
    where: { id: postId },
    data: { isPinned: !post.isPinned },
  });
  revalidateCommunity(post.board.slug, postId);
  return { success: true };
}

export async function togglePostFeatured(postId: string): Promise<CommunityState> {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, isFeatured: true, board: { select: { slug: true } } },
  });
  if (!post) return { error: "post_not_found" };

  const nextFeatured = !post.isFeatured;
  await db.post.update({
    where: { id: postId },
    data: { isFeatured: nextFeatured },
  });
  if (nextFeatured) {
    await awardPoints(post.authorId, 50, "post_featured");
  }

  revalidateCommunity(post.board.slug, postId);
  return { success: true };
}

export async function deletePost(postId: string): Promise<CommunityState> {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, board: { select: { slug: true } } },
  });
  if (!post) return { error: "post_not_found" };

  await db.post.delete({ where: { id: postId } });
  revalidateCommunity(post.board.slug);
  return { success: true };
}
