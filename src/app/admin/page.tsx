import { redirect } from "next/navigation";
import { createSubAdmin, logoutAdmin } from "@/actions/admin-auth";
import { approveOrder, rejectOrder } from "@/actions/admin-orders";
import { CreateSubAdminForm } from "@/components/auth/CreateSubAdminForm";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [userCount, orderCount, pendingOrderCount, admins, pendingOrders] = await Promise.all([
    db.user.count(),
    db.order.count(),
    db.order.count({ where: { status: "PENDING_REVIEW" } }),
    db.admin.findMany({
      include: { subAccount: true },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <main className="shell grid gap-5 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">后台管理系统</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">平台管理后台</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              管理员账号与前台用户账号已分离。这里用于管理用户、订单、内容、工具配置和后台子账号。
            </p>
            <p className="mt-3 text-sm text-slate-500">
              当前登录：{session.name}（{session.role === "ADMIN" ? "主管理员" : "子管理员"}）
            </p>
          </div>
          <form action={logoutAdmin}>
            <button className="focus-ring rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              退出后台
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">前台用户</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{userCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">待审核订单</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{pendingOrderCount}</p>
          <p className="mt-2 text-xs text-slate-500">订单总数：{orderCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">后台账号</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{admins.length}</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">订单审核</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              公司发布的订单进入待审核状态后，可由后台管理员审核。通过后进入招募，驳回时需填写原因。
            </p>
          </div>
          <span className="text-sm text-slate-500">待处理 {pendingOrderCount} 单</span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="mt-5 rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            暂无待审核订单。
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {pendingOrders.map((order) => (
              <article key={order.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">{order.title}</h3>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                        待审核
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{order.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span>发布方：{order.author.name ?? order.author.email ?? order.author.phone ?? "未命名公司"}</span>
                      <span>分类：{order.category}</span>
                      <span>金额：￥{Number(order.amount).toLocaleString("zh-CN")}</span>
                      <span>发布时间：{order.createdAt.toLocaleDateString("zh-CN")}</span>
                    </div>
                  </div>

                  <div className="grid w-full gap-2 lg:w-80">
                    <form action={approveOrder}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="focus-ring h-10 w-full rounded-md bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800">
                        审核通过
                      </button>
                    </form>
                    <form action={rejectOrder} className="grid gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <textarea
                        name="rejectReason"
                        rows={2}
                        className="focus-ring resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
                        placeholder="填写驳回原因"
                        required
                      />
                      <button className="focus-ring h-10 rounded-md border border-red-300 text-sm font-semibold text-red-700 hover:bg-red-50">
                        驳回订单
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">后台账号</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 pr-4 font-medium">名称</th>
                  <th className="py-3 pr-4 font-medium">邮箱</th>
                  <th className="py-3 pr-4 font-medium">角色</th>
                  <th className="py-3 pr-4 font-medium">权限</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="py-3 pr-4 font-medium text-slate-950">{admin.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{admin.email}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {admin.role === "ADMIN" ? "主管理员" : "子管理员"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {admin.role === "ADMIN" ? "全部权限" : "用户、订单、内容"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {session.role === "ADMIN" ? (
          <CreateSubAdminForm action={createSubAdmin} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">子账号管理</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">子管理员不能继续创建后台子账号。</p>
          </div>
        )}
      </section>
    </main>
  );
}
