import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import WeChat from "next-auth/providers/wechat";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Password",
      credentials: {
        email: { label: "邮箱或手机号" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!identifier || !password) return null;

        const user = await db.user.findFirst({
          where: {
            OR: [{ email: identifier.toLowerCase() }, { phone: identifier }],
          },
        });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    Credentials({
      id: "sms",
      name: "SMS",
      credentials: {
        phone: { label: "手机号" },
        code: { label: "验证码" },
      },
      async authorize(credentials) {
        const phone = String(credentials?.phone ?? "").trim();
        const code = String(credentials?.code ?? "").trim();
        if (!phone || !code) return null;

        const sms = await db.smsCode.findFirst({
          where: {
            phone,
            code,
            used: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });
        if (!sms) return null;

        const user = await db.user.upsert({
          where: { phone },
          update: {},
          create: { phone, name: `OPC ${phone.slice(-4)}`, role: "OPC" },
        });
        await db.smsCode.update({ where: { id: sms.id }, data: { used: true } });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    WeChat({
      clientId: process.env.WECHAT_CLIENT_ID ?? "",
      clientSecret: process.env.WECHAT_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role =
          token.role === "ADMIN" || token.role === "BIZ_OPC" || token.role === "OPC" ? token.role : "OPC";
      }
      return session;
    },
  },
});
