import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="shell grid min-h-[calc(100vh-8rem)] items-center gap-8 py-8 md:grid-cols-[0.9fr_1.1fr] md:py-12">
      <section className="max-w-xl">
        <p className="text-sm font-semibold text-teal-700">账号入口</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">进入你的 OPC 服务工作台</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">登录后可访问工具、财务、法务、订单广场、交流社区与私信功能。</p>
        <p className="mt-5 text-sm text-slate-600">
          还没有账号？{" "}
          <Link className="font-semibold text-blue-700 hover:text-blue-900" href="/register">
            立即注册
          </Link>
        </p>
      </section>
      <section className="flex justify-center md:justify-end">
        <LoginForm />
      </section>
    </main>
  );
}
