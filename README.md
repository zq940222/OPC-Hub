# OPC Hub

OPC Hub 是一个基于 Next.js App Router 的 OPC 服务发现、订单撮合、社区协作和后台管理应用。

## 技术栈

- Bun 包管理器
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL
- NextAuth/Auth.js v5
- Jest + React Testing Library

## 本地启动

```bash
bun install
cp .env.example .env.local
bunx prisma generate
bun run dev
```

打开 `http://localhost:3004`。

默认 `.env.local` 中的数据库地址是占位值。配置真实 PostgreSQL 数据库前，读取统计数据的页面会回退为 0。

## 常用命令

```bash
bun run lint
bun run test -- --runInBand
bun run build
bunx prisma validate
bunx prisma generate
bun run db:seed
```

## 种子管理员

种子脚本会创建或更新默认管理员账号：

- 邮箱：`229230041@qq.com`
- 密码：`admin123`

如需覆盖默认账号，可在运行环境中配置 `SEED_ADMIN_EMAIL`、`SEED_ADMIN_PASSWORD` 和 `SEED_ADMIN_NAME`。

## 路由

- `/` 公开首页
- `/login` 和 `/register`
- `/screen` 公开实时大屏
- `/tools`、`/finance`、`/legal`、`/banking`、`/equipment`、`/orders`、`/community` 为登录后访问路由
- `/orders/new` 需要 `BIZ_OPC` 或 `ADMIN`
- `/admin` 需要 `ADMIN`
