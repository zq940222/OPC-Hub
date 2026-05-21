"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAmount } from "@/components/orders/OrderCard";

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
          Published
        </button>
        <button type="button" onClick={() => setTab("applied")} className={`focus-ring rounded-md px-4 py-2 text-sm font-semibold ${tab === "applied" ? activeClass : idleClass}`}>
          Applied
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
                    {order.status} / {order._count.applications} applications / {formatAmount(order.amount)}
                  </p>
                </div>
                <Link href={`/orders/${order.id}/edit`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {authoredOrders.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">No published orders.</p> : null}
        </div>
      ) : (
        <div className="grid gap-3">
          {applications.map((application) => (
            <div key={application.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <Link href={`/orders/${application.order.id}`} className="font-semibold text-slate-950 hover:text-blue-700">
                {application.order.title}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                application {application.status} / order {application.order.status} / {formatAmount(application.order.amount)}
              </p>
            </div>
          ))}
          {applications.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">No applications.</p> : null}
        </div>
      )}
    </section>
  );
}
