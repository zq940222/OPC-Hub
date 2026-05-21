"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/actions/follow";

type FollowButtonProps = {
  userId: string;
  initialFollowing: boolean;
};

export function FollowButton({ userId, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleFollow(userId);
          if (result.success && typeof result.following === "boolean") {
            setFollowing(result.following);
          }
        });
      }}
      className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
    >
      {following ? <UserCheck size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
