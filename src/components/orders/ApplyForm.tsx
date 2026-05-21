"use client";

import { useActionState } from "react";
import type { ApplicationActionState } from "@/actions/applications";
import { formatActionError } from "@/lib/action-errors";

type ApplyFormProps = {
  action: (state: ApplicationActionState, formData: FormData) => Promise<ApplicationActionState>;
};

export function ApplyForm({ action }: ApplyFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-950">报名承接</h2>
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formatActionError(state.error)}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">报名已提交。</p> : null}
      <textarea name="reason" required maxLength={300} rows={5} className="focus-ring resize-y rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="说明你适合承接该订单的原因。" />
      <button disabled={pending} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "提交中..." : "提交报名"}
      </button>
    </form>
  );
}
