import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="shell grid min-h-[calc(100vh-8rem)] items-center gap-8 py-8 md:grid-cols-[0.9fr_1.1fr] md:py-12">
      <section className="max-w-xl">
        <p className="text-sm font-semibold text-teal-700">新企业入驻</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">先创建账号，再完善企业资料</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">本期注册先开放 OPC 账号能力，商务 OPC 发布订单与管理员权限将在后续后台中配置。</p>
        <p className="mt-5 text-sm text-slate-600">
          已有账号？{" "}
          <Link className="font-semibold text-blue-700 hover:text-blue-900" href="/login">
            返回登录
          </Link>
        </p>
      </section>
      <section className="flex justify-center md:justify-end">
        <RegisterForm />
      </section>
    </main>
  );
}
