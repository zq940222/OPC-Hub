"use client";

import { useEffect, useMemo, useState } from "react";

type Stats = {
  orderCount: number;
  orderAmount: number;
  companyCount: number;
  events: string[];
};

const initialStats: Stats = {
  orderCount: 0,
  orderAmount: 0,
  companyCount: 0,
  events: ["系统已连接，等待实时数据"],
};

export default function ScreenPage() {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const es = new EventSource("/api/screen/sse");
    es.onmessage = (event) => setStats(JSON.parse(event.data));
    return () => es.close();
  }, []);

  const marquee = useMemo(() => stats.events.join("   ·   "), [stats.events]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#051323] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col justify-between px-5 py-6 md:px-10 md:py-8">
        <header className="flex flex-col gap-2 border-b border-cyan-300/20 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.35em] text-cyan-300">OPC HUB DATA CENTER</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">平台实时运营大屏</h1>
          </div>
          <div className="text-sm text-cyan-100/70">每 10 秒自动刷新</div>
        </header>

        <section className="grid flex-1 items-center gap-5 py-10 md:grid-cols-3">
          <ScreenStat label="累计订单量" value={stats.orderCount.toLocaleString("zh-CN")} tone="cyan" />
          <ScreenStat label="累计订单金额" value={formatAmount(stats.orderAmount)} tone="emerald" />
          <ScreenStat label="入驻企业数" value={stats.companyCount.toLocaleString("zh-CN")} tone="amber" />
        </section>

        <footer className="overflow-hidden rounded-md border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
          <div className="animate-[marquee_18s_linear_infinite] whitespace-nowrap text-sm text-cyan-50 md:text-base">{marquee}</div>
        </footer>
      </div>
    </main>
  );
}

function ScreenStat({ label, value, tone }: { label: string; value: string; tone: "cyan" | "emerald" | "amber" }) {
  const color = {
    cyan: "#67e8f9",
    emerald: "#6ee7b7",
    amber: "#fcd34d",
  }[tone];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-center shadow-2xl shadow-black/20">
      <div className="text-5xl font-black tabular-nums md:text-7xl" style={{ color, textShadow: `0 0 28px ${color}` }}>
        {value}
      </div>
      <div className="mt-4 text-sm font-semibold tracking-[0.25em] text-white/70">{label}</div>
    </div>
  );
}

function formatAmount(value: number) {
  if (value >= 100000000) return `￥${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `￥${(value / 10000).toFixed(1)}万`;
  return `￥${value.toLocaleString("zh-CN")}`;
}
