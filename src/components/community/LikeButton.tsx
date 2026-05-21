"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { likePost } from "@/actions/community";

export function LikeButton({ postId, initialLiked, likeCount }: { postId: string; initialLiked: boolean; likeCount: number }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(likeCount);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || liked}
      onClick={() =>
        startTransition(async () => {
          const result = await likePost(postId);
          if (result.success && !liked) {
            setLiked(true);
            setCount((value) => value + 1);
          }
        })
      }
      className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      <Heart size={16} aria-hidden="true" fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
}
