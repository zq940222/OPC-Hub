import type { OrderStatus } from "@prisma/client";
import Link from "next/link";

type OrderCardProps = {
  order: {
    id: string;
    title: string;
    description: string;
    amount: unknown;
    category: string;
    tags: string[];
    status: OrderStatus;
    deadline: Date | null;
    createdAt: Date;
    author: { id: string; name: string | null; image?: string | null };
    _count?: { applications: number };
  };
};

const statusLabels: Record<OrderStatus, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  RECRUITING: "招募中",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  REJECTED: "已驳回",
  CLOSED: "已关闭",
};

export function formatOrderStatus(status: OrderStatus | string) {
  return statusLabels[status as OrderStatus] ?? status;
}

export function formatAmount(amount: unknown) {
  return Number(amount).toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  });
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/orders/${order.id}`} className="text-lg font-semibold text-slate-950 hover:text-blue-700">
              {order.title}
            </Link>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{formatOrderStatus(order.status)}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{order.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {order.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>{order.category}</span>
            <span>{order._count?.applications ?? 0} 人报名</span>
            <span>截止 {order.deadline ? order.deadline.toLocaleDateString("zh-CN") : "长期有效"}</span>
            <Link href={`/profile/${order.author.id}`} className="font-medium text-blue-700 hover:text-blue-900">
              {order.author.name ?? "OPC"}
            </Link>
          </div>
        </div>
        <div className="shrink-0 text-left md:text-right">
          <p className="text-2xl font-semibold text-slate-950">{formatAmount(order.amount)}</p>
          <p className="mt-2 text-xs text-slate-500">{order.createdAt.toLocaleDateString("zh-CN")}</p>
          <Link href={`/orders/${order.id}`} className="mt-4 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            查看详情
          </Link>
        </div>
      </div>
    </article>
  );
}
