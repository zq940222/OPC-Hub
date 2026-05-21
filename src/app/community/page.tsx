import Link from "next/link";
import { BoardGrid } from "@/components/community/BoardGrid";
import { PostCard } from "@/components/community/PostCard";
import { db } from "@/lib/db";

export default async function CommunityPage() {
  const [boards, hotPosts] = await Promise.all([
    db.board.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { order: "asc" },
    }),
    db.post.findMany({
      where: { isFeatured: true },
      include: {
        board: { select: { name: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
  ]);

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <p className="text-sm font-semibold text-teal-700">Community</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">Share experience and ask questions</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">Boards, posts, comments, likes, reports, and private messages for OPC collaboration.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/community/post/new" className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            New post
          </Link>
          <Link href="/community/messages" className="focus-ring rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Messages
          </Link>
        </div>
      </section>

      <BoardGrid boards={boards} />

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-slate-950">Hot posts</h2>
        {hotPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {hotPosts.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">No featured posts yet.</p> : null}
      </section>
    </main>
  );
}
