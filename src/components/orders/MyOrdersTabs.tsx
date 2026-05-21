"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAmount, formatOrderStatus } from "@/components/orders/OrderCard";

const applicationStatusLabels: Record<string, string> = {
  PENDING: "待处理",
  ACCEPTED: "已接受",
  REJECTED: "已拒绝",
};

type MyOrdersTabsProps = {
  authoredOrders: Array<{
    id: string;
    title: string;
    status: string;
    amount: unknown;
    _count: { applications: number };
  }>;
  applications: Array<{
    id: string;
    status: string;
    order: { id: string; title: string; status: string; amount: unknown };
  }>;
};

export function MyOrdersTabs({ authoredOrders, applications }: MyOrdersTabsProps) {
  const [tab, setTab] = useState<"authored" | "applied">("authored");
  const activeClass = "bg-blue-700 text-white";
  const idleClass = "border border-slate-300 text-slate-700 hover:bg-slate-50";

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("authored")} className={`focus-ring rounded-md px-4 py-2 text-sm font-semibold ${tab === "authored" ? activeClass : idleClass}`}>
          我发布的
        </button>
        <button type="button" onClick={() => setTab("applied")} className={`focus-ring rounded-md px-4 py-2 text-sm font-semibold ${tab === "applied" ? activeClass : idleClass}`}>
          我报名的
        </button>
      </div>

      {tab === "authored" ? (
        <div className="grid gap-3">
          {authoredOrders.map((order) => (
            <div key={order.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link href={`/orders/${order.id}`} className="font-semibold text-slate-950 hover:text-blue-700">
                    {order.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatOrderStatus(order.status)} / {order._count.applications} 人报名 / {formatAmount(order.amount)}
                  </p>
                </div>
                <Link href={`/orders/${order.id}/edit`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                  编辑
                </Link>
              </div>
            </div>
          ))}
          {authoredOrders.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">暂无发布的订单。</p> : null}
        </div>
      ) : (
        <div className="grid gap-3">
          {applications.map((application) => (
            <div key={application.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <Link href={`/orders/${application.order.id}`} className="font-semibold text-slate-950 hover:text-blue-700">
                {application.order.title}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                报名状态 {applicationStatusLabels[application.status] ?? application.status} / 订单状态 {formatOrderStatus(application.order.status)} / {formatAmount(application.order.amount)}
              </p>
            </div>
          ))}
          {applications.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">暂无报名记录。</p> : null}
        </div>
      )}
    </section>
  );
}
