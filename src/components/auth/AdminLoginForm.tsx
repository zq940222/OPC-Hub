"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/actions/admin-auth";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, {});

  return (
    <form
      action={formAction}
      className="grid w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold text-teal-700">后台管理系统</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">管理员登录</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">此入口仅用于平台管理员和后台子账号。</p>
      </div>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        管理员邮箱
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="focus-ring h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950"
          placeholder="admin@example.com"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        密码
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="focus-ring h-11 rounded-md border border-slate-300 px-3 text-base text-slate-950"
          placeholder="请输入密码"
        />
      </label>

      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        disabled={pending}
        className="focus-ring h-11 rounded-md bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "登录中..." : "进入后台"}
      </button>
    </form>
  );
}
