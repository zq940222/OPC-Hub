"use client";

import { useActionState } from "react";
import type { CreateSubAdminState } from "@/actions/admin-auth";

export function CreateSubAdminForm({
  action,
}: {
  action: (state: CreateSubAdminState, formData: FormData) => Promise<CreateSubAdminState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">创建后台子账号</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">子账号用于后台管理，不会出现在前台用户体系中。</p>
      </div>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        名称
        <input
          name="name"
          className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-base text-slate-950"
          placeholder="运营管理员"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        邮箱
        <input
          name="email"
          type="email"
          className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-base text-slate-950"
          placeholder="subadmin@example.com"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        初始密码
        <input
          name="password"
          type="password"
          className="focus-ring h-10 rounded-md border border-slate-300 px-3 text-base text-slate-950"
          placeholder="至少 6 位"
        />
      </label>

      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>}

      <button
        disabled={pending}
        className="focus-ring h-10 rounded-md bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "创建中..." : "创建子账号"}
      </button>
    </form>
  );
}
