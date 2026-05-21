import { notFound, redirect } from "next/navigation";
import { updateOrder } from "@/actions/orders";
import { auth } from "@/auth";
import { OrderForm } from "@/components/orders/OrderForm";
import { db } from "@/lib/db";

export default async function EditOrderPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await db.order.findUnique({ where: { id } });
  if (!order) notFound();
  if (order.authorId !== session.user.id) redirect(`/orders/${id}`);
  if (!["DRAFT", "PENDING_REVIEW", "REJECTED"].includes(order.status)) redirect(`/orders/${id}`);

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section>
        <p className="text-sm font-semibold text-teal-700">编辑订单</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">{order.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">保存修改后，订单会重新进入待审核状态。</p>
      </section>
      <OrderForm action={updateOrder.bind(null, id)} order={{ ...order, amount: order.amount.toString() }} submitLabel="保存修改" />
    </main>
  );
}
