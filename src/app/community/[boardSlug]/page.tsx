import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/community/PostCard";
import { db } from "@/lib/db";

export default async function BoardPage(props: { params: Promise<{ boardSlug: string }> }) {
  const { boardSlug } = await props.params;
  const board = await db.board.findUnique({
    where: { slug: boardSlug },
    include: {
      posts: {
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!board) notFound();

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <p className="text-sm font-semibold text-teal-700">板块</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">{board.name}</h1>
        </div>
        <Link href={`/community/post/new?board=${board.slug}`} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          发帖
        </Link>
      </section>

      <section className="grid gap-4">
        {board.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {board.posts.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">暂无帖子。</p> : null}
      </section>
    </main>
  );
}
