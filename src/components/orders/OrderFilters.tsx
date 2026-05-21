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
        类目
        <input name="category" defaultValue={stringValue(initial.category)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        最低金额
        <input name="minAmount" type="number" min="0" defaultValue={stringValue(initial.minAmount)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        最高金额
        <input name="maxAmount" type="number" min="0" defaultValue={stringValue(initial.maxAmount)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        排序
        <select name="sort" defaultValue={stringValue(initial.sort) || "newest"} className="focus-ring rounded-md border border-slate-300 px-3 py-2">
          <option value="newest">最新发布</option>
          <option value="highest">金额最高</option>
          <option value="fewest">报名最少</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        截止日期起
        <input name="deadlineFrom" type="date" defaultValue={stringValue(initial.deadlineFrom)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        截止日期止
        <input name="deadlineTo" type="date" defaultValue={stringValue(initial.deadlineTo)} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        状态
        <select name="status" defaultValue={stringValue(initial.status) || "RECRUITING"} className="focus-ring rounded-md border border-slate-300 px-3 py-2">
          <option value="RECRUITING">招募中</option>
          <option value="IN_PROGRESS">进行中</option>
          <option value="COMPLETED">已完成</option>
          <option value="PENDING_REVIEW">待审核</option>
        </select>
      </label>
      <div className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2 lg:col-span-4">
        标签
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
        <button className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">应用筛选</button>
        <Link href="/orders" className="focus-ring rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          重置
        </Link>
      </div>
    </form>
  );
}
