"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { register } from "@/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await register({ email, password, name });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">注册 OPC Hub</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">创建账号后默认获得 OPC 角色，可浏览服务并报名承接订单。</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          姓名或公司名
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="focus-ring h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950"
            placeholder="请输入名称"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          邮箱
          <input
            type="email"
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
            placeholder="至少 6 位"
          />
        </label>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={pending} type="submit" className="focus-ring h-11 rounded-md bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          {pending ? "创建中" : "创建账号"}
        </button>
      </form>
    </div>
  );
}
