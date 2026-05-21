"use client";

import { Flag } from "lucide-react";
import { useActionState, useState } from "react";
import type { CommunityState } from "@/actions/community";

type ReportButtonProps = {
  action: (state: CommunityState, formData: FormData) => Promise<CommunityState>;
};

export function ReportButton({ action }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Flag size={16} aria-hidden="true" />
        Report
      </button>
      {open ? (
        <form action={formAction} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3">
          {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-700">Reported.</p> : null}
          <textarea name="reason" required rows={3} className="focus-ring resize-y rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button disabled={pending} className="focus-ring rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
            Submit report
          </button>
        </form>
      ) : null}
    </div>
  );
}
