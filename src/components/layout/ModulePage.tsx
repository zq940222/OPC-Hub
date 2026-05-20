import Link from "next/link";

export function ModulePage({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <main className="shell py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold text-teal-700">{eyebrow}</p>
        <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold text-slate-950 md:text-5xl">{title}</h1>
            <p className="mt-4 text-base leading-8 text-slate-600">{description}</p>
          </div>
          {actions}
        </div>
      </section>
      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {["待接入配置", "服务目录", "运营数据"].map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">{item}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">后续计划将补齐真实数据、管理配置和流程状态。</p>
          </div>
        ))}
      </section>
    </main>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800">
      {children}
    </Link>
  );
}
