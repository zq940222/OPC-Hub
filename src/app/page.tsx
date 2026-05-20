import Link from "next/link";
import { BriefcaseBusiness, Building2, Landmark, Scale, ShieldCheck, Wrench } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const services = [
  { href: "/tools", title: "工具箱", desc: "常用申报、协作与经营工具", icon: Wrench },
  { href: "/finance", title: "财务服务", desc: "记账、报税、票据与风控支持", icon: Building2 },
  { href: "/legal", title: "法务服务", desc: "合同、合规、纠纷与知识产权", icon: Scale },
  { href: "/banking", title: "银行服务", desc: "开户、授信、结算与资金方案", icon: Landmark },
  { href: "/equipment", title: "设备租赁", desc: "办公、直播、仓储与生产设备", icon: ShieldCheck },
  { href: "/orders", title: "订单广场", desc: "发布需求、报名承接、状态流转", icon: BriefcaseBusiness },
];

async function getStats() {
  try {
    const [orderCount, amount, companyCount] = await Promise.all([
      db.order.count(),
      db.order.aggregate({ _sum: { amount: true } }),
      db.user.count({ where: { role: { in: ["OPC", "BIZ_OPC"] } } }),
    ]);

    return {
      orderCount,
      orderAmount: Number(amount._sum.amount ?? 0),
      companyCount,
    };
  } catch {
    return { orderCount: 0, orderAmount: 0, companyCount: 0 };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <main>
      <section className="border-b border-slate-200 bg-white">
        <div className="shell grid gap-10 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-teal-700">OPC 服务资源连接平台</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
              让 OPC 公司更快找到服务、订单与可信合作方
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              聚合财务、法务、银行、工具、设备租赁与订单广场，覆盖从入驻、经营到承接订单的关键流程。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="focus-ring rounded-md bg-blue-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800" href="/register">
                立即入驻
              </Link>
              <Link className="focus-ring rounded-md border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50" href="#services">
                浏览服务
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            <Stat label="累计订单" value={stats.orderCount.toLocaleString("zh-CN")} />
            <Stat label="累计金额" value={`￥${Math.round(stats.orderAmount / 10000).toLocaleString("zh-CN")}万`} />
            <Stat label="入驻企业" value={stats.companyCount.toLocaleString("zh-CN")} />
          </div>
        </div>
      </section>

      <section id="services" className="shell py-10 md:py-14">
        <div className="mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">核心服务入口</h2>
            <p className="mt-2 text-sm text-slate-600">PC 端适合密集浏览，移动端优先保留关键操作。</p>
          </div>
          <Link href="/orders" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            查看订单广场
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="rounded-md bg-blue-50 p-2 text-blue-700">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{item.desc}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="shell grid gap-4 pb-12 md:grid-cols-2">
        <Feed title="最新订单" items={["品牌直播间搭建与运营外包", "跨境店铺财税合规咨询", "办公设备短租与驻场支持"]} />
        <Feed title="社区热帖" items={["OPC 接单合同风险清单", "如何准备银行开户材料", "设备租赁押金条款避坑"]} />
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="text-2xl font-semibold tabular-nums text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function Feed({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item} className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="min-w-0 truncate text-slate-700">{item}</span>
            <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">更新</span>
          </div>
        ))}
      </div>
    </div>
  );
}
