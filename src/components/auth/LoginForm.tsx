"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquareText, QrCode, ShieldCheck } from "lucide-react";

type Tab = "sms" | "password";

export function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sms");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  async function sendCode() {
    setError("");
    setSending(true);
    const res = await fetch("/api/auth/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "验证码发送失败");
      return;
    }
    setDevCode(data.devCode ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result =
      tab === "sms"
        ? await signIn("sms", { phone, code, redirect: false })
        : await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("登录失败，请检查输入信息");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">登录 OPC Hub</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">使用短信、密码或微信登录，进入订单与服务工作台。</p>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-md bg-slate-100 p-1" role="tablist">
        {(["sms", "password"] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`focus-ring rounded px-3 py-2 text-sm font-semibold ${
              tab === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
          >
            {value === "sms" ? "短信登录" : "密码登录"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {tab === "sms" ? (
          <>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              手机号
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="focus-ring h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950"
                placeholder="13800138000"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              验证码
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="focus-ring h-11 min-w-0 rounded-md border border-slate-300 px-3 text-base text-slate-950"
                  placeholder="6 位数字"
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending}
                  className="focus-ring rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <MessageSquareText aria-hidden="true" className="mr-1 inline" size={16} />
                  {sending ? "发送中" : "获取"}
                </button>
              </div>
            </label>
            {devCode && <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">开发环境验证码：{devCode}</p>}
          </>
        ) : (
          <>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              邮箱或手机号
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950"
                placeholder="name@example.com"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              密码
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950"
                placeholder="请输入密码"
              />
            </label>
          </>
        )}

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" className="focus-ring h-11 rounded-md bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800">
          <ShieldCheck aria-hidden="true" className="mr-1 inline" size={16} />
          登录
        </button>
      </form>

      <button
        type="button"
        onClick={() => signIn("wechat")}
        className="focus-ring mt-3 h-11 w-full rounded-md border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <QrCode aria-hidden="true" className="mr-1 inline" size={16} />
        微信扫码登录
      </button>
    </div>
  );
}
