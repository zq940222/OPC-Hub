import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { applyToOrder } from "@/actions/applications";
import { closeOrder, completeOrder } from "@/actions/orders";
import { auth } from "@/auth";
import { ApplicationList } from "@/components/orders/ApplicationList";
import { ApplyForm } from "@/components/orders/ApplyForm";
import { formatAmount, formatOrderStatus } from "@/components/orders/OrderCard";
import { db } from "@/lib/db";

const applicationStatusLabels: Record<string, string> = {
  PENDING: "待处理",
  ACCEPTED: "已接受",
  REJECTED: "已拒绝",
};

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await db.order.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true, phone: true, image: true, points: true } },
      applications: {
        include: {
          applicant: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) notFound();

  const isAuthor = order.authorId === session.user.id;
  const existingApplication = order.applications.find((application) => application.applicantId === session.user.id);

  async function closeAction() {
    "use server";
    await closeOrder(id);
  }

  async function completeAction() {
    "use server";
    await completeOrder(id);
  }

  return (
    <main className="shell grid gap-6 py-8 md:py-12 lg:grid-cols-[1fr_360px]">
      <section className="grid gap-5">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{formatOrderStatus(order.status)}</span>
            <span className="text-sm text-slate-500">{order.category}</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 md:text-5xl">{order.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {order.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>{formatAmount(order.amount)}</span>
            <span>截止 {order.deadline ? order.deadline.toLocaleDateString("zh-CN") : "长期有效"}</span>
            <span>发布于 {order.createdAt.toLocaleDateString("zh-CN")}</span>
          </div>
          <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-slate-700">{order.description}</p>
          {order.contact && isAuthor ? <p className="mt-5 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">联系方式：{order.contact}</p> : null}
        </article>

        {isAuthor ? (
          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">发布者操作</h2>
              <div className="flex flex-wrap gap-2">
                <Link href={`/orders/${order.id}/edit`} className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  编辑
                </Link>
                {(order.status === "PENDING_REVIEW" || order.status === "RECRUITING") && (
                  <form action={closeAction}>
                    <button className="focus-ring rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">关闭</button>
                  </form>
                )}
                {order.status === "IN_PROGRESS" && (
                  <form action={completeAction}>
                    <button className="focus-ring rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">完成</button>
                  </form>
                )}
              </div>
            </div>
            <ApplicationList applications={order.applications} />
          </section>
        ) : null}
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">发布者</h2>
          <Link href={`/profile/${order.author.id}`} className="mt-3 block font-semibold text-blue-700 hover:text-blue-900">
            {order.author.name ?? order.author.email ?? order.author.phone ?? "OPC"}
          </Link>
          <p className="mt-2 text-sm text-slate-500">{order.author.points} 积分</p>
        </section>

        {!isAuthor && order.status === "RECRUITING" && !existingApplication ? <ApplyForm action={applyToOrder.bind(null, order.id)} /> : null}
        {!isAuthor && existingApplication ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
            报名状态：{applicationStatusLabels[existingApplication.status] ?? existingApplication.status}
          </section>
        ) : null}
      </aside>
    </main>
  );
}
