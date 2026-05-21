import { redirect } from "next/navigation";
import { createOrder } from "@/actions/orders";
import { auth } from "@/auth";
import { OrderForm } from "@/components/orders/OrderForm";

export default async function NewOrderPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "BIZ_OPC") redirect("/orders");

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section>
        <p className="text-sm font-semibold text-teal-700">发布订单</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">提交新订单等待审核</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">新订单会先进入待审核状态，通过后才会展示在订单广场。</p>
      </section>
      <OrderForm action={createOrder} />
    </main>
  );
}
