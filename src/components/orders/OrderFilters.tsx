"use client";

import Link from "next/link";
import { ORDER_TAGS } from "@/lib/constants";

type OrderFiltersProps = {
  initial: Record<string, string | string[] | undefined>;
};

function stringValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function OrderFilters({ initial }: OrderFiltersProps) {
  const selectedTags = new Set(Array.isArray(initial.tags) ? initial.tags : initial.tags ? [initial.tags] : []);

  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Category
        <input name="category" defaultValue={stringValue(initial.category)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Min amount
        <input name="minAmount" type="number" min="0" defaultValue={stringValue(initial.minAmount)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Max amount
        <input name="maxAmount" type="number" min="0" defaultValue={stringValue(initial.maxAmount)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Sort
        <select name="sort" defaultValue={stringValue(initial.sort) || "newest"} className="focus-ring rounded-md border border-slate-300 px-3 py-2">
          <option value="newest">Newest</option>
          <option value="highest">Highest amount</option>
          <option value="fewest">Fewest applications</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Deadline from
        <input name="deadlineFrom" type="date" defaultValue={stringValue(initial.deadlineFrom)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Deadline to
        <input name="deadlineTo" type="date" defaultValue={stringValue(initial.deadlineTo)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Status
        <select name="status" defaultValue={stringValue(initial.status) || "RECRUITING"} className="focus-ring rounded-md border border-slate-300 px-3 py-2">
          <option value="RECRUITING">Recruiting</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING_REVIEW">Pending review</option>
        </select>
      </label>
      <div className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2 lg:col-span-4">
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
      <div className="flex gap-2 md:col-span-2 lg:col-span-4">
        <button className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Apply filters</button>
        <Link href="/orders" className="focus-ring rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Reset
        </Link>
      </div>
    </form>
  );
}
