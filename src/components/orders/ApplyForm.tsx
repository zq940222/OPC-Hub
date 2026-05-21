"use client";

import { useActionState } from "react";
import type { ApplicationActionState } from "@/actions/applications";

type ApplyFormProps = {
  action: (state: ApplicationActionState, formData: FormData) => Promise<ApplicationActionState>;
};

export function ApplyForm({ action }: ApplyFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-950">Apply</h2>
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Application submitted.</p> : null}
      <textarea name="reason" required maxLength={300} rows={5} className="focus-ring resize-y rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Tell the author why you are a good fit." />
      <button disabled={pending} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
