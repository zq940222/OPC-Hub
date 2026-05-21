import Link from "next/link";

type BoardGridProps = {
  boards: Array<{
    id: string;
    name: string;
    slug: string;
    _count: { posts: number };
  }>;
};

export function BoardGrid({ boards }: BoardGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <Link key={board.id} href={`/community/${board.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200">
          <p className="text-lg font-semibold text-slate-950">{board.name}</p>
          <p className="mt-2 text-sm text-slate-500">{board._count.posts} posts</p>
        </Link>
      ))}
    </section>
  );
}
