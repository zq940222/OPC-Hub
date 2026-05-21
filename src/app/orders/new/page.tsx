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
        <p className="text-sm font-semibold text-teal-700">Publish order</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">Submit a new order for review</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">New orders enter pending review before they become visible in the marketplace.</p>
      </section>
      <OrderForm action={createOrder} />
    </main>
  );
}
