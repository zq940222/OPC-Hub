"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/tools", label: "工具" },
  { href: "/finance", label: "财务" },
  { href: "/legal", label: "法务" },
  { href: "/banking", label: "银行服务" },
  { href: "/equipment", label: "设备租赁" },
  { href: "/orders", label: "订单广场" },
  { href: "/community", label: "交流社区" },
];

export function AppChrome({
  user,
  children,
}: {
  user: Session["user"] | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isScreen = pathname === "/screen";

  if (isScreen) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-md text-slate-950">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-blue-700 text-sm font-bold text-white">O</span>
            <span className="text-base font-semibold">OPC Hub</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="主导航">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <Link href="/orders" className="focus-ring rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <UserRound aria-hidden="true" className="mr-1 inline" size={16} />
                  {user.name ?? "个人中心"}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="focus-ring rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut aria-hidden="true" className="mr-1 inline" size={16} />
                  退出
                </button>
              </>
            ) : (
              <Link href="/login" className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                <LogIn aria-hidden="true" className="mr-1 inline" size={16} />
                登录/注册
              </Link>
            )}
          </div>

          <button
            type="button"
            className="focus-ring rounded-md border border-slate-300 p-2 text-slate-700 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "关闭导航" : "打开导航"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <nav className="shell grid gap-1 py-3" aria-label="移动导航">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-3 text-sm font-medium ${
                    pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="mt-2 rounded-md border border-slate-300 px-3 py-3 text-left text-sm font-medium text-slate-700"
                >
                  退出登录
                </button>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="mt-2 rounded-md bg-blue-700 px-3 py-3 text-sm font-semibold text-white">
                  登录/注册
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-white">
        <div className="shell flex flex-col gap-2 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>OPC Hub · 服务、订单与社区协作平台</span>
          <Link href="/screen" className="font-medium text-blue-700 hover:text-blue-900">
            大屏展示
          </Link>
        </div>
      </footer>
    </div>
  );
}
