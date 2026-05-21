import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PostForm } from "@/components/community/PostForm";
import { db } from "@/lib/db";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const boardSlug = Array.isArray(params.board) ? params.board[0] : params.board;
  const boards = await db.board.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { order: "asc" },
  });
  const defaultBoard = boards.find((board) => board.slug === boardSlug) ?? boards[0];

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold text-teal-700">New post</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">Publish to the community</h1>
      </section>
      <PostForm boards={boards} defaultBoardId={defaultBoard?.id} />
    </main>
  );
}
