import Link from "next/link";

type PostCardProps = {
  post: {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    isFeatured: boolean;
    viewCount: number;
    likeCount: number;
    createdAt: Date;
    board?: { name: string; slug: string };
    author: { id: string; name: string | null; email?: string | null };
    _count?: { comments: number };
  };
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {post.isPinned ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Pinned</span> : null}
        {post.isFeatured ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Featured</span> : null}
        {post.board ? (
          <Link href={`/community/${post.board.slug}`} className="text-xs font-medium text-blue-700 hover:text-blue-900">
            {post.board.name}
          </Link>
        ) : null}
      </div>
      <Link href={`/community/post/${post.id}`} className="mt-3 block text-lg font-semibold text-slate-950 hover:text-blue-700">
        {post.title}
      </Link>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
        <Link href={`/profile/${post.author.id}`} className="font-medium text-blue-700 hover:text-blue-900">
          {post.author.name ?? post.author.email ?? "OPC"}
        </Link>
        <span>{post.likeCount} likes</span>
        <span>{post._count?.comments ?? 0} comments</span>
        <span>{post.viewCount} views</span>
        <span>{post.createdAt.toLocaleDateString("zh-CN")}</span>
      </div>
    </article>
  );
}
