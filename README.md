# OPC Hub

OPC Hub is a Next.js App Router application for OPC service discovery, order matching, community collaboration, and admin operations.

## Stack

- Bun package manager
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL
- NextAuth/Auth.js v5
- Jest + React Testing Library

## Local Setup

```bash
bun install
cp .env.example .env.local
bunx prisma generate
bun run dev
```

Open `http://localhost:3004`.

The default `.env.local` database URL is a placeholder. Until a real PostgreSQL database is configured, pages that read statistics fall back to zero values.

## Commands

```bash
bun run lint
bun run test -- --runInBand
bun run build
bunx prisma validate
bunx prisma generate
bun run db:seed
```

## Seed Admin

The seed script creates or updates the default admin account:

- Email: `229230041@qq.com`
- Password: `admin123`

Override with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` in the runtime environment when needed.

## Routes

- `/` public homepage
- `/login` and `/register`
- `/screen` public real-time display
- `/tools`, `/finance`, `/legal`, `/banking`, `/equipment`, `/orders`, `/community` protected routes
- `/orders/new` requires `BIZ_OPC` or `ADMIN`
- `/admin` requires `ADMIN`
