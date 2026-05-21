import { redirect } from "next/navigation";
import { createSubAdmin, logoutAdmin } from "@/actions/admin-auth";
import { approveOrder, rejectOrder } from "@/actions/admin-orders";
import { deleteReportedContent, resolveReport } from "@/actions/admin-content";
import { createTool, moveTool, toggleToolActive } from "@/actions/admin-tools";
import { toggleUserBanned, updateUserRole } from "@/actions/admin-users";
import { CreateSubAdminForm } from "@/components/auth/CreateSubAdminForm";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const q = String(Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim();
  const reportStatus = String(Array.isArray(params.reports) ? params.reports[0] : params.reports ?? "unresolved");

  const [users, userCount, orderCount, pendingOrderCount, admins, pendingOrders, reports, tools] = await Promise.all([
    db.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.user.count(),
    db.order.count(),
    db.order.count({ where: { status: "PENDING_REVIEW" } }),
    db.admin.findMany({
      include: { subAccount: true },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { author: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.report.findMany({
      where: reportStatus === "all" ? undefined : { resolved: reportStatus === "resolved" },
      include: { reporter: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.tool.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
  ]);

  async function switchRoleAction(formData: FormData) {
    "use server";
    await updateUserRole(String(formData.get("userId") ?? ""), String(formData.get("role") ?? "") as "OPC" | "BIZ_OPC");
  }

  async function toggleBanAction(formData: FormData) {
    "use server";
    await toggleUserBanned(String(formData.get("userId") ?? ""));
  }

  async function resolveReportAction(formData: FormData) {
    "use server";
    await resolveReport(String(formData.get("reportId") ?? ""));
  }

  async function deleteReportedContentAction(formData: FormData) {
    "use server";
    await deleteReportedContent(String(formData.get("reportId") ?? ""));
  }

  async function moveToolAction(formData: FormData) {
    "use server";
    await moveTool(String(formData.get("toolId") ?? ""), String(formData.get("direction") ?? "") as "up" | "down");
  }

  async function toggleToolAction(formData: FormData) {
    "use server";
    await toggleToolActive(String(formData.get("toolId") ?? ""));
  }

  async function createToolAction(formData: FormData) {
    "use server";
    await createTool({}, formData);
  }

  return (
    <main className="shell grid gap-5 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">后台管理</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">OPC Hub 管理台</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              在一个页面管理用户、订单审核、举报、工具和后台账号。
            </p>
            <p className="mt-3 text-sm text-slate-500">
              当前登录：{session.name}（{session.role}）
            </p>
          </div>
          <form action={logoutAdmin}>
            <button className="focus-ring rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              退出登录
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="前台用户" value={userCount} />
        <StatCard label="待审核订单" value={pendingOrderCount} helper={`订单总数：${orderCount}`} />
        <StatCard label="后台账号" value={admins.length} />
      </section>

      <Section title="用户管理">
        <form className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input name="q" defaultValue={q} placeholder="搜索姓名、邮箱、手机号" className="focus-ring min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">搜索</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 pr-4 font-medium">用户</th>
                <th className="py-3 pr-4 font-medium">角色</th>
                <th className="py-3 pr-4 font-medium">积分</th>
                <th className="py-3 pr-4 font-medium">状态</th>
                <th className="py-3 pr-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-950">{user.name ?? "未命名用户"}</p>
                    <p className="text-xs text-slate-500">{user.email ?? user.phone ?? user.id}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{user.role}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.points}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.banned ? "已封禁" : "正常"}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={switchRoleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value={user.role === "OPC" ? "BIZ_OPC" : "OPC"} />
                        <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          设为 {user.role === "OPC" ? "商务 OPC" : "OPC"}
                        </button>
                      </form>
                      <form action={toggleBanAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button className="focus-ring rounded-md border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                          {user.banned ? "解封" : "封禁"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="订单审核">
        {pendingOrders.length === 0 ? <Empty text="暂无待审核订单。" /> : null}
        <div className="grid gap-4">
          {pendingOrders.map((order) => (
            <article key={order.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-950">{order.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{order.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                    <span>{order.author.name ?? order.author.email ?? order.author.phone ?? "未命名发布者"}</span>
                    <span>{order.category}</span>
                    <span>{Number(order.amount).toLocaleString("zh-CN")}</span>
                  </div>
                </div>
                <div className="grid w-full gap-2 lg:w-80">
                  <form action={approveOrder}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button className="focus-ring h-10 w-full rounded-md bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800">通过</button>
                  </form>
                  <form action={rejectOrder} className="grid gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <textarea name="rejectReason" rows={2} className="focus-ring resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950" placeholder="驳回原因" required />
                    <button className="focus-ring h-10 rounded-md border border-red-300 text-sm font-semibold text-red-700 hover:bg-red-50">驳回</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="举报管理">
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <a href="/admin?reports=unresolved" className="font-semibold text-blue-700">未处理</a>
          <a href="/admin?reports=resolved" className="font-semibold text-blue-700">已处理</a>
          <a href="/admin?reports=all" className="font-semibold text-blue-700">全部</a>
        </div>
        {reports.length === 0 ? <Empty text="暂无举报。" /> : null}
        <div className="grid gap-3">
          {reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">
                    {report.targetType} / {report.targetId}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{report.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    举报人：{report.reporter.name ?? report.reporter.email ?? report.reporter.phone ?? "未知"} / {report.resolved ? "已处理" : "未处理"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!report.resolved ? (
                    <form action={resolveReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <button className="focus-ring rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">标记处理</button>
                    </form>
                  ) : null}
                  <form action={deleteReportedContentAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <button className="focus-ring rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">删除内容</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Section title="工具管理">
          <div className="grid gap-3">
            {tools.map((tool) => (
              <div key={tool.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{tool.name}</p>
                    <p className="text-sm text-slate-500">
                      {tool.category} / 排序 {tool.order} / {tool.active ? "已启用" : "已停用"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={moveToolAction}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">上移</button>
                    </form>
                    <form action={moveToolAction}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">下移</button>
                    </form>
                    <form action={toggleToolAction}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        {tool.active ? "停用" : "启用"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <ToolCreateForm action={createToolAction} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Section title="后台账号">
          <div className="overflow-x-auto">
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
                    <td className="py-3 pr-4 text-slate-600">{admin.role}</td>
                    <td className="py-3 pr-4 text-slate-600">{admin.role === "ADMIN" ? "全部" : JSON.stringify(admin.subAccount?.permissions ?? {})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {session.role === "ADMIN" ? (
          <CreateSubAdminForm action={createSubAdmin} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">创建后台子账号</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">只有主管理员可以创建后台子账号。</p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number; helper?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">{text}</div>;
}

function ToolCreateForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-950">创建工具</h2>
      <input name="name" placeholder="名称" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      <textarea name="description" placeholder="描述" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      <input name="category" placeholder="分类" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      <input name="url" type="url" placeholder="https://example.com" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      <input name="iconUrl" type="url" placeholder="图标 URL" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input name="order" type="number" defaultValue={0} className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="embedable" />
        可嵌入
      </label>
      <button className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">创建</button>
    </form>
  );
}
