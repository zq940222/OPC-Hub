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
            <p className="text-sm font-semibold text-teal-700">Admin</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">OPC Hub management</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Manage users, order review, reports, tools, and backend accounts from one page.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Logged in as {session.name} ({session.role})
            </p>
          </div>
          <form action={logoutAdmin}>
            <button className="focus-ring rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Frontend users" value={userCount} />
        <StatCard label="Pending orders" value={pendingOrderCount} helper={`Total orders: ${orderCount}`} />
        <StatCard label="Admin accounts" value={admins.length} />
      </section>

      <Section title="User management">
        <form className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input name="q" defaultValue={q} placeholder="Search name, email, phone" className="focus-ring min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Search</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 pr-4 font-medium">User</th>
                <th className="py-3 pr-4 font-medium">Role</th>
                <th className="py-3 pr-4 font-medium">Points</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-950">{user.name ?? "Unnamed"}</p>
                    <p className="text-xs text-slate-500">{user.email ?? user.phone ?? user.id}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{user.role}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.points}</td>
                  <td className="py-3 pr-4 text-slate-600">{user.banned ? "Banned" : "Active"}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={switchRoleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value={user.role === "OPC" ? "BIZ_OPC" : "OPC"} />
                        <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          Make {user.role === "OPC" ? "BIZ_OPC" : "OPC"}
                        </button>
                      </form>
                      <form action={toggleBanAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button className="focus-ring rounded-md border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                          {user.banned ? "Unban" : "Ban"}
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

      <Section title="Order review">
        {pendingOrders.length === 0 ? <Empty text="No pending orders." /> : null}
        <div className="grid gap-4">
          {pendingOrders.map((order) => (
            <article key={order.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-950">{order.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{order.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                    <span>{order.author.name ?? order.author.email ?? order.author.phone ?? "Unnamed author"}</span>
                    <span>{order.category}</span>
                    <span>{Number(order.amount).toLocaleString("zh-CN")}</span>
                  </div>
                </div>
                <div className="grid w-full gap-2 lg:w-80">
                  <form action={approveOrder}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button className="focus-ring h-10 w-full rounded-md bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800">Approve</button>
                  </form>
                  <form action={rejectOrder} className="grid gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <textarea name="rejectReason" rows={2} className="focus-ring resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950" placeholder="Reject reason" required />
                    <button className="focus-ring h-10 rounded-md border border-red-300 text-sm font-semibold text-red-700 hover:bg-red-50">Reject</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Report management">
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <a href="/admin?reports=unresolved" className="font-semibold text-blue-700">Unresolved</a>
          <a href="/admin?reports=resolved" className="font-semibold text-blue-700">Resolved</a>
          <a href="/admin?reports=all" className="font-semibold text-blue-700">All</a>
        </div>
        {reports.length === 0 ? <Empty text="No reports." /> : null}
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
                    Reporter: {report.reporter.name ?? report.reporter.email ?? report.reporter.phone ?? "Unknown"} / {report.resolved ? "Resolved" : "Open"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!report.resolved ? (
                    <form action={resolveReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <button className="focus-ring rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Resolve</button>
                    </form>
                  ) : null}
                  <form action={deleteReportedContentAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <button className="focus-ring rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete content</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Section title="Tool management">
          <div className="grid gap-3">
            {tools.map((tool) => (
              <div key={tool.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{tool.name}</p>
                    <p className="text-sm text-slate-500">
                      {tool.category} / order {tool.order} / {tool.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={moveToolAction}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Up</button>
                    </form>
                    <form action={moveToolAction}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Down</button>
                    </form>
                    <form action={toggleToolAction}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <button className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        {tool.active ? "Deactivate" : "Activate"}
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
        <Section title="Backend accounts">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 pr-4 font-medium">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="py-3 pr-4 font-medium text-slate-950">{admin.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{admin.email}</td>
                    <td className="py-3 pr-4 text-slate-600">{admin.role}</td>
                    <td className="py-3 pr-4 text-slate-600">{admin.role === "ADMIN" ? "All" : JSON.stringify(admin.subAccount?.permissions ?? {})}</td>
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
            <h2 className="text-lg font-semibold text-slate-950">Sub-admin creation</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Only primary admins can create backend sub-accounts.</p>
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
      <h2 className="text-lg font-semibold text-slate-950">Create tool</h2>
      <input name="name" placeholder="Name" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      <textarea name="description" placeholder="Description" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      <input name="category" placeholder="Category" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      <input name="url" type="url" placeholder="https://example.com" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" required />
      <input name="iconUrl" type="url" placeholder="Icon URL" className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input name="order" type="number" defaultValue={0} className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="embedable" />
        Embedable
      </label>
      <button className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Create</button>
    </form>
  );
}
