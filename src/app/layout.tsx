import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppChrome } from "@/components/layout/AppChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPC Hub 服务平台",
  description: "面向个人独资公司的服务、订单与交流平台",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="zh-CN" className="antialiased">
      <body>
        <AppChrome user={session?.user ?? null}>{children}</AppChrome>
      </body>
    </html>
  );
}
