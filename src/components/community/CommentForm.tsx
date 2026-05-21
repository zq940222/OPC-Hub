"use client";

import { useActionState } from "react";
import type { CommunityState } from "@/actions/community";
import { formatActionError } from "@/lib/action-errors";

type CommentFormProps = {
  action: (state: CommunityState, formData: FormData) => Promise<CommunityState>;
};

export function CommentForm({ action }: CommentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5">
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formatActionError(state.error)}</p> : null}
      <textarea name="content" required rows={4} className="focus-ring resize-y rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="写下你的评论" />
      <button disabled={pending} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "发送中..." : "评论"}
      </button>
    </form>
  );
}
