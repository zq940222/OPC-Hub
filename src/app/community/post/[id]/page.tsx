import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-session";
import { auth } from "@/auth";
import { createComment, deletePost, reportContent, togglePostFeatured, togglePostPinned } from "@/actions/community";
import { CommentForm } from "@/components/community/CommentForm";
import { LikeButton } from "@/components/community/LikeButton";
import { ReportButton } from "@/components/community/ReportButton";
import { db } from "@/lib/db";

export default async function PostDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  await db.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => null);

  const [post, adminSession] = await Promise.all([
    db.post.findUnique({
      where: { id },
      include: {
        board: { select: { name: true, slug: true } },
        author: { select: { id: true, name: true, email: true, points: true } },
        comments: {
          include: { author: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
        likes: {
          where: { userId: session.user.id },
          select: { userId: true },
        },
      },
    }),
    getAdminSession(),
  ]);

  if (!post) notFound();
  const isAdmin = Boolean(adminSession);

  async function pinAction() {
    "use server";
    await togglePostPinned(id);
  }

  async function featureAction() {
    "use server";
    await togglePostFeatured(id);
  }

  async function deleteAction() {
    "use server";
    await deletePost(id);
  }

  return (
    <main className="shell grid gap-6 py-8 md:py-12 lg:grid-cols-[1fr_320px]">
      <section className="grid gap-5">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/community/${post.board.slug}`} className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {post.board.name}
            </Link>
            {post.isPinned ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Pinned</span> : null}
            {post.isFeatured ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Featured</span> : null}
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 md:text-5xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <Link href={`/profile/${post.author.id}`} className="font-medium text-blue-700 hover:text-blue-900">
              {post.author.name ?? post.author.email ?? "OPC"}
            </Link>
            <span>{post.viewCount + 1} views</span>
            <span>{post.createdAt.toLocaleDateString("zh-CN")}</span>
          </div>
          <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-slate-700">{post.content}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <LikeButton postId={post.id} initialLiked={post.likes.length > 0} likeCount={post.likeCount} />
            <ReportButton action={reportContent.bind(null, "POST", post.id)} />
          </div>
        </article>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold text-slate-950">Comments</h2>
          {post.comments.map((comment) => (
            <article key={comment.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/profile/${comment.author.id}`} className="font-semibold text-blue-700 hover:text-blue-900">
                  {comment.author.name ?? comment.author.email ?? "OPC"}
                </Link>
                <span className="text-xs text-slate-500">{comment.createdAt.toLocaleDateString("zh-CN")}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p>
              <div className="mt-3">
                <ReportButton action={reportContent.bind(null, "COMMENT", comment.id)} />
              </div>
            </article>
          ))}
          <CommentForm action={createComment.bind(null, post.id)} />
        </section>
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Author</h2>
          <Link href={`/profile/${post.author.id}`} className="mt-3 block font-semibold text-blue-700 hover:text-blue-900">
            {post.author.name ?? post.author.email ?? "OPC"}
          </Link>
          <p className="mt-2 text-sm text-slate-500">{post.author.points} points</p>
          {post.author.id !== session.user.id ? (
            <Link href={`/community/messages/${post.author.id}`} className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Message
            </Link>
          ) : null}
        </section>

        {isAdmin ? (
          <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">Admin</h2>
            <form action={pinAction}>
              <button className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Toggle pinned</button>
            </form>
            <form action={featureAction}>
              <button className="focus-ring w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Toggle featured</button>
            </form>
            <form action={deleteAction}>
              <button className="focus-ring w-full rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete post</button>
            </form>
          </section>
        ) : null}
      </aside>
    </main>
  );
}
