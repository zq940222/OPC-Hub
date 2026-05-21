import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MyOrdersTabs } from "@/components/orders/MyOrdersTabs";
import { db } from "@/lib/db";

export default async function DashboardOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [authoredOrders, applications] = await Promise.all([
    db.order.findMany({
      where: { authorId: session.user.id },
      select: {
        id: true,
        title: true,
        status: true,
        amount: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.orderApplication.findMany({
      where: { applicantId: session.user.id },
      select: {
        id: true,
        status: true,
        order: {
          select: {
            id: true,
            title: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const authoredOrderItems = authoredOrders.map((order) => ({
    ...order,
    amount: order.amount.toString(),
  }));
  const applicationItems = applications.map((application) => ({
    ...application,
    order: {
      ...application.order,
      amount: application.order.amount.toString(),
    },
  }));

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold text-teal-700">My orders</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">Published and applied orders</h1>
      </section>
      <MyOrdersTabs authoredOrders={authoredOrderItems} applications={applicationItems} />
    </main>
  );
}
