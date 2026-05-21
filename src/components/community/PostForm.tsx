"use client";

import { useActionState } from "react";
import { createPost, type CommunityState } from "@/actions/community";

type PostFormProps = {
  boards: Array<{ id: string; name: string }>;
  defaultBoardId?: string;
};

export function PostForm({ boards, defaultBoardId }: PostFormProps) {
  const [state, formAction, pending] = useActionState<CommunityState, FormData>(createPost, {});

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Post published.</p> : null}
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Board
        <select name="boardId" defaultValue={defaultBoardId} required className="focus-ring rounded-md border border-slate-300 px-3 py-2">
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Title
        <input name="title" maxLength={80} required className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Content
        <textarea name="content" required rows={10} className="focus-ring resize-y rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <button disabled={pending} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "Publishing..." : "Publish"}
      </button>
    </form>
  );
}
