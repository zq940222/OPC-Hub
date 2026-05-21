"use client";

import { useActionState } from "react";
import type { OrderActionState } from "@/actions/orders";
import { ORDER_TAGS } from "@/lib/constants";

type OrderFormProps = {
  action: (state: OrderActionState, formData: FormData) => Promise<OrderActionState>;
  order?: {
    title: string;
    description: string;
    amount: string | number;
    category: string;
    tags: string[];
    contact: string | null;
    deadline: Date | null;
  };
  submitLabel?: string;
};

export function OrderForm({ action, order, submitLabel = "Submit order" }: OrderFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const selectedTags = new Set(order?.tags ?? []);

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved. Waiting for review.</p> : null}
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Title
        <input name="title" required defaultValue={order?.title ?? ""} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Description
        <textarea name="description" required rows={8} defaultValue={order?.description ?? ""} className="focus-ring resize-y rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Amount
          <input name="amount" required type="number" min="1" step="0.01" defaultValue={order ? String(order.amount) : ""} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Category
          <input name="category" required defaultValue={order?.category ?? ""} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Deadline
          <input
            name="deadline"
            type="date"
            defaultValue={order?.deadline ? order.deadline.toISOString().slice(0, 10) : ""}
            className="focus-ring rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Contact
        <input name="contact" defaultValue={order?.contact ?? ""} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <div className="grid gap-2 text-sm font-medium text-slate-700">
        Tags
        <div className="flex flex-wrap gap-2">
          {ORDER_TAGS.map((tag) => (
            <label key={tag} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600">
              <input type="checkbox" name="tags" value={tag} defaultChecked={selectedTags.has(tag)} />
              {tag}
            </label>
          ))}
        </div>
      </div>
      <button disabled={pending} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
