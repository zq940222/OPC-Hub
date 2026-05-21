import type { OrderStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { db } from "@/lib/db";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateParam(value: string | string[] | undefined) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function numberParam(value: string | string[] | undefined) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  const number = Number(raw);
  return Number.isNaN(number) ? undefined : number;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = (firstParam(params.status) || "RECRUITING") as OrderStatus;
  const tags = Array.isArray(params.tags) ? params.tags : params.tags ? [params.tags] : [];
  const minAmount = numberParam(params.minAmount);
  const maxAmount = numberParam(params.maxAmount);
  const deadlineFrom = dateParam(params.deadlineFrom);
  const deadlineTo = dateParam(params.deadlineTo);

  const where: Prisma.OrderWhereInput = {
    status,
    ...(firstParam(params.category) ? { category: firstParam(params.category) } : {}),
    ...(tags.length > 0 ? { tags: { hasSome: tags } } : {}),
    ...(minAmount !== undefined || maxAmount !== undefined
      ? {
          amount: {
            ...(minAmount !== undefined ? { gte: minAmount } : {}),
            ...(maxAmount !== undefined ? { lte: maxAmount } : {}),
          },
        }
      : {}),
    ...(deadlineFrom || deadlineTo
      ? {
          deadline: {
            ...(deadlineFrom ? { gte: deadlineFrom } : {}),
            ...(deadlineTo ? { lte: deadlineTo } : {}),
          },
        }
      : {}),
  };

  const sort = firstParam(params.sort) || "newest";
  const orderBy: Prisma.OrderOrderByWithRelationInput =
    sort === "highest"
      ? { amount: "desc" }
      : sort === "fewest"
        ? { applications: { _count: "asc" } }
        : { createdAt: "desc" };

  const orders = await db.order.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, image: true } },
      _count: { select: { applications: true } },
    },
    orderBy,
  });

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <p className="text-sm font-semibold text-teal-700">订单广场</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">发现订单并报名承接</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">按类目、标签、金额、截止日期和状态浏览已审核订单。</p>
        </div>
        <Link href="/orders/new" className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800">
          发布订单
        </Link>
      </section>

      <OrderFilters initial={params} />

      <section className="grid gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">没有符合筛选条件的订单。</div> : null}
      </section>
    </main>
  );
}
